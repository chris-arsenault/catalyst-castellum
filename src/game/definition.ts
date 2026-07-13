import type { LevelDefinition } from "./content/campaign";
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
import { createFacilityModel, type FacilityModel } from "./engine/facilityModel";
import type {
  EnemyDefinition,
  EnemyType,
  EquipmentDefinition,
  EquipmentId,
  FacilityMapDefinition,
  GasAmounts,
  GasBufferDefinition,
  GasBufferId,
  GasJunctionDefinition,
  GasSourceDefinition,
  GasSourceId,
  LevelId,
  LiquidBufferDefinition,
  LiquidBufferId,
  LiquidJunctionDefinition,
  LiquidSourceDefinition,
  LiquidSourceId,
  ProcessDefinition,
  ProcessId,
  ReactionDefinition,
  ReactionId,
  RoomDefinition,
  RoomId,
  SpeciesDefinition,
  SpeciesId,
  TransportRunDefinition,
  TransportRunId,
} from "./types";
import { LEVEL_IDS } from "./identifiers";

export interface EnvironmentHazardRules {
  gasTemperature: { threshold: number; rate: number };
  staticPressure: { ratioThreshold: number; rate: number };
}

export interface GameDefinitionSource {
  readonly id: string;
  readonly facilityMap: FacilityMapDefinition;
  readonly roomOrder: readonly RoomId[];
  readonly rooms: Readonly<Record<RoomId, RoomDefinition>>;
  readonly levelOrder: readonly LevelId[];
  readonly species: Readonly<Record<SpeciesId, SpeciesDefinition>>;
  readonly reactions: Readonly<Record<ReactionId, ReactionDefinition>>;
  readonly equipment: Readonly<Record<EquipmentId, EquipmentDefinition>>;
  readonly processes: Readonly<Record<ProcessId, ProcessDefinition>>;
  readonly enemies: Readonly<Record<EnemyType, EnemyDefinition>>;
  readonly levels: Readonly<Record<LevelId, LevelDefinition>>;
  readonly transportRuns: Readonly<Record<TransportRunId, TransportRunDefinition>>;
  readonly gasSources: Readonly<Record<GasSourceId, GasSourceDefinition>>;
  readonly liquidSources: Readonly<Record<LiquidSourceId, LiquidSourceDefinition>>;
  readonly gasBuffers: Readonly<Record<GasBufferId, GasBufferDefinition>>;
  readonly liquidBuffers: Readonly<Record<LiquidBufferId, LiquidBufferDefinition>>;
  readonly gasJunctions: Readonly<Record<RoomId, GasJunctionDefinition>>;
  readonly liquidJunctions: Readonly<Record<RoomId, LiquidJunctionDefinition>>;
  readonly ambientGas: GasAmounts;
  readonly environmentHazards: EnvironmentHazardRules;
}

export interface GameDefinition extends GameDefinitionSource {
  readonly facility: FacilityModel;
}

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
