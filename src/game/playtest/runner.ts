import { DEFAULT_GAME_RUNTIME, type GameRuntime } from "../runtime";
import {
  DAMAGE_SOURCE_IDS,
  type DamageSourceId,
  type GameCommand,
  type GameState,
  type LevelId,
  type RoundReport,
} from "../types";
import { doNothingPlan, intendedPlan, randomPlan, seededRandom } from "./policies";
import type {
  ActionBand,
  EvaluationOptions,
  LevelEvaluation,
  PlaytestPlan,
  PlaytestResult,
} from "./types";

const MAX_SIMULATED_SECONDS = 1_800;
const STEP_SECONDS = 2;

interface PlannedCommand {
  command: GameCommand;
  complete: boolean;
  lastRoundAttempt: number | null;
}

interface TrialCounters {
  accepted: number;
  rejected: number;
  reports: RoundReport[];
}

const recurring = (command: GameCommand): boolean =>
  command.type === "charge_gas_source" || command.type === "charge_liquid_source";

const attemptCommand = (
  source: GameState,
  planned: PlannedCommand,
  counters: TrialCounters,
  runtime: GameRuntime
): { state: GameState; progressed: boolean } => {
  if (planned.complete) return { state: source, progressed: false };
  if (recurring(planned.command) && planned.lastRoundAttempt === source.campaign.roundIndex) {
    return { state: source, progressed: false };
  }
  const result = runtime.execute(source, planned.command);
  planned.lastRoundAttempt = source.campaign.roundIndex;
  if (!result.accepted) {
    counters.rejected += 1;
    return { state: source, progressed: false };
  }
  counters.accepted += 1;
  if (!recurring(planned.command)) planned.complete = true;
  return { state: result.state, progressed: true };
};

const applyPass = (
  source: GameState,
  commands: PlannedCommand[],
  counters: TrialCounters,
  runtime: GameRuntime
): { state: GameState; progressed: boolean } => {
  let state = source;
  let progressed = false;
  for (const planned of commands) {
    const attempt = attemptCommand(state, planned, counters, runtime);
    state = attempt.state;
    progressed ||= attempt.progressed;
  }
  return { state, progressed };
};

const applyPlan = (
  source: GameState,
  commands: PlannedCommand[],
  counters: TrialCounters,
  runtime: GameRuntime
): GameState => {
  let state = source;
  for (let pass = 0; pass < 4; pass += 1) {
    const result = applyPass(state, commands, counters, runtime);
    state = result.state;
    if (!result.progressed) break;
  }
  return state;
};

const recordReport = (report: RoundReport | null, counters: TrialCounters): void => {
  if (!report) return;
  const exists = counters.reports.some(
    (entry) => entry.levelId === report.levelId && entry.round === report.round
  );
  if (!exists) counters.reports.push(report);
};

const finishResult = (
  state: GameState,
  plan: PlaytestPlan,
  counters: TrialCounters,
  simulatedSeconds: number,
  stable: boolean,
  runtime: GameRuntime
): PlaytestResult => {
  recordReport(state.lastReport, counters);
  const success = state.phase === "level_complete" || state.phase === "victory";
  const sourceTotals = (key: "damageBySource" | "killsBySource") =>
    Object.fromEntries(
      DAMAGE_SOURCE_IDS.map((sourceId) => [
        sourceId,
        counters.reports.reduce((total, report) => total + report[key][sourceId], 0),
      ])
    ) as Record<DamageSourceId, number>;
  return {
    levelId: state.campaign.levelId,
    planName: plan.name,
    success,
    terminalPhase: state.phase,
    coreIntegrity: state.coreIntegrity,
    roundsCleared: success
      ? runtime.definition.levels[state.campaign.levelId].rounds.length
      : counters.reports.length,
    killed: counters.reports.reduce((total, report) => total + report.killed, 0),
    breached: counters.reports.reduce((total, report) => total + report.breached, 0),
    coreDamage: counters.reports.reduce((total, report) => total + report.coreDamage, 0),
    fieldDamageAbsorbed: counters.reports.reduce(
      (total, report) => total + report.fieldDamageAbsorbed,
      0
    ),
    damageBySource: sourceTotals("damageBySource"),
    killsBySource: sourceTotals("killsBySource"),
    plannedActions: plan.commands.length,
    acceptedActions: counters.accepted,
    rejectedActions: counters.rejected,
    simulatedSeconds,
    stable,
    reports: [...counters.reports].sort((left, right) => left.round - right.round),
  };
};

const enterLevel = (levelId: LevelId, runtime: GameRuntime): GameState => {
  const result = runtime.execute(runtime.createScenario(levelId), { type: "begin_level" });
  if (!result.accepted) throw new Error(result.code ?? `Could not enter ${levelId}`);
  return result.state;
};

export const runPlan = (
  levelId: LevelId,
  plan: PlaytestPlan,
  runtime: GameRuntime = DEFAULT_GAME_RUNTIME
): PlaytestResult => {
  let state = enterLevel(levelId, runtime);
  let simulatedSeconds = 0;
  const commands = plan.commands.map((command) => ({
    command,
    complete: false,
    lastRoundAttempt: null,
  }));
  const counters: TrialCounters = { accepted: 0, rejected: 0, reports: [] };
  while (simulatedSeconds < MAX_SIMULATED_SECONDS) {
    if (state.phase === "build") {
      state = applyPlan(state, commands, counters, runtime);
      state = runtime.execute(state, { type: "start_prime" }).state;
      continue;
    }
    if (state.phase === "round_result") {
      recordReport(state.lastReport, counters);
      state = runtime.execute(state, { type: "continue_round" }).state;
      continue;
    }
    if (["level_complete", "victory", "defeat"].includes(state.phase)) {
      return finishResult(state, plan, counters, simulatedSeconds, true, runtime);
    }
    if (state.phase === "prime") {
      const earlyLockAt = runtime.round(state).primeSeconds * plan.primeFraction;
      if (state.phaseTime >= earlyLockAt) {
        state = runtime.execute(state, { type: "start_assault" }).state;
        continue;
      }
    }
    state = runtime.step(state, STEP_SECONDS);
    simulatedSeconds += STEP_SECONDS;
  }
  return finishResult(state, plan, counters, simulatedSeconds, false, runtime);
};

const actionBands = (trials: PlaytestResult[]): ActionBand[] => {
  const counts = [...new Set(trials.map((trial) => trial.plannedActions))].sort(
    (left, right) => left - right
  );
  return counts.map((actions) => {
    const matching = trials.filter((trial) => trial.plannedActions === actions);
    const passes = matching.filter((trial) => trial.success).length;
    return {
      actions,
      trials: matching.length,
      passes,
      passRate: passes / matching.length,
      averageCore:
        matching.reduce((total, trial) => total + trial.coreIntegrity, 0) / matching.length,
    };
  });
};

export const evaluateLevel = (
  options: EvaluationOptions,
  runtime: GameRuntime = DEFAULT_GAME_RUNTIME
): LevelEvaluation => {
  const random = seededRandom(options.seed);
  const randomTrials = Array.from({ length: options.runs }, () => {
    const quality = random.next();
    return runPlan(options.levelId, randomPlan(options.levelId, quality, random), runtime);
  });
  return {
    levelId: options.levelId,
    doNothing: runPlan(options.levelId, doNothingPlan(), runtime),
    intended: runPlan(options.levelId, intendedPlan(options.levelId), runtime),
    randomTrials,
    actionBands: actionBands(randomTrials),
  };
};
