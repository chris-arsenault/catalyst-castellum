import { simulateNetworks } from "../engine/flow";
import { simulateInstalledEquipment } from "../engine/equipment";
import { simulateStratification } from "../engine/stratification";
import { simulateReactions } from "../engine/reactions";
import {
  consumeTowerSupplyForShot,
  releaseTowerByproducts,
  serviceTowerSupplies,
  towerSupplyQuery,
} from "../engine/towerSupply";
import { enemyGasZone, enemyRoomId } from "../engine/enemyPosition";
import { enemyStatsAtLevel } from "../engine/enemyLevel";
import { roomGasHeadroom, roomMovementMultiplier } from "../engine/physics";
import { upsertEnvironmentalField } from "../engine/environmentalFields";
import { towerRoomId } from "../engine/towerPlacement";
import { roomState } from "../world/instances";
import { clamp } from "../engine/math";
import { enemyDefinition } from "./catalogs";
import { createProcessState, cloneProcessState } from "./processState";
import { evaluateProcessCommand } from "./processCommandPolicy";
import { executeProcessCommand } from "./processCommands";
import { validateProcessState } from "./processValidation";
import { processDefinitionForMap } from "./processDefinition";
import type { ProcessBridge, ProcessEncounterState, ProcessEncounterContext } from "./processTypes";

export const processTowerDefinition = (
  state: ProcessEncounterState,
  context: ProcessEncounterContext
) => ({
  ...processDefinitionForMap(context.definition.process, state.map),
  towers: context.combat.towers,
});

const beforeSpawn: ProcessBridge["beforeSpawn"] = (state, dt, context) => {
  const definition = processTowerDefinition(state, context);
  simulateNetworks(state, dt, definition);
  simulateInstalledEquipment(state, dt, definition);
  serviceTowerSupplies(state, dt, definition);
  simulateStratification(state, dt, definition);
};

const emitEnemy: ProcessBridge["emitEnemy"] = (state, enemy, dt, context) => {
  const definition = enemyDefinition(context.combat, enemy.type);
  if (enemy.behavior.kind !== "gas_emitter" || definition.behavior.kind !== "gas_emitter") return;
  const roomId = enemyRoomId(enemy, state.map);
  if (!roomId) return;
  const room = roomState(state, roomId);
  const emitted = Math.min(
    enemy.behavior.reservoir,
    definition.behavior.emissionRate * dt,
    roomGasHeadroom(room, processDefinitionForMap(context.definition.process, state.map))
  );
  if (emitted <= 0) return;
  const zone = enemyGasZone(enemy, state.map);
  room.gas[zone][definition.behavior.species] += emitted;
  enemy.behavior.reservoir -= emitted;
  state.stats.reagentEmitted += emitted;
  upsertEnvironmentalField(state, {
    id: `enemy:${enemy.id}:emission`,
    sourceId: `enemy:${enemy.id}`,
    effect: "visibility",
    roomId,
    zone,
    intensity: Math.min(0.3, 0.12 + definition.behavior.emissionRate * 0.2),
    duration: 1.4,
    decayPerSecond: 0.05,
    stacking: "strongest",
    species: definition.behavior.species,
  });
};

const afterTowerShot: ProcessBridge["afterTowerShot"] = (state, tower, supply, context) => {
  const reactedHydrogen = releaseTowerByproducts(
    state,
    tower,
    supply.consumed,
    processTowerDefinition(state, context)
  );
  const roomId = towerRoomId(state, tower);
  if (reactedHydrogen <= 0 || !roomId) return;
  upsertEnvironmentalField(state, {
    id: `tower:${tower.id}:steam-wake`,
    sourceId: tower.id,
    effect: "movement",
    roomId,
    zone: "both",
    intensity: Math.min(0.28, 0.12 + reactedHydrogen * 0.14),
    duration: 3.2,
    decayPerSecond: 0.025,
    stacking: "strongest",
    species: "steam",
  });
};

export const RETAINED_PROCESS_BRIDGE: ProcessBridge = {
  create: createProcessState,
  clone: cloneProcessState,
  validate: validateProcessState,
  evaluateCommand: evaluateProcessCommand,
  executeCommand: executeProcessCommand,
  beforeSpawn,
  emitEnemy,
  towerSupply: (state, tower, context) =>
    towerSupplyQuery(state, tower, processTowerDefinition(state, context)),
  consumeTowerSupply: (state, tower, context) =>
    consumeTowerSupplyForShot(state, tower, processTowerDefinition(state, context)),
  afterTowerShot,
  enemyDeath: (state, enemy, roomId, context) => {
    const leveled = enemyStatsAtLevel(enemyDefinition(context.combat, enemy.type), enemy.level);
    const room = roomState(state, roomId);
    room.residue = clamp(room.residue + leveled.residueOnDeath, 0, 100);
  },
  movementMultiplier: (state, enemy, roomId, context) =>
    roomMovementMultiplier(
      roomState(state, roomId),
      enemyDefinition(context.combat, enemy.type).flying,
      processDefinitionForMap(context.definition.process, state.map)
    ),
  afterTowers: (state, dt, context) =>
    simulateReactions(state, dt, processDefinitionForMap(context.definition.process, state.map)),
};
