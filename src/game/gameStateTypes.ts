import type {
  DamageSourceId,
  EnemyState,
  EnemyType,
  GasAmounts,
  GasBufferId,
  GasBufferState,
  GasConduitState,
  GasJunctionState,
  GasSourceId,
  GasSourceState,
  GasType,
  GasZone,
  LiquidAmounts,
  LiquidBufferId,
  LiquidBufferState,
  LiquidConduitState,
  LiquidJunctionState,
  LiquidSourceId,
  LiquidSourceState,
  LiquidType,
  ProcessId,
  ProcessState,
  EquipmentId,
  EquipmentSocketId,
  RoomId,
  RoomState,
  TransportPhase,
  TransportRunId,
  LevelId,
  WorldPoint,
  FacilityPortalState,
} from "./types";

export type GamePhase =
  | "level_briefing"
  | "build"
  | "prime"
  | "assault"
  | "round_result"
  | "level_complete"
  | "victory"
  | "defeat";

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
  damageByChannel: HazardChannels;
  damageBySource: Record<DamageSourceId, number>;
  killsBySource: Record<DamageSourceId, number>;
}

export type CycleStats = RoundStats;

export interface RoundReport extends RoundStats {
  levelId: LevelId;
  round: number;
  headline: string;
  detail: string;
}

export type CycleReport = RoundReport;

export interface CampaignProgress {
  levelId: LevelId;
  levelIndex: number;
  roundIndex: number;
  checkpointLevelId: LevelId;
  completedLevelIds: LevelId[];
}

export interface ScenarioAvailability {
  equipment: EquipmentId[];
  gasRuns: TransportRunId[];
  liquidRuns: TransportRunId[];
  gasSources: GasSourceId[];
  liquidSources: LiquidSourceId[];
}

export type EventTone = "info" | "good" | "warning" | "danger" | "reaction";

export interface GameEvent {
  id: number;
  levelId: LevelId;
  round: number;
  phase: GamePhase;
  tone: EventTone;
  title: string;
  detail: string;
  roomId: RoomId | null;
  elapsed: number;
  incidentId: number | null;
}

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

export interface GameState {
  version: 9;
  phase: GamePhase;
  campaign: CampaignProgress;
  availability: ScenarioAvailability;
  phaseTime: number;
  elapsed: number;
  rooms: Record<RoomId, RoomState>;
  gasSources: Record<GasSourceId, GasSourceState>;
  liquidSources: Record<LiquidSourceId, LiquidSourceState>;
  gasBuffers: Record<GasBufferId, GasBufferState>;
  liquidBuffers: Record<LiquidBufferId, LiquidBufferState>;
  gasJunctions: Record<RoomId, GasJunctionState>;
  liquidJunctions: Record<RoomId, LiquidJunctionState>;
  gasConduits: Record<TransportRunId, GasConduitState>;
  liquidConduits: Record<TransportRunId, LiquidConduitState>;
  portalStates: Record<string, FacilityPortalState>;
  processes: Record<ProcessId, ProcessState>;
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
  hazardLabel: "CLEAR" | "LOW" | "HOSTILE" | "LETHAL";
  hazards: HazardChannels;
  groundMovementMultiplier: number;
  flyingMovementMultiplier: number;
  effects: string[];
}

export type GameCommand =
  | { type: "set_conduit"; runId: TransportRunId; phase: TransportPhase; enabled: boolean }
  | {
      type: "install_equipment";
      roomId: RoomId;
      socketId: EquipmentSocketId;
      equipmentId: EquipmentId;
    }
  | { type: "toggle_equipment"; roomId: RoomId; socketId: EquipmentSocketId; enabled: boolean }
  | { type: "upgrade_equipment"; roomId: RoomId; socketId: EquipmentSocketId }
  | { type: "dismantle_equipment"; roomId: RoomId; socketId: EquipmentSocketId }
  | { type: "build_transport"; runId: TransportRunId; phase: TransportPhase }
  | { type: "dismantle_transport"; runId: TransportRunId; phase: TransportPhase }
  | { type: "charge_gas_source"; sourceId: GasSourceId }
  | { type: "charge_liquid_source"; sourceId: LiquidSourceId }
  | { type: "start_prime" }
  | { type: "start_assault" }
  | { type: "begin_level" }
  | { type: "skip_tutorial" }
  | { type: "continue_round" }
  | { type: "start_next_level" }
  | { type: "retry_level" }
  | { type: "toggle_pause" }
  | { type: "set_pause"; paused: boolean }
  | { type: "set_speed"; speed: 1 | 2 };

export interface CommandResult {
  state: GameState;
  accepted: boolean;
  reason: string | null;
}
