import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandResult,
  GameCommand,
  GameState,
  TowerInstance,
} from "../types";
import { acceptCommand } from "./commandResult";
import { addEvent } from "./events";
import { cloneGame } from "./roomState";
import { resolveTowerPlacement, towerPlacementProvenance } from "./towerPlacement";

const towerId = (state: GameState): string =>
  `tower:${state.campaign.levelId}:${state.nextTowerSequence}`;

export const placeTowerCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "place_tower" }>,
  decision: CommandDecision,
  definition: GameDefinition
): CommandResult => {
  const state = cloneGame(source);
  const placement = resolveTowerPlacement(
    command.chassisId,
    command.anchor,
    command.mountFace,
    command.orientation,
    definition
  );
  const id = towerId(state);
  const instance: TowerInstance = {
    id,
    chassisId: command.chassisId,
    placement,
    provenance: towerPlacementProvenance(state, placement),
    upgrades: [],
    targetPolicy: definition.towers[command.chassisId].targetPolicies[0] ?? "first",
    cooldown: 0,
    localResources: { gas: {}, liquid: {} },
    currentTargetIds: [],
    damageDealt: 0,
    kills: 0,
    shots: 0,
    totalMatterSpent: decision.cost,
    downtimeReason: "no_target",
    telemetry: {
      engagedSeconds: 0,
      targetsServiced: 0,
      overkillDamage: 0,
      controlApplications: 0,
      downtime: { noTarget: 0, cooldown: 0, supply: 0 },
    },
  };
  state.towers[id] = instance;
  state.nextTowerSequence += 1;
  state.matter -= decision.cost;
  addEvent(state, "info", "tower_placed", {
    towerId: id,
    chassisId: command.chassisId,
    cost: decision.cost,
  });
  return acceptCommand(state);
};

export const moveTowerCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "move_tower" }>,
  definition: GameDefinition
): CommandResult => {
  const state = cloneGame(source);
  const tower = state.towers[command.towerId];
  if (!tower) throw new Error(`Move accepted for missing tower ${command.towerId}.`);
  tower.placement = resolveTowerPlacement(
    tower.chassisId,
    command.anchor,
    command.mountFace,
    command.orientation,
    definition
  );
  tower.provenance = towerPlacementProvenance(state, tower.placement);
  return acceptCommand(state);
};

export const rotateTowerCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "rotate_tower" }>,
  definition: GameDefinition
): CommandResult => {
  const tower = source.towers[command.towerId];
  if (!tower) throw new Error(`Rotation accepted for missing tower ${command.towerId}.`);
  return moveTowerCommand(
    source,
    {
      type: "move_tower",
      towerId: tower.id,
      anchor: tower.placement.anchor,
      mountFace: tower.placement.mountFace,
      orientation: command.orientation,
    },
    definition
  );
};

export const setTowerTargetingCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "set_tower_targeting" }>
): CommandResult => {
  const state = cloneGame(source);
  const tower = state.towers[command.towerId];
  if (!tower) throw new Error(`Targeting accepted for missing tower ${command.towerId}.`);
  tower.targetPolicy = command.policy;
  return acceptCommand(state);
};

export const upgradeTowerCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "upgrade_tower" }>,
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  const tower = state.towers[command.towerId];
  if (!tower) throw new Error(`Upgrade accepted for missing tower ${command.towerId}.`);
  tower.upgrades.push(command.upgradeId);
  tower.totalMatterSpent += decision.cost;
  state.matter -= decision.cost;
  addEvent(state, "info", "tower_upgraded", {
    towerId: tower.id,
    upgradeId: command.upgradeId,
    cost: decision.cost,
  });
  return acceptCommand(state);
};

export const dismantleTowerCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "dismantle_tower" }>,
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  delete state.towers[command.towerId];
  delete state.towerSupply[command.towerId];
  state.matter += decision.refund;
  addEvent(state, "info", "tower_dismantled", {
    towerId: command.towerId,
    refund: decision.refund,
  });
  return acceptCommand(state);
};
