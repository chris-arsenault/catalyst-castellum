import type { GameDefinition } from "../definitionTypes";
import type { GameState, TowerInstance, TowerUpgradeDefinition } from "../types";
import { towerPlacementIssue } from "./towerPlacement";
import type { StateValidationIssue } from "./stateValidationTypes";

const issue = (issues: StateValidationIssue[], path: string, message: string): void => {
  issues.push({ code: "tower_state_invalid", path, message });
};

export const validateTowerStates = (
  state: GameState,
  definition: GameDefinition
): StateValidationIssue[] => {
  const issues: StateValidationIssue[] = [];
  for (const [towerId, tower] of Object.entries(state.towers)) {
    validateTowerInstance(state, definition, towerId, tower, issues);
  }
  validateTowerAttacks(state, issues);
  validateTowerSupply(state, issues);
  return issues;
};

const validateTowerInstance = (
  state: GameState,
  definition: GameDefinition,
  towerId: string,
  tower: TowerInstance,
  issues: StateValidationIssue[]
): void => {
  const path = `towers.${towerId}`;
  if (tower.id !== towerId) issue(issues, `${path}.id`, "Tower key and instance ID differ.");
  const chassis = definition.towers[tower.chassisId];
  if (!chassis) {
    issue(issues, `${path}.chassisId`, "Tower chassis is not authored.");
    return;
  }
  if (!chassis.targetPolicies.includes(tower.targetPolicy))
    issue(issues, `${path}.targetPolicy`, "Target policy is unavailable for this chassis.");
  if (new Set(tower.upgrades).size !== tower.upgrades.length)
    issue(issues, `${path}.upgrades`, "Tower upgrades contain duplicate identifiers.");
  for (const upgradeId of tower.upgrades) {
    validateTowerUpgrade(tower, upgradeId, chassis.upgrades, path, issues);
  }
  const placement = towerPlacementIssue(
    state,
    tower.chassisId,
    tower.placement,
    definition,
    tower.id
  );
  if (placement) issue(issues, `${path}.placement`, `Tower placement is invalid: ${placement}.`);
  if (towerCountersAreNegative(tower))
    issue(issues, path, "Tower runtime counters must be nonnegative.");
};

const towerCountersAreNegative = (tower: TowerInstance): boolean =>
  tower.cooldown < 0 || tower.damageDealt < 0 || tower.kills < 0 || tower.shots < 0;

const validateTowerUpgrade = (
  tower: TowerInstance,
  upgradeId: string,
  upgrades: readonly TowerUpgradeDefinition[],
  path: string,
  issues: StateValidationIssue[]
): void => {
  const upgrade = upgrades.find((candidate) => candidate.id === upgradeId);
  if (!upgrade) {
    issue(issues, `${path}.upgrades`, `Upgrade ${upgradeId} is outside this chassis tree.`);
    return;
  }
  if (!upgrade.requires.every((required) => tower.upgrades.includes(required)))
    issue(issues, `${path}.upgrades`, `Upgrade ${upgradeId} lacks its prerequisite.`);
};

const validateTowerAttacks = (state: GameState, issues: StateValidationIssue[]): void => {
  if (new Set(state.towerAttacks.map(({ id }) => id)).size !== state.towerAttacks.length)
    issue(issues, "towerAttacks", "Tower attack event IDs must be unique.");
  for (const [index, attack] of state.towerAttacks.entries()) {
    if (!(attack.towerId in state.towers))
      issue(issues, `towerAttacks.${index}.towerId`, "Attack references a missing tower.");
    if (attack.expiresAt < attack.startedAt)
      issue(issues, `towerAttacks.${index}.expiresAt`, "Attack expires before it starts.");
  }
};

const validateTowerSupply = (state: GameState, issues: StateValidationIssue[]): void => {
  for (const [towerId, status] of Object.entries(state.towerSupply)) {
    validateSupplyStatus(state, towerId, status, issues);
  }
};

const validateSupplyStatus = (
  state: GameState,
  towerId: string,
  status: GameState["towerSupply"][string],
  issues: StateValidationIssue[]
): void => {
  if (!(towerId in state.towers) || status.towerId !== towerId)
    issue(issues, `towerSupply.${towerId}`, "Supply status references a missing tower.");
  if (!(status.destinationRoomId in state.rooms))
    issue(issues, `towerSupply.${towerId}.destinationRoomId`, "Supply destination is missing.");
  if (status.storedAmount > status.capacity + 0.0001)
    issue(issues, `towerSupply.${towerId}.storedAmount`, "Tower supply exceeds local capacity.");
  for (const connectionId of status.connectionIds) {
    if (!(connectionId in state.map.connections))
      issue(issues, `towerSupply.${towerId}.connectionIds`, "Supply line is missing.");
  }
};
