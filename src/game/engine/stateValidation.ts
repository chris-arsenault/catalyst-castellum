import type { GameDefinition } from "../definitionTypes";
import {
  TRANSPORT_RUN_IDS,
  type GameState,
  type GridCell,
  type ScenarioAvailability,
  type TransportPhase,
  type TransportRunId,
} from "../types";
import { gasAmountTotal, liquidAmountTotal } from "./roomState";
import { validateEnemyNavigation } from "./enemyNavigationValidation";

export type StateValidationCode =
  | "availability_mismatch"
  | "campaign_mismatch"
  | "conduit_installation_mismatch"
  | "conduit_route_invalid"
  | "enemy_navigation_invalid"
  | "identity_mismatch"
  | "identifier_sequence_invalid"
  | "phase_invariant_invalid"
  | "portal_identity_mismatch";

export interface StateValidationIssue {
  code: StateValidationCode;
  path: string;
  message: string;
}

const issue = (
  issues: StateValidationIssue[],
  code: StateValidationCode,
  path: string,
  message: string
): void => {
  issues.push({ code, path, message });
};

const sameCell = (left: GridCell | undefined, right: GridCell | undefined): boolean =>
  Boolean(left && right && left.column === right.column && left.elevation === right.elevation);

const routeStepIsOrthogonal = (left: GridCell, right: GridCell): boolean =>
  Math.abs(left.column - right.column) + Math.abs(left.elevation - right.elevation) === 1;

const sameIdentifiers = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length &&
  new Set(actual).size === actual.length &&
  expected.every((id) => actual.includes(id));

const validateAvailability = (
  state: GameState,
  expected: ScenarioAvailability,
  issues: StateValidationIssue[]
): void => {
  const fields = ["equipment", "gasRuns", "liquidRuns", "gasSources", "liquidSources"] as const;
  for (const field of fields) {
    if (!sameIdentifiers(state.availability[field], expected[field])) {
      issue(
        issues,
        "availability_mismatch",
        `availability.${field}`,
        `Availability does not match level ${state.campaign.levelId} round ${state.campaign.roundIndex + 1}.`
      );
    }
  }
};

const validateCampaign = (
  state: GameState,
  issues: StateValidationIssue[],
  definition: GameDefinition
): void => {
  const { campaign } = state;
  const level = definition.levels[campaign.levelId];
  if (campaign.levelIndex !== definition.levelOrder.indexOf(campaign.levelId)) {
    issue(
      issues,
      "campaign_mismatch",
      "campaign.levelIndex",
      "Campaign level index does not identify the selected level."
    );
  }
  if (campaign.checkpointLevelId !== campaign.levelId) {
    issue(
      issues,
      "campaign_mismatch",
      "campaign.checkpointLevelId",
      "Checkpoint and active level must identify the same scenario."
    );
  }
  if (campaign.roundIndex >= level.rounds.length) {
    issue(
      issues,
      "campaign_mismatch",
      "campaign.roundIndex",
      "Campaign round index is outside the selected level."
    );
    return;
  }
  if (new Set(campaign.completedLevelIds).size !== campaign.completedLevelIds.length) {
    issue(
      issues,
      "identifier_sequence_invalid",
      "campaign.completedLevelIds",
      "Completed levels contain duplicate identifiers."
    );
  }
  validateAvailability(state, level.rounds[campaign.roundIndex]!.availability, issues);
};

const unauthoredConduitAmount = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): number =>
  phase === "gas"
    ? gasAmountTotal(state.gasConduits[runId].gas)
    : liquidAmountTotal(state.liquidConduits[runId].liquid);

const validateUnauthoredConduit = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  issues: StateValidationIssue[]
): void => {
  const conduit = phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];
  const hasState =
    conduit.route.length > 0 ||
    conduit.installed ||
    conduit.enabled ||
    unauthoredConduitAmount(state, runId, phase) > 0.001;
  if (!hasState) return;
  issue(
    issues,
    "conduit_installation_mismatch",
    `${phase}Conduits.${runId}`,
    `State exists for an unauthored ${phase} conduit.`
  );
};

const validateRouteEndpoints = (
  route: readonly GridCell[],
  blueprint: readonly GridCell[],
  path: string,
  issues: StateValidationIssue[]
): void => {
  if (!sameCell(route[0], blueprint[0])) {
    issue(
      issues,
      "conduit_route_invalid",
      `${path}.route.0`,
      "Conduit route does not start at its authored endpoint."
    );
  }
  if (!sameCell(route.at(-1), blueprint.at(-1))) {
    issue(
      issues,
      "conduit_route_invalid",
      `${path}.route.${route.length - 1}`,
      "Conduit route does not end at its authored endpoint."
    );
  }
};

const validateRouteCells = (
  route: readonly GridCell[],
  path: string,
  issues: StateValidationIssue[],
  definition: GameDefinition
): void => {
  for (const [index, cell] of route.entries()) {
    if (!definition.facility.inBounds(cell)) {
      issue(
        issues,
        "conduit_route_invalid",
        `${path}.route.${index}`,
        "Conduit route leaves the facility bounds."
      );
    }
    const previous = route[index - 1];
    if (previous && !routeStepIsOrthogonal(previous, cell)) {
      issue(
        issues,
        "conduit_route_invalid",
        `${path}.route.${index}`,
        "Conduit route must use contiguous orthogonal cells."
      );
    }
  }
};

const validateRoute = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  issues: StateValidationIssue[],
  gameDefinition: GameDefinition
): void => {
  const definition = gameDefinition.transportRuns[runId][phase];
  const conduit = phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];
  const path = `${phase}Conduits.${runId}`;
  if (!definition) {
    validateUnauthoredConduit(state, runId, phase, issues);
    return;
  }
  if (conduit.enabled && !conduit.installed) {
    issue(
      issues,
      "conduit_installation_mismatch",
      `${path}.enabled`,
      "An enabled conduit must be installed."
    );
  }
  if (conduit.route.length < 2) {
    issue(
      issues,
      "conduit_route_invalid",
      `${path}.route`,
      "An authored conduit route must contain at least two cells."
    );
    return;
  }
  validateRouteEndpoints(conduit.route, definition.blueprint, path, issues);
  validateRouteCells(conduit.route, path, issues, gameDefinition);
};

const validateTopology = (
  state: GameState,
  issues: StateValidationIssue[],
  definition: GameDefinition
): void => {
  for (const runId of TRANSPORT_RUN_IDS) {
    validateRoute(state, runId, "gas", issues, definition);
    validateRoute(state, runId, "liquid", issues, definition);
  }
  for (const roomId of definition.roomOrder) {
    if (state.rooms[roomId].id !== roomId) {
      issue(
        issues,
        "identity_mismatch",
        `rooms.${roomId}.id`,
        "Room identity does not match its record key."
      );
    }
  }
  const expectedPortals = definition.facilityMap.portals.map(({ id }) => id);
  if (!sameIdentifiers(Object.keys(state.portalStates), expectedPortals)) {
    issue(
      issues,
      "portal_identity_mismatch",
      "portalStates",
      "Portal state keys do not match the active facility."
    );
  }
};

const validatePhaseOwnership = (state: GameState, issues: StateValidationIssue[]): void => {
  if (state.paused && state.phase !== "prime" && state.phase !== "assault") {
    issue(
      issues,
      "phase_invariant_invalid",
      "paused",
      "Only a live prime or assault may be paused."
    );
  }
  if (state.phase === "prime" && (state.spawnCursor !== 0 || state.enemies.length > 0)) {
    issue(
      issues,
      "phase_invariant_invalid",
      "phase",
      "Prime cannot contain spawned enemies or an advanced wave cursor."
    );
  }
  if (
    ["level_briefing", "build", "round_result", "level_complete", "victory"].includes(
      state.phase
    ) &&
    state.enemies.length > 0
  ) {
    issue(issues, "phase_invariant_invalid", "enemies", `${state.phase} must not retain enemies.`);
  }
};

const validateNextIdentifiers = (state: GameState, issues: StateValidationIssue[]): void => {
  const maximumEnemyId = state.enemies.reduce((maximum, enemy) => Math.max(maximum, enemy.id), 0);
  if (state.nextEnemyId <= maximumEnemyId) {
    issue(
      issues,
      "identifier_sequence_invalid",
      "nextEnemyId",
      "Next enemy identity must be greater than all recorded enemies."
    );
  }
  const maximumEventId = state.events.reduce((maximum, event) => Math.max(maximum, event.id), 0);
  if (state.nextEventId <= maximumEventId) {
    issue(
      issues,
      "identifier_sequence_invalid",
      "nextEventId",
      "Next event identity must be greater than all recorded events."
    );
  }
  const maximumIncidentId = state.incidents.reduce(
    (maximum, incident) => Math.max(maximum, incident.id),
    0
  );
  if (state.nextIncidentId <= maximumIncidentId) {
    issue(
      issues,
      "identifier_sequence_invalid",
      "nextIncidentId",
      "Next incident identity must be greater than all recorded incidents."
    );
  }
};

const validatePhase = (
  state: GameState,
  issues: StateValidationIssue[],
  definition: GameDefinition
): void => {
  validatePhaseOwnership(state, issues);
  const waveLength =
    definition.levels[state.campaign.levelId].rounds[state.campaign.roundIndex]?.wave.length;
  if (waveLength !== undefined && state.spawnCursor > waveLength) {
    issue(
      issues,
      "phase_invariant_invalid",
      "spawnCursor",
      "Spawn cursor exceeds the active wave."
    );
  }
  validateNextIdentifiers(state, issues);
};

export const validateGameState = (
  state: GameState,
  definition: GameDefinition
): StateValidationIssue[] => {
  const issues: StateValidationIssue[] = [];
  if (
    state.pack.id !== definition.packId ||
    state.pack.contentVersion !== definition.contentVersion
  ) {
    issue(
      issues,
      "identity_mismatch",
      "pack",
      "Game state pack identity does not match the active definition."
    );
  }
  validateCampaign(state, issues, definition);
  validateTopology(state, issues, definition);
  validateEnemyNavigation(state, issues, definition);
  validatePhase(state, issues, definition);
  return issues;
};

export const gameStateIsValid = (state: GameState, definition: GameDefinition): boolean =>
  validateGameState(state, definition).length === 0;

export const assertValidGameState = (state: GameState, definition: GameDefinition): void => {
  const issues = validateGameState(state, definition);
  if (issues.length === 0) return;
  const summary = issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
  throw new Error(`Invalid game state: ${summary}`);
};
