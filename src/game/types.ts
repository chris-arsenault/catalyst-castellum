export const GAS_TYPES = ["oxygen", "co2", "toxic_gas", "fuel_gas", "steam"] as const;

export const LIQUID_TYPES = ["water", "acid", "caustic", "sludge", "neutral_liquid"] as const;

export const ENEMY_TYPES = ["crawler", "skimmer", "floater", "shell", "bellows"] as const;

export type GasType = (typeof GAS_TYPES)[number];
export type LiquidType = (typeof LIQUID_TYPES)[number];
export type EnemyType = (typeof ENEMY_TYPES)[number];

export type GasAmounts = Record<GasType, number>;
export type LiquidAmounts = Record<LiquidType, number>;

export type RoomId =
  | "west_intake"
  | "lower_intake"
  | "switchyard"
  | "furnace"
  | "reservoir"
  | "gallery"
  | "washlock"
  | "core";

export type DeviceKind =
  "gas_tank" | "liquid_tank" | "vent" | "drain" | "igniter" | "door" | "boiler" | "fan";

export type DeviceKey =
  | "gas_toxic"
  | "gas_co2"
  | "gas_fuel"
  | "liquid_acid"
  | "liquid_caustic"
  | "liquid_water"
  | "liquid_sludge"
  | "vent"
  | "drain"
  | "igniter"
  | "door"
  | "boiler"
  | "fan";

export interface Point {
  x: number;
  y: number;
}

export interface RoomDefinition {
  id: RoomId;
  name: string;
  code: string;
  kind: "spawn" | "chamber" | "core";
  position: Point;
  neighbors: RoomId[];
  forward: RoomId[];
  slots: number;
  blurb: string;
}

export interface ConnectionDefinition {
  from: RoomId;
  to: RoomId;
}

export interface DeviceDefinition {
  key: DeviceKey;
  kind: DeviceKind;
  name: string;
  family: string;
  description: string;
  activeLabel: string;
  cost: number;
  energyCost: number;
  cooldown: number;
  accent: string;
  gasPayload?: GasType;
  liquidPayload?: LiquidType;
}

export interface RoomState {
  id: RoomId;
  gas: GasAmounts;
  liquid: LiquidAmounts;
  temperature: number;
  residue: number;
  sealTimer: number;
  flashTimer: number;
  flashIntensity: number;
  devices: DeviceKey[];
}

export interface EnemyDefinition {
  type: EnemyType;
  name: string;
  description: string;
  health: number;
  speed: number;
  coreDamage: number;
  needsOxygen: boolean;
  flying: boolean;
  toxicMultiplier: number;
  acidMultiplier: number;
  causticMultiplier: number;
  heatMultiplier: number;
  color: string;
  residueOnDeath: number;
}

export interface EnemyState {
  id: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  route: RoomId[];
  segment: number;
  progress: number;
  spawnAge: number;
  damageTaken: number;
  disrupted: boolean;
}

export interface WaveEntry {
  at: number;
  type: EnemyType;
  route: RoomId[];
}

export type GamePhase = "build" | "prime" | "assault" | "settle" | "victory" | "defeat";

export interface CycleStats {
  spawned: number;
  killed: number;
  breached: number;
  coreDamage: number;
  damageDealt: number;
  reactions: number;
  peakHazard: number;
}

export interface CycleReport extends CycleStats {
  cycle: number;
  headline: string;
  detail: string;
}

export type EventTone = "info" | "good" | "warning" | "danger" | "reaction";

export interface GameEvent {
  id: number;
  cycle: number;
  phase: GamePhase;
  tone: EventTone;
  title: string;
  detail: string;
  roomId?: RoomId;
}

export interface GameState {
  version: 1;
  phase: GamePhase;
  cycle: number;
  phaseTime: number;
  elapsed: number;
  rooms: Record<RoomId, RoomState>;
  enemies: EnemyState[];
  spawnCursor: number;
  nextEnemyId: number;
  nextEventId: number;
  coreIntegrity: number;
  energy: number;
  buildPoints: number;
  cooldowns: Partial<Record<string, number>>;
  paused: boolean;
  speed: 1 | 2;
  stats: CycleStats;
  lastReport: CycleReport | null;
  events: GameEvent[];
}

export interface RoomAnalysis {
  gasTotal: number;
  liquidTotal: number;
  pressure: number;
  dominantGas: GasType;
  dominantGasPercent: number;
  dominantLiquid: LiquidType | null;
  dominantLiquidPercent: number;
  hazard: number;
  hazardLabel: "CLEAR" | "LOW" | "HOSTILE" | "LETHAL";
  effects: string[];
}

export type GameCommand =
  | { type: "activate_device"; roomId: RoomId; device: DeviceKey }
  | { type: "install_device"; roomId: RoomId; device: DeviceKey }
  | { type: "remove_device"; roomId: RoomId; device: DeviceKey }
  | { type: "start_prime" }
  | { type: "start_assault" }
  | { type: "toggle_pause" }
  | { type: "set_speed"; speed: 1 | 2 };

export interface CommandResult {
  state: GameState;
  accepted: boolean;
  reason?: string;
}

export interface DevicePreview {
  accepted: boolean;
  title: string;
  summary: string;
  changes: string[];
}
