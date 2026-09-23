import { worldCatalogsForMap } from "../world/catalogs";
import { makeStats } from "./events";
import { createCatalystState } from "./catalystCharge";
import { initializeCatalystDevices } from "./catalystDevices";
import type { ProcessBridge } from "./processTypes";
import type { CombatDefinition, EncounterDefinition, EncounterState } from "./types";
import { assertEncounterDefinition, validateEncounterState } from "./validation";

const nextTowerSequence = (definition: EncounterDefinition): number => {
  const prefix = `tower:${definition.instanceNamespace}:`;
  const sequences = Object.keys(definition.initialTowers).flatMap((id) => {
    if (!id.startsWith(prefix)) return [];
    const sequence = Number(id.slice(prefix.length));
    return Number.isSafeInteger(sequence) && sequence >= 0 ? [sequence] : [];
  });
  return Math.max(0, ...sequences) + 1;
};

export const createEncounter = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  processBridge: ProcessBridge | null = null
): EncounterState => {
  assertEncounterDefinition(combat, definition, processBridge);
  const towers = structuredClone(definition.initialTowers);
  const process = definition.process
    ? processBridge!.create(definition.process, definition.map)
    : null;
  if (process) {
    for (const tower of Object.values(towers))
      process.towerResources[tower.id] ??= { gas: {}, liquid: {} };
  }
  const state: EncounterState = {
    definition: {
      id: definition.id,
      contentVersion: definition.contentVersion,
      combatId: combat.id,
      combatVersion: combat.contentVersion,
    },
    map: definition.map,
    mapRevision: 0,
    world: worldCatalogsForMap(definition.map),
    phase: "build",
    tick: 0,
    elapsed: 0,
    phaseTime: 0,
    commandCursor: { tick: 0, sequence: -1 },
    availability: structuredClone(definition.availability),
    portalStates: structuredClone(definition.initialPortalStates),
    towers,
    enemies: [],
    towerAttacks: [],
    pendingAttacks: [],
    catalyst: createCatalystState(combat),
    environmentalFields: [],
    spawnCursor: 0,
    nextEnemyId: 1,
    nextTowerSequence: nextTowerSequence(definition),
    nextTowerAttackId: 1,
    nextEventId: 1,
    nextIncidentId: 1,
    matter: definition.startingMatter,
    pendingMatter: 0,
    coreIntegrity: definition.startingCoreIntegrity,
    stats: makeStats(),
    result: null,
    events: [],
    incidents: [],
    process,
  };
  const context = { combat, definition, process: processBridge };
  initializeCatalystDevices(state, context);
  const issues = validateEncounterState(state, context);
  if (issues.length) throw new Error(`Invalid initial encounter state: ${issues.join("; ")}`);
  return state;
};
