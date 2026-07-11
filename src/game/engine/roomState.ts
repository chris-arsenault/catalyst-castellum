import {
  AMBIENT_TEMPERATURE,
  GAS_NAMES,
  MAX_ENERGY,
  ROOM_ORDER,
  STARTING_DEVICES,
  ambientGas,
  emptyLiquid,
} from "../config";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type GasAmounts,
  type GasType,
  type LiquidType,
  type RoomAnalysis,
  type RoomId,
  type RoomState,
} from "../types";
import { makeStats } from "./events";
import { clamp, sumRecord } from "./math";

export const gasTotal = (room: RoomState): number => sumRecord(room.gas, GAS_TYPES);
export const liquidTotal = (room: RoomState): number => sumRecord(room.liquid, LIQUID_TYPES);

export const gasCapacity = (room: RoomState): number =>
  Math.max(22, 100 - liquidTotal(room) * 0.72);

export const roomPressure = (room: RoomState): number => (gasTotal(room) / gasCapacity(room)) * 101;

export const gasPercent = (room: RoomState, gas: GasType): number => {
  const total = gasTotal(room);
  return total > 0 ? room.gas[gas] / total : 0;
};

export const liquidPercent = (room: RoomState, liquid: LiquidType): number => {
  const total = liquidTotal(room);
  return total > 0 ? room.liquid[liquid] / total : 0;
};

export const liquidStrength = (room: RoomState, liquid: LiquidType): number =>
  room.liquid[liquid] * liquidPercent(room, liquid);

const makeRoom = (id: RoomId): RoomState => ({
  id,
  gas: ambientGas(),
  liquid: emptyLiquid(),
  temperature: AMBIENT_TEMPERATURE,
  residue: 0,
  sealTimer: 0,
  flashTimer: 0,
  flashIntensity: 0,
  devices: [...(STARTING_DEVICES[id] ?? [])],
});

const makeRooms = (): Record<RoomId, RoomState> =>
  Object.fromEntries(ROOM_ORDER.map((id) => [id, makeRoom(id)])) as Record<RoomId, RoomState>;

export const createInitialGame = (): GameState => ({
  version: 1,
  phase: "build",
  cycle: 1,
  phaseTime: 0,
  elapsed: 0,
  rooms: makeRooms(),
  enemies: [],
  spawnCursor: 0,
  nextEnemyId: 1,
  nextEventId: 2,
  coreIntegrity: 100,
  energy: MAX_ENERGY,
  buildPoints: 4,
  cooldowns: {},
  paused: false,
  speed: 1,
  stats: makeStats(),
  lastReport: null,
  events: [
    {
      id: 1,
      cycle: 1,
      phase: "build",
      tone: "info",
      title: "Base systems online",
      detail: "Inspect the installed modules, then prime the chambers before opening the intake.",
    },
  ],
});

const cloneRoom = (room: RoomState): RoomState => ({
  ...room,
  gas: { ...room.gas },
  liquid: { ...room.liquid },
  devices: [...room.devices],
});

export const cloneGame = (state: GameState): GameState => ({
  ...state,
  rooms: Object.fromEntries(ROOM_ORDER.map((id) => [id, cloneRoom(state.rooms[id])])) as Record<
    RoomId,
    RoomState
  >,
  enemies: state.enemies.map((enemy) => ({ ...enemy, route: [...enemy.route] })),
  cooldowns: { ...state.cooldowns },
  stats: { ...state.stats },
  lastReport: state.lastReport ? { ...state.lastReport } : null,
  events: state.events.map((event) => ({ ...event })),
});

const dominantKey = <T extends string>(values: Record<T, number>, keys: readonly T[]): T =>
  keys.reduce((best, key) => (values[key] > values[best] ? key : best), keys[0] as T);

const hazardScore = (room: RoomState): number => {
  const toxic = gasPercent(room, "toxic_gas");
  const oxygen = gasPercent(room, "oxygen");
  const co2 = gasPercent(room, "co2");
  const steam = gasPercent(room, "steam");
  let score = Math.max(0, toxic - 0.16) * 125;
  score += Math.max(0, 0.38 - oxygen) * 80;
  score += Math.max(0, co2 - 0.42) * 50;
  score += Math.max(0, steam - 0.12) * 75;
  score += Math.max(0, liquidStrength(room, "acid") - 6) * 0.8;
  score += Math.max(0, liquidStrength(room, "caustic") - 6) * 0.72;
  score += Math.max(0, room.temperature - 48) * 0.28;
  score += room.flashTimer > 0 ? room.flashIntensity * 28 : 0;
  return clamp(score, 0, 100);
};

const gasEffects = (room: RoomState): string[] => {
  const effects: string[] = [];
  const toxic = gasPercent(room, "toxic_gas");
  const oxygen = gasPercent(room, "oxygen");
  const co2 = gasPercent(room, "co2");
  const fuel = gasPercent(room, "fuel_gas");
  if (toxic >= 0.22) effects.push(`Organic exposure ${toxic >= 0.48 ? "severe" : "active"}`);
  if (oxygen < 0.35) effects.push("Oxygen breathers suffocating");
  if (fuel >= 0.18 && oxygen >= 0.2) {
    effects.push(co2 >= 0.42 ? "Ignition heavily suppressed" : "Combustible mix armed");
  }
  return effects;
};

const liquidEffects = (room: RoomState): string[] => {
  const effects: string[] = [];
  const acid = liquidStrength(room, "acid");
  const caustic = liquidStrength(room, "caustic");
  const sludge = liquidStrength(room, "sludge");
  if (acid >= 12) effects.push("Ground armor dissolving");
  if (caustic >= 12) effects.push("Organics chemically burned");
  if (sludge >= 12) {
    effects.push(`Ground movement −${Math.round(clamp(sludge / 80, 0, 0.65) * 100)}%`);
  }
  return effects;
};

const thermalEffects = (room: RoomState): string[] => {
  const effects: string[] = [];
  const steam = gasPercent(room, "steam");
  if (steam >= 0.2) effects.push("Steam exposure active");
  if (room.temperature >= 55) effects.push(`Heat exposure ${Math.round(room.temperature)}°C`);
  return effects;
};

const expectedEffects = (room: RoomState): string[] => {
  const effects = [...gasEffects(room), ...liquidEffects(room), ...thermalEffects(room)];
  return effects.length > 0 ? effects : ["No meaningful enemy effect"];
};

const hazardLabel = (hazard: number): RoomAnalysis["hazardLabel"] => {
  if (hazard >= 65) return "LETHAL";
  if (hazard >= 32) return "HOSTILE";
  if (hazard >= 10) return "LOW";
  return "CLEAR";
};

export const analyzeRoom = (room: RoomState): RoomAnalysis => {
  const gasAmount = gasTotal(room);
  const liquidAmount = liquidTotal(room);
  const dominantGas = dominantKey(room.gas, GAS_TYPES);
  const dominantLiquid = liquidAmount > 0.5 ? dominantKey(room.liquid, LIQUID_TYPES) : null;
  const hazard = hazardScore(room);
  return {
    gasTotal: gasAmount,
    liquidTotal: liquidAmount,
    pressure: roomPressure(room),
    dominantGas,
    dominantGasPercent: gasAmount > 0 ? room.gas[dominantGas] / gasAmount : 0,
    dominantLiquid,
    dominantLiquidPercent:
      dominantLiquid && liquidAmount > 0 ? room.liquid[dominantLiquid] / liquidAmount : 0,
    hazard,
    hazardLabel: hazardLabel(hazard),
    effects: expectedEffects(room),
  };
};

const removeGasProportionally = (
  gas: GasAmounts,
  amount: number,
  exclude: GasType | null = null
): number => {
  const keys = GAS_TYPES.filter((key) => key !== exclude);
  const available = keys.reduce((total, key) => total + gas[key], 0);
  if (available <= 0 || amount <= 0) return 0;
  const actual = Math.min(available, amount);
  for (const key of keys) gas[key] = Math.max(0, gas[key] - actual * (gas[key] / available));
  return actual;
};

const normalizeUnsealedGas = (room: RoomState): void => {
  if (room.sealTimer > 0 || gasTotal(room) <= gasCapacity(room)) return;
  const scale = gasCapacity(room) / gasTotal(room);
  for (const key of GAS_TYPES) room.gas[key] *= scale;
};

export const injectGas = (room: RoomState, payload: GasType, amount: number): void => {
  if (room.sealTimer <= 0) {
    const needed = Math.max(0, gasTotal(room) + amount - gasCapacity(room));
    const removed = removeGasProportionally(room.gas, needed, payload);
    if (removed < needed) room.gas[payload] = Math.max(0, room.gas[payload] - (needed - removed));
  }
  room.gas[payload] += amount;
  normalizeUnsealedGas(room);
};

export const injectMixture = (room: RoomState, mixture: GasAmounts): void => {
  const amount = sumRecord(mixture, GAS_TYPES);
  if (room.sealTimer <= 0) removeGasProportionally(room.gas, amount);
  for (const key of GAS_TYPES) room.gas[key] += mixture[key];
  normalizeUnsealedGas(room);
};

export const injectLiquid = (room: RoomState, payload: LiquidType, amount: number): void => {
  room.liquid[payload] += amount;
  const total = liquidTotal(room);
  if (total > 88) {
    const overflow = total - 88;
    const scale = 88 / total;
    for (const key of LIQUID_TYPES) room.liquid[key] *= scale;
    room.residue = clamp(room.residue + overflow * 0.12, 0, 100);
  }
  normalizeUnsealedGas(room);
};

export const flushGas = (room: RoomState): void => {
  const capacity = gasCapacity(room);
  const target = ambientGas();
  for (const key of GAS_TYPES) {
    const ambient = (target[key] / 100) * capacity;
    room.gas[key] = room.gas[key] * 0.16 + ambient * 0.84;
  }
};

export const drainLiquid = (room: RoomState, remainingFraction = 0.22): void => {
  for (const key of LIQUID_TYPES) room.liquid[key] *= remainingFraction;
  room.residue = Math.max(0, room.residue - 9);
};

export const dominantGasName = (room: RoomState): string =>
  GAS_NAMES[analyzeRoom(room).dominantGas];
