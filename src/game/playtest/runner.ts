import { DEFAULT_GAME_RUNTIME, type GameRuntime } from "../runtime";
import {
  DAMAGE_SOURCE_IDS,
  type DamageSourceId,
  type GameCommand,
  type GameState,
  type HazardChannels,
  type LevelId,
  type RoundReport,
} from "../types";
import { playtestPortfolioFor } from "../content/playtestPortfolios";
import { doNothingPlan, mutatedReferencePlan, referencePlans, seededRandom } from "./policies";
import type {
  ActionBand,
  BuildProfile,
  DiversityEvaluation,
  DiversityRequirement,
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
}

interface TrialCounters {
  accepted: number;
  rejected: number;
  reports: RoundReport[];
}

const attemptCommand = (
  source: GameState,
  planned: PlannedCommand,
  counters: TrialCounters,
  runtime: GameRuntime
): { state: GameState; progressed: boolean } => {
  if (planned.complete) return { state: source, progressed: false };
  const result = runtime.execute(source, planned.command);
  if (!result.accepted) {
    counters.rejected += 1;
    return { state: source, progressed: false };
  }
  counters.accepted += 1;
  planned.complete = true;
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

const sourceTotals = (
  reports: readonly RoundReport[],
  key: "damageBySource" | "killsBySource" | "fieldDamageAbsorbedBySource"
): Record<DamageSourceId, number> =>
  Object.fromEntries(
    DAMAGE_SOURCE_IDS.map((sourceId) => [
      sourceId,
      reports.reduce((total, report) => total + report[key][sourceId], 0),
    ])
  ) as Record<DamageSourceId, number>;

const damageChannels = (reports: readonly RoundReport[]): HazardChannels =>
  reports.reduce<HazardChannels>(
    (total, report) => ({
      atmosphere: total.atmosphere + report.damageByChannel.atmosphere,
      corrosion: total.corrosion + report.damageByChannel.corrosion,
      heat: total.heat + report.damageByChannel.heat,
      pressure: total.pressure + report.damageByChannel.pressure,
      radiation: total.radiation + report.damageByChannel.radiation,
    }),
    { atmosphere: 0, corrosion: 0, heat: 0, pressure: 0, radiation: 0 }
  );

const buildProfileFor = (
  state: GameState,
  damageBySource: Record<DamageSourceId, number>
): BuildProfile => ({
  equipment: Object.values(state.rooms)
    .flatMap((room) =>
      Object.entries(room.equipment).flatMap(([socketId, instance]) =>
        instance
          ? [
              `${room.id}:${socketId}:${instance.equipmentId}:${instance.level}:${instance.enabled ? "on" : "off"}`,
            ]
          : []
      )
    )
    .sort(),
  enabledGasLines: Object.entries(state.gasConduits)
    .flatMap(([id, conduit]) => (conduit.enabled ? [id] : []))
    .sort(),
  enabledLiquidLines: Object.entries(state.liquidConduits)
    .flatMap(([id, conduit]) => (conduit.enabled ? [id] : []))
    .sort(),
  activeDamageSources: DAMAGE_SOURCE_IDS.filter((sourceId) => damageBySource[sourceId] > 0.01),
});

const buildSignatureFor = (profile: BuildProfile): string =>
  [
    ...profile.equipment.map((entry) => `equipment:${entry}`),
    ...profile.enabledGasLines.map((id) => `gas-line:${id}`),
    ...profile.enabledLiquidLines.map((id) => `liquid-line:${id}`),
    ...profile.activeDamageSources.map((sourceId) => `damage:${sourceId}`),
  ]
    .sort()
    .join("|");

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
  const damageBySource = sourceTotals(counters.reports, "damageBySource");
  const killsBySource = sourceTotals(counters.reports, "killsBySource");
  const damageByChannel = damageChannels(counters.reports);
  const buildProfile = buildProfileFor(state, damageBySource);
  const buildSignature = buildSignatureFor(buildProfile);
  const pulseDamage = damageBySource.hydrogen_oxygen_combustion;
  const continuousDamage = DAMAGE_SOURCE_IDS.filter(
    (sourceId) => sourceId !== "hydrogen_oxygen_combustion"
  ).reduce((total, sourceId) => total + damageBySource[sourceId], 0);
  const matterHarvested = counters.reports.reduce(
    (total, report) => total + report.matterHarvested,
    0
  );
  const startingMatter = runtime.definition.levels[state.campaign.levelId].startingMatter;
  return {
    levelId: state.campaign.levelId,
    planName: plan.name,
    archetype: plan.archetype,
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
    fieldDamageAbsorbedBySource: sourceTotals(counters.reports, "fieldDamageAbsorbedBySource"),
    damageBySource,
    killsBySource,
    damageByChannel,
    pulseDamage,
    continuousDamage,
    matterSpent: startingMatter + matterHarvested - state.matter,
    buildProfile,
    buildSignature,
    plannedActions: plan.rounds.reduce((total, round) => total + round.commands.length, 0),
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

const terminal = (state: GameState): boolean =>
  state.phase === "level_complete" || state.phase === "victory" || state.phase === "defeat";

const plannedTransition = (
  state: GameState,
  plan: PlaytestPlan,
  commandsByRound: PlannedCommand[][],
  counters: TrialCounters,
  runtime: GameRuntime
): GameState | null => {
  if (state.phase === "build") {
    const configured = applyPlan(
      state,
      commandsByRound[state.campaign.roundIndex] ?? [],
      counters,
      runtime
    );
    return runtime.execute(configured, { type: "start_prime" }).state;
  }
  if (state.phase === "round_result") {
    recordReport(state.lastReport, counters);
    return runtime.execute(state, { type: "continue_round" }).state;
  }
  if (state.phase !== "prime") return null;
  const primeFraction = plan.rounds[state.campaign.roundIndex]?.primeFraction ?? 1;
  const earlyLockAt = runtime.round(state).primeSeconds * primeFraction;
  return state.phaseTime >= earlyLockAt
    ? runtime.execute(state, { type: "start_assault" }).state
    : null;
};

export const runPlan = (
  levelId: LevelId,
  plan: PlaytestPlan,
  runtime: GameRuntime = DEFAULT_GAME_RUNTIME
): PlaytestResult => {
  let state = enterLevel(levelId, runtime);
  let simulatedSeconds = 0;
  const commandsByRound = plan.rounds.map((round) =>
    round.commands.map((command) => ({ command, complete: false }))
  );
  const counters: TrialCounters = { accepted: 0, rejected: 0, reports: [] };
  while (simulatedSeconds < MAX_SIMULATED_SECONDS) {
    if (terminal(state)) {
      return finishResult(state, plan, counters, simulatedSeconds, true, runtime);
    }
    const transitioned = plannedTransition(state, plan, commandsByRound, counters, runtime);
    if (transitioned) {
      state = transitioned;
      continue;
    }
    state = runtime.step(state, STEP_SECONDS);
    simulatedSeconds += STEP_SECONDS;
  }
  return finishResult(state, plan, counters, simulatedSeconds, false, runtime);
};

export const evaluateDiversity = (
  requirements: DiversityRequirement,
  references: PlaytestResult[]
): DiversityEvaluation => {
  const passing = references.filter((result) => result.success && result.stable);
  const passingArchetypes = [
    ...new Set(passing.flatMap((result) => (result.archetype === null ? [] : [result.archetype]))),
  ].sort();
  const distinctPassingSignatures = new Set(passing.map((result) => result.buildSignature)).size;
  const issues: string[] = [];
  if (passing.length < requirements.minimumPassingBuilds) {
    issues.push(
      `${passing.length}/${requirements.minimumPassingBuilds} required reference builds pass.`
    );
  }
  if (passingArchetypes.length < requirements.minimumPassingArchetypes) {
    issues.push(
      `${passingArchetypes.length}/${requirements.minimumPassingArchetypes} required archetypes pass.`
    );
  }
  if (distinctPassingSignatures < requirements.minimumDistinctSignatures) {
    issues.push(
      `${distinctPassingSignatures}/${requirements.minimumDistinctSignatures} required build signatures pass.`
    );
  }
  return {
    ...requirements,
    passingBuilds: passing.length,
    passingArchetypes,
    distinctPassingSignatures,
    satisfied: issues.length === 0,
    issues,
  };
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
  const mutationTrials = Array.from({ length: options.runs }, () => {
    const quality = random.next();
    return runPlan(
      options.levelId,
      mutatedReferencePlan(options.levelId, quality, random),
      runtime
    );
  });
  const references = referencePlans(options.levelId).map((plan) =>
    runPlan(options.levelId, plan, runtime)
  );
  return {
    levelId: options.levelId,
    doNothing: runPlan(options.levelId, doNothingPlan(), runtime),
    references,
    mutationTrials,
    actionBands: actionBands(mutationTrials),
    diversity: evaluateDiversity(playtestPortfolioFor(options.levelId).requirements, references),
  };
};
