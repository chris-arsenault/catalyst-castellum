import type { ProcessLineKind, WorldMap } from "./world/map";
import type {
  DamageSourceId,
  EnemyState,
  EnemyType,
  GasAmounts,
  GasConduitState,
  GasJunctionState,
  GasSourceId,
  GasSourceState,
  GasType,
  GasZone,
  GridCell,
  LiquidAmounts,
  LiquidConduitState,
  LiquidJunctionState,
  LiquidSourceId,
  LiquidSourceState,
  LiquidType,
  EquipmentId,
  EquipmentSocketId,
  RoomId,
  RoomState,
  ConnectionId,
  LevelId,
  WorldPoint,
  FacilityPortalState,
} from "./types";
import { EVENT_TONES, GAME_EVENT_CODES, GAME_PHASES } from "./identifiers";

export type GamePhase = (typeof GAME_PHASES)[number];
export type RunOutcome = "active" | "defeated" | "victorious";

export interface RoundStats {
  spawned: number;
  killed: number;
  breached: number;
  coreDamage: number;
  damageDealt: number;
  reactions: number;
  combustionFlashes: number;
  peakHazard: number;
  matterHarvested: number;
  fieldDamageAbsorbed: number;
  fieldDamageAbsorbedBySource: Record<DamageSourceId, number>;
  reagentEmitted: number;
  armorTransitions: number;
  protectedAllySeconds: number;
  damageByChannel: HazardChannels;
  damageBySource: Record<DamageSourceId, number>;
  killsBySource: Record<DamageSourceId, number>;
}

export interface RoundReport extends RoundStats {
  levelId: LevelId;
  round: number;
}

export interface CampaignProgress {
  levelId: LevelId;
  levelIndex: number;
  roundIndex: number;
  checkpointLevelId: LevelId;
  completedLevelIds: LevelId[];
}

export interface ScenarioAvailability {
  equipment: EquipmentId[];
  gasLines: ConnectionId[];
  liquidLines: ConnectionId[];
}

export type EventTone = (typeof EVENT_TONES)[number];
export type GameEventCode = (typeof GAME_EVENT_CODES)[number];
export type GameEventParameter = boolean | number | string;

export interface GameEventParameterMap {
  assault_started: { automatic: boolean };
  campaign_completed: { completedLevels: number; coreIntegrity: number };
  chlorine_evolution_started: Record<never, never>;
  core_breached: { enemyType: EnemyType; coreDamage: number };
  enemy_neutralized: {
    enemyType: EnemyType;
    damageTaken: number;
    finalSource: string;
    finalChannel: string;
    lifetimeSource: string;
    matterYield: number;
  };
  enemy_molted: { enemyType: EnemyType; remainingHealth: number };
  equipment_installed: { equipmentId: EquipmentId; cost: number };
  equipment_upgraded: { equipmentId: EquipmentId; level: number };
  flash_cycle_started: { zone: GasZone };
  flash_incident: {
    hitCount: number;
    killed: number;
    damage: number;
    pressureImpulse: number;
    reactionExtent: number;
  };
  gas_source_charged: { sourceId: GasSourceId; cost: number; amount: number };
  hcl_production_started: Record<never, never>;
  level_planning_started: Record<never, never>;
  liquid_source_charged: { sourceId: LiquidSourceId; cost: number; amount: number };
  prime_started: { primeSeconds: number };
  equipment_operation_started: { equipmentId: EquipmentId };
  round_advanced: Record<never, never>;
  round_completed: {
    breached: number;
    killed: number;
    coreDamage: number;
    matterHarvested: number;
  };
  scenario_started: Record<never, never>;
  scenario_defeated: Record<never, never>;
  travel_started: Record<never, never>;
  separator_cross_leak: Record<never, never>;
}

interface GameEventBase {
  id: number;
  levelId: LevelId;
  round: number;
  phase: GamePhase;
  tone: EventTone;
  roomId: RoomId | null;
  elapsed: number;
  incidentId: number | null;
}

export type GameEvent = {
  [Code in GameEventCode]: GameEventBase & {
    code: Code;
    parameters: GameEventParameterMap[Code];
  };
}[GameEventCode];

export interface CombatIncidentTarget {
  enemyId: number;
  enemyType: EnemyType;
  worldPosition: WorldPoint;
  healthBefore: number;
  healthAfter: number;
  damageByChannel: HazardChannels;
  killed: boolean;
}

export interface CombatIncident {
  id: number;
  elapsed: number;
  levelId: LevelId;
  round: number;
  phase: GamePhase;
  roomId: RoomId;
  zone: GasZone | null;
  sourceId: DamageSourceId;
  reactionExtent: number;
  pressureImpulse: number;
  heatDelta: number;
  damageByChannel: HazardChannels;
  targets: CombatIncidentTarget[];
}

/** Canonical world instance catalogs; iteration order is simulation order (ADR-0002). */
export interface WorldCatalogs {
  rooms: readonly RoomId[];
  connections: readonly ConnectionId[];
}

export interface GameState {
  version: 22;
  pack: {
    id: string;
    contentVersion: number;
  };
  /**
   * The world the simulation runs on (ADR-0001). Frozen until a map edit replaces the
   * object and bumps the revision; derived geometry is cached per map object.
   */
  map: WorldMap;
  mapRevision: number;
  /** One save is one run (ADR-0004); the seed is consumed strictly pre-level (ADR-0003). */
  run: { seed: string; position: number; outcome: RunOutcome };
  world: WorldCatalogs;
  phase: GamePhase;
  campaign: CampaignProgress;
  availability: ScenarioAvailability;
  phaseTime: number;
  elapsed: number;
  rooms: Record<RoomId, RoomState>;
  gasSources: Record<GasSourceId, GasSourceState>;
  liquidSources: Record<LiquidSourceId, LiquidSourceState>;
  gasJunctions: Record<RoomId, GasJunctionState>;
  liquidJunctions: Record<RoomId, LiquidJunctionState>;
  gasConduits: Record<ConnectionId, GasConduitState>;
  liquidConduits: Record<ConnectionId, LiquidConduitState>;
  portalStates: Record<string, FacilityPortalState>;
  gasVent: GasAmounts;
  liquidDrain: LiquidAmounts;
  enemies: EnemyState[];
  spawnCursor: number;
  nextEnemyId: number;
  nextEventId: number;
  nextIncidentId: number;
  coreIntegrity: number;
  matter: number;
  pendingMatter: number;
  paused: boolean;
  speed: 1 | 2;
  stats: RoundStats;
  lastReport: RoundReport | null;
  events: GameEvent[];
  incidents: CombatIncident[];
}

export interface HazardChannels {
  atmosphere: number;
  corrosion: number;
  heat: number;
  pressure: number;
  radiation: number;
}

export interface RoomAnalysis {
  gasTotal: number;
  lowerGasTotal: number;
  upperGasTotal: number;
  liquidTotal: number;
  liquidSurfaceElevation: number;
  staticPressure: number;
  pressure: number;
  pressurePulse: number;
  dominantGas: GasType;
  dominantGasPercent: number;
  lowerDominantGas: GasType;
  lowerDominantGasPercent: number;
  lowerGasDensity: number;
  lowerGasTemperature: number;
  upperDominantGas: GasType;
  upperDominantGasPercent: number;
  upperGasDensity: number;
  upperGasTemperature: number;
  dominantLiquid: LiquidType | null;
  dominantLiquidPercent: number;
  hazard: number;
  hazards: HazardChannels;
  groundMovementMultiplier: number;
  flyingMovementMultiplier: number;
}

export type GameCommand =
  | { type: "set_conduit"; connectionId: ConnectionId; enabled: boolean }
  | {
      type: "install_equipment";
      roomId: RoomId;
      socketId: EquipmentSocketId;
      equipmentId: EquipmentId;
    }
  | { type: "toggle_equipment"; roomId: RoomId; socketId: EquipmentSocketId; enabled: boolean }
  | { type: "upgrade_equipment"; roomId: RoomId; socketId: EquipmentSocketId }
  | { type: "dismantle_equipment"; roomId: RoomId; socketId: EquipmentSocketId }
  | { type: "build_connection"; kind: ProcessLineKind; fromRoomId: RoomId; toRoomId: RoomId }
  | { type: "dismantle_connection"; connectionId: ConnectionId }
  | { type: "graft_module"; hostRoomId: RoomId; hardpointId: string; moduleId: string }
  | { type: "dismantle_module"; roomId: RoomId }
  | {
      type: "edit_hull_cell";
      roomId: RoomId;
      cell: GridCell;
      terrain: "platform" | "ladder";
      present: boolean;
    }
  | {
      type: "edit_hull_cells";
      roomId: RoomId;
      cells: readonly GridCell[];
      terrain: "platform" | "ladder" | "clear";
    }
  | { type: "connect_hull_rooms"; fromRoomId: RoomId; toRoomId: RoomId }
  | { type: "remove_hull_connection"; connectionId: ConnectionId }
  | {
      type: "configure_hull_portal";
      connectionId: ConnectionId;
      kind: "passage" | "door";
      open: boolean;
    }
  | { type: "set_portal"; connectionId: ConnectionId; open: boolean }
  | { type: "charge_gas_source"; sourceId: GasSourceId }
  | { type: "charge_liquid_source"; sourceId: LiquidSourceId }
  | { type: "start_prime" }
  | { type: "start_assault" }
  | { type: "begin_level" }
  | { type: "skip_tutorial" }
  | { type: "continue_round" }
  | { type: "start_next_level" }
  | { type: "dock_at_site" }
  | { type: "retry_level" }
  | { type: "toggle_pause" }
  | { type: "set_pause"; paused: boolean }
  | { type: "set_speed"; speed: 1 | 2 };

export interface CommandResult {
  state: GameState;
  accepted: boolean;
  code: CommandRejectionCode | null;
  parameters: CommandRejectionParameters;
}

export type CommandRejectionCode =
  | "already_complete"
  | "already_installed"
  | "capacity"
  | "empty_socket"
  | "insufficient_matter"
  | "invalid_phase"
  | "not_installed"
  | "occupied_socket"
  | "placement"
  | "retained_inventory"
  | "route_unavailable"
  | "unavailable"
  | "unique_equipment";

export interface CommandDecision {
  allowed: boolean;
  code: CommandRejectionCode | null;
  parameters: CommandRejectionParameters;
  cost: number;
  refund: number;
  amount: number;
}

export interface CommandRejectionParameters {
  amount?: number;
  cost?: number;
  refund?: number;
}
