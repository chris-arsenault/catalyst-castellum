import type { EncounterContext, EncounterState, EncounterTower } from "../encounter/types";
import { towerDefinition } from "../encounter/catalogs";
import type { CommandDecision, GameCommand } from "../types";
import { addEncounterEvent as addEvent } from "../encounter/events";
import { resolveTowerPlacement, towerPlacementProvenance } from "./towerPlacement";
import { returnTowerInventory } from "./towerInventory";

const towerId = (state: EncounterState, context: EncounterContext): string =>
  `tower:${context.definition.instanceNamespace}:${state.nextTowerSequence}`;

export const placeTowerCommand = (
  source: EncounterState,
  command: Extract<GameCommand, { type: "place_tower" }>,
  decision: CommandDecision,
  definition: EncounterContext
): EncounterState => {
  const state = source;
  const placement = resolveTowerPlacement(
    command.chassisId,
    command.anchor,
    command.mountFace,
    command.orientation,
    definition.combat
  );
  while (state.towers[towerId(state, definition)]) state.nextTowerSequence += 1;
  const id = towerId(state, definition);
  const instance: EncounterTower = {
    id,
    chassisId: command.chassisId,
    placement,
    provenance: towerPlacementProvenance(state, placement),
    upgrades: [],
    targetPolicy:
      towerDefinition(definition.combat, command.chassisId).targetPolicies[0] ?? "first",
    cooldown: 0,
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
  if (state.process) state.process.towerResources[id] = { gas: {}, liquid: {} };
  state.nextTowerSequence += 1;
  state.matter -= decision.cost;
  addEvent(state, "info", "tower_placed", {
    towerId: id,
    chassisId: command.chassisId,
    cost: decision.cost,
  });
  return state;
};

export const moveTowerCommand = (
  source: EncounterState,
  command: Extract<GameCommand, { type: "move_tower" }>,
  definition: EncounterContext
): EncounterState => {
  const state = source;
  const tower = state.towers[command.towerId];
  if (!tower) throw new Error(`Move accepted for missing tower ${command.towerId}.`);
  tower.placement = resolveTowerPlacement(
    tower.chassisId,
    command.anchor,
    command.mountFace,
    command.orientation,
    definition.combat
  );
  tower.provenance = towerPlacementProvenance(state, tower.placement);
  return state;
};

export const rotateTowerCommand = (
  source: EncounterState,
  command: Extract<GameCommand, { type: "rotate_tower" }>,
  definition: EncounterContext
): EncounterState => {
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
  source: EncounterState,
  command: Extract<GameCommand, { type: "set_tower_targeting" }>
): EncounterState => {
  const state = source;
  const tower = state.towers[command.towerId];
  if (!tower) throw new Error(`Targeting accepted for missing tower ${command.towerId}.`);
  tower.targetPolicy = command.policy;
  return state;
};

export const upgradeTowerCommand = (
  source: EncounterState,
  command: Extract<GameCommand, { type: "upgrade_tower" }>,
  decision: CommandDecision
): EncounterState => {
  const state = source;
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
  return state;
};

export const dismantleTowerCommand = (
  source: EncounterState,
  command: Extract<GameCommand, { type: "dismantle_tower" }>,
  decision: CommandDecision
): EncounterState => {
  const state = source;
  const tower = state.towers[command.towerId];
  if (!tower) throw new Error(`Dismantle accepted for missing tower ${command.towerId}.`);
  returnTowerInventory(state, tower);
  delete state.towers[command.towerId];
  if (state.process) {
    delete state.process.towerSupply[command.towerId];
    delete state.process.towerResources[command.towerId];
  }
  state.towerAttacks = state.towerAttacks.filter((attack) => attack.towerId !== command.towerId);
  state.matter += decision.refund;
  addEvent(state, "info", "tower_dismantled", {
    towerId: command.towerId,
    refund: decision.refund,
  });
  return state;
};
