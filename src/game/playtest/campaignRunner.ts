import { primaryReferenceBuildFor } from "../content/playtestPortfolios";
import { DEFAULT_GAME_RUNTIME, type GameRuntime } from "../runtime";
import type { GameCommand, GamePhase, GameState, LevelId, RoundReport } from "../types";

const STEP_SECONDS = 2;
const MAX_CAMPAIGN_SECONDS = 21_600;

export interface CampaignSiteResult {
  levelId: LevelId;
  buildName: string;
  startingMatter: number;
  endingMatter: number;
  startingCoreIntegrity: number;
  endingCoreIntegrity: number;
  reports: RoundReport[];
}

export interface CampaignPlaytestResult {
  success: boolean;
  stable: boolean;
  terminalPhase: GamePhase;
  completedLevelIds: LevelId[];
  simulatedSeconds: number;
  acceptedActions: number;
  rejectedActions: number;
  reusedTowerPlacements: number;
  minimumMatter: number;
  finalMatter: number;
  finalCoreIntegrity: number;
  retryCount: number;
  failure: string | null;
  sites: CampaignSiteResult[];
}

interface ActiveSite {
  levelId: LevelId;
  buildName: string;
  startingMatter: number;
  startingCoreIntegrity: number;
  reports: RoundReport[];
}

interface CampaignRunContext {
  runtime: GameRuntime;
  state: GameState;
  activeSite: ActiveSite;
  sites: CampaignSiteResult[];
  simulatedSeconds: number;
  acceptedActions: number;
  rejectedActions: number;
  reusedTowerPlacements: number;
  minimumMatter: number;
  planTowerSequence: number;
  towerAliases: Map<string, string>;
  reusedPlanTowers: Set<string>;
}

const saveRoundTrip = (state: GameState, runtime: GameRuntime): GameState => {
  const decoded = runtime.save.decode(runtime.save.encode(state));
  if (!decoded) throw new Error(`Campaign save failed to decode at ${state.campaign.levelId}.`);
  return decoded;
};

const beginSite = (state: GameState): ActiveSite => {
  const build = primaryReferenceBuildFor(state.campaign.levelId);
  return {
    levelId: state.campaign.levelId,
    buildName: build.name,
    startingMatter: state.matter,
    startingCoreIntegrity: state.coreIntegrity,
    reports: [],
  };
};

const recordReport = (site: ActiveSite, report: RoundReport | null): void => {
  if (!report || site.reports.some((entry) => entry.round === report.round)) return;
  site.reports.push(report);
};

const finishSite = (site: ActiveSite, state: GameState): CampaignSiteResult => ({
  ...site,
  endingMatter: state.matter,
  endingCoreIntegrity: state.coreIntegrity,
  reports: [...site.reports].sort((left, right) => left.round - right.round),
});

const result = (
  state: GameState,
  sites: CampaignSiteResult[],
  simulatedSeconds: number,
  acceptedActions: number,
  rejectedActions: number,
  reusedTowerPlacements: number,
  minimumMatter: number,
  stable: boolean,
  failure: string | null
): CampaignPlaytestResult => ({
  success: state.phase === "victory" && failure === null,
  stable,
  terminalPhase: state.phase,
  completedLevelIds: [...state.campaign.completedLevelIds],
  simulatedSeconds,
  acceptedActions,
  rejectedActions,
  reusedTowerPlacements,
  minimumMatter,
  finalMatter: state.matter,
  finalCoreIntegrity: state.coreIntegrity,
  retryCount: state.campaign.retryCount,
  failure,
  sites,
});

const contextResult = (
  context: CampaignRunContext,
  stable: boolean,
  failure: string | null
): CampaignPlaytestResult =>
  result(
    context.state,
    context.sites,
    context.simulatedSeconds,
    context.acceptedActions,
    context.rejectedActions,
    context.reusedTowerPlacements,
    context.minimumMatter,
    stable,
    failure
  );

const translatedTowerCommand = (
  context: CampaignRunContext,
  command: GameCommand
): GameCommand | null => {
  if (command.type !== "set_tower_targeting" && command.type !== "upgrade_tower") return command;
  const towerId = context.towerAliases.get(command.towerId) ?? command.towerId;
  const tower = context.state.towers[towerId];
  if (!context.reusedPlanTowers.has(command.towerId) || !tower) return { ...command, towerId };
  const chassis = context.runtime.definition.towers[tower.chassisId];
  if (command.type === "set_tower_targeting") {
    return chassis.targetPolicies.includes(command.policy) ? { ...command, towerId } : null;
  }
  return chassis.upgrades.some((upgrade) => upgrade.id === command.upgradeId)
    ? { ...command, towerId }
    : null;
};

const nextExpectedTowerId = (context: CampaignRunContext, command: GameCommand): string | null => {
  if (command.type !== "place_tower") return null;
  const towerId = `tower:${context.state.campaign.levelId}:${context.planTowerSequence}`;
  context.planTowerSequence += 1;
  return towerId;
};

const alreadyAppliedToReusedTower = (
  context: CampaignRunContext,
  command: GameCommand,
  code: string | null
): boolean =>
  code === "already_complete" &&
  (command.type === "upgrade_tower" || command.type === "set_tower_targeting") &&
  context.reusedPlanTowers.has(command.towerId);

const reuseCarriedTower = (
  context: CampaignRunContext,
  command: GameCommand,
  expectedTowerId: string | null,
  code: string | null
): boolean => {
  if (command.type !== "place_tower" || code !== "placement" || !expectedTowerId) return false;
  const carried = Object.values(context.state.towers).find(
    (tower) =>
      tower.provenance === "hull" &&
      tower.placement.anchor.column === command.anchor.column &&
      tower.placement.anchor.elevation === command.anchor.elevation &&
      tower.placement.mountFace === command.mountFace &&
      tower.placement.orientation === command.orientation
  );
  if (!carried) return false;
  context.towerAliases.set(expectedTowerId, carried.id);
  context.reusedPlanTowers.add(expectedTowerId);
  context.reusedTowerPlacements += 1;
  return true;
};

const executeBuildCommand = (
  context: CampaignRunContext,
  authoredCommand: GameCommand
): string | null => {
  const expectedTowerId = nextExpectedTowerId(context, authoredCommand);
  const command = translatedTowerCommand(context, authoredCommand);
  if (!command) return null;
  const towerIdsBefore = new Set(Object.keys(context.state.towers));
  const commandResult = context.runtime.execute(context.state, command);
  if (!commandResult.accepted) {
    if (alreadyAppliedToReusedTower(context, authoredCommand, commandResult.code)) return null;
    if (reuseCarriedTower(context, command, expectedTowerId, commandResult.code)) return null;
    context.rejectedActions += 1;
    return `${context.state.campaign.levelId} wave ${context.state.campaign.roundIndex + 1} rejected ${JSON.stringify(command)}: ${commandResult.code ?? "unknown"}.`;
  }
  context.acceptedActions += 1;
  context.state = commandResult.state;
  if (expectedTowerId) {
    const createdTowerId = Object.keys(context.state.towers).find((id) => !towerIdsBefore.has(id));
    if (!createdTowerId) throw new Error(`Placement did not create ${expectedTowerId}.`);
    context.towerAliases.set(expectedTowerId, createdTowerId);
  }
  context.minimumMatter = Math.min(context.minimumMatter, context.state.matter);
  return null;
};

const runBuildPhase = (context: CampaignRunContext): string | null => {
  const plan = primaryReferenceBuildFor(context.state.campaign.levelId);
  const commands = plan.rounds[context.state.campaign.roundIndex]?.commands ?? [];
  for (const command of commands) {
    const failure = executeBuildCommand(context, command);
    if (failure) return failure;
  }
  const assault = context.runtime.execute(context.state, { type: "start_assault" });
  if (!assault.accepted) {
    context.rejectedActions += 1;
    return `${context.state.campaign.levelId} could not start wave ${context.state.campaign.roundIndex + 1}: ${assault.code ?? "unknown"}.`;
  }
  context.acceptedActions += 1;
  context.state = saveRoundTrip(assault.state, context.runtime);
  return null;
};

const continueAfterRound = (context: CampaignRunContext): void => {
  recordReport(context.activeSite, context.state.lastReport);
  const continued = context.runtime.execute(context.state, { type: "continue_round" });
  if (!continued.accepted) throw new Error(continued.code ?? "Could not continue the campaign.");
  context.acceptedActions += 1;
  context.state = saveRoundTrip(continued.state, context.runtime);
};

const beginNextSite = (context: CampaignRunContext): void => {
  recordReport(context.activeSite, context.state.lastReport);
  context.sites.push(finishSite(context.activeSite, context.state));
  const traveling = context.runtime.execute(context.state, { type: "start_next_level" });
  if (!traveling.accepted) throw new Error(traveling.code ?? "Could not leave the cleared site.");
  const docked = context.runtime.execute(traveling.state, { type: "dock_at_site" });
  if (!docked.accepted) throw new Error(docked.code ?? "Could not dock at the next site.");
  const next = context.runtime.execute(docked.state, { type: "begin_level" });
  if (!next.accepted) throw new Error(next.code ?? "Could not begin the next site.");
  context.acceptedActions += 3;
  context.state = saveRoundTrip(next.state, context.runtime);
  context.activeSite = beginSite(context.state);
  context.planTowerSequence = 1;
  context.towerAliases = new Map<string, string>();
  context.reusedPlanTowers = new Set<string>();
};

const terminalResult = (
  context: CampaignRunContext,
  failure: string | null
): CampaignPlaytestResult => {
  recordReport(context.activeSite, context.state.lastReport);
  context.sites.push(finishSite(context.activeSite, context.state));
  return contextResult(context, true, failure);
};

const runCampaignPhase = (context: CampaignRunContext): CampaignPlaytestResult | null => {
  if (context.state.phase === "defeat")
    return terminalResult(context, `${context.state.campaign.levelId} ended in defeat.`);
  if (context.state.phase === "victory") return terminalResult(context, null);
  if (context.state.phase === "build") {
    const failure = runBuildPhase(context);
    return failure ? contextResult(context, true, failure) : null;
  }
  if (context.state.phase === "round_result") {
    continueAfterRound(context);
    return null;
  }
  if (context.state.phase === "level_complete") {
    beginNextSite(context);
    return null;
  }
  context.state = context.runtime.step(context.state, STEP_SECONDS);
  context.simulatedSeconds += STEP_SECONDS;
  return null;
};

/** Runs the primary authored defense through one continuous, save-backed campaign state. */
export const runReferenceCampaign = (
  runtime: GameRuntime = DEFAULT_GAME_RUNTIME
): CampaignPlaytestResult => {
  const entered = runtime.execute(runtime.createInitial(), { type: "begin_level" });
  if (!entered.accepted) throw new Error(entered.code ?? "Could not begin the campaign.");
  const initialState = saveRoundTrip(entered.state, runtime);
  const context: CampaignRunContext = {
    runtime,
    state: initialState,
    activeSite: beginSite(initialState),
    sites: [],
    simulatedSeconds: 0,
    acceptedActions: 1,
    rejectedActions: 0,
    reusedTowerPlacements: 0,
    minimumMatter: initialState.matter,
    planTowerSequence: 1,
    towerAliases: new Map<string, string>(),
    reusedPlanTowers: new Set<string>(),
  };

  while (context.simulatedSeconds < MAX_CAMPAIGN_SECONDS) {
    context.minimumMatter = Math.min(context.minimumMatter, context.state.matter);
    const terminal = runCampaignPhase(context);
    if (terminal) return terminal;
  }

  return contextResult(context, false, "Campaign exceeded the simulation time limit.");
};
