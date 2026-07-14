import { LEVEL_DEFINITIONS } from "./content/campaign";
import { REACTION_DEFINITIONS } from "./content/chemistry";
import { ENEMY_DEFINITIONS } from "./content/enemies";
import { EQUIPMENT_DEFINITIONS } from "./content/equipment";
import { FACILITY_MAP } from "./content/facilityLayout";
import { ENVIRONMENT_HAZARD_RULES } from "./content/hazards";
import {
  GAS_BUFFERS,
  GAS_JUNCTIONS,
  GAS_SOURCES,
  LIQUID_BUFFERS,
  LIQUID_JUNCTIONS,
  LIQUID_SOURCES,
} from "./content/networkNodes";
import { PROCESS_DEFINITIONS } from "./content/processes";
import { ROOM_DEFINITIONS, ROOM_ORDER } from "./content/rooms";
import { ambientGas, SPECIES_DEFINITIONS } from "./content/substances";
import { TRANSPORT_RUNS } from "./content/transportRuns";
import { createFacilityModel } from "./engine/facilityModel";
import type { GameDefinition, GameDefinitionSource } from "./definitionTypes";
import { LEVEL_IDS } from "./identifiers";

export type {
  EnvironmentHazardRules,
  FacilityLoadout,
  FacilityModel,
  GameDefinition,
  GameDefinitionSource,
  GasConduitLoadout,
  LevelDefinition,
  LiquidConduitLoadout,
  RoundDefinition,
} from "./definitionTypes";

const deepFreeze = <Value>(value: Value, seen = new WeakSet<object>()): Value => {
  if (typeof value !== "object" || value === null || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
};

export const defineGame = (source: GameDefinitionSource): GameDefinition =>
  deepFreeze({ ...source, facility: createFacilityModel(source.facilityMap) });

export const deriveGame = (
  base: GameDefinition,
  overrides: Partial<GameDefinitionSource>
): GameDefinition => {
  const source: GameDefinitionSource = {
    id: base.id,
    packId: base.packId,
    contentVersion: base.contentVersion,
    facilityMap: base.facilityMap,
    roomOrder: base.roomOrder,
    rooms: base.rooms,
    levelOrder: base.levelOrder,
    species: base.species,
    reactions: base.reactions,
    equipment: base.equipment,
    processes: base.processes,
    enemies: base.enemies,
    levels: base.levels,
    transportRuns: base.transportRuns,
    gasSources: base.gasSources,
    liquidSources: base.liquidSources,
    gasBuffers: base.gasBuffers,
    liquidBuffers: base.liquidBuffers,
    gasJunctions: base.gasJunctions,
    liquidJunctions: base.liquidJunctions,
    ambientGas: base.ambientGas,
    environmentHazards: base.environmentHazards,
    ...overrides,
  };
  return defineGame(source);
};

export const DEFAULT_GAME_DEFINITION = defineGame({
  id: "catalyst-castellum",
  packId: "catalyst-castellum",
  contentVersion: 1,
  facilityMap: FACILITY_MAP,
  roomOrder: ROOM_ORDER,
  rooms: ROOM_DEFINITIONS,
  levelOrder: LEVEL_IDS,
  species: SPECIES_DEFINITIONS,
  reactions: REACTION_DEFINITIONS,
  equipment: EQUIPMENT_DEFINITIONS,
  processes: PROCESS_DEFINITIONS,
  enemies: ENEMY_DEFINITIONS,
  levels: LEVEL_DEFINITIONS,
  transportRuns: TRANSPORT_RUNS,
  gasSources: GAS_SOURCES,
  liquidSources: LIQUID_SOURCES,
  gasBuffers: GAS_BUFFERS,
  liquidBuffers: LIQUID_BUFFERS,
  gasJunctions: GAS_JUNCTIONS,
  liquidJunctions: LIQUID_JUNCTIONS,
  ambientGas: ambientGas(),
  environmentHazards: ENVIRONMENT_HAZARD_RULES,
});
