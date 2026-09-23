import { emptyGas, emptyLiquid } from "../materials";
import type { ProcessPhysicsDefinition } from "../encounter/processTypes";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GasAmounts,
  type HazardChannels,
  type LiquidAmounts,
  type RoomAnalysis,
  type RoomState,
} from "../types";
import {
  combinedRoomGas,
  gasTotal,
  gasZoneTotal,
  liquidSurfaceElevation,
  liquidTotal,
  roomHazardScore,
  roomHazards,
  roomMovementMultiplier,
  roomPressure,
  roomStaticPressure,
  roomZoneDensity,
} from "./physics";
import { addMixture, takeMixture } from "./mixture";

export * from "./physics";

const dominantKey = <T extends string>(values: Record<T, number>, keys: readonly T[]): T =>
  keys.reduce((best, key) => (values[key] > values[best] ? key : best), keys[0] as T);

export const analyzeRoom = (
  room: RoomState,
  definition: ProcessPhysicsDefinition
): RoomAnalysis => {
  const combinedGas = combinedRoomGas(room);
  const gasAmount = gasTotal(room);
  const lowerGasAmount = gasZoneTotal(room, "lower");
  const upperGasAmount = gasZoneTotal(room, "upper");
  const liquidAmount = liquidTotal(room);
  const dominantGas = dominantKey(combinedGas, GAS_TYPES);
  const lowerDominantGas = dominantKey(room.gas.lower, GAS_TYPES);
  const upperDominantGas = dominantKey(room.gas.upper, GAS_TYPES);
  const dominantLiquid = liquidAmount > 0.5 ? dominantKey(room.liquid, LIQUID_TYPES) : null;
  const hazard = roomHazardScore(room, definition);
  const staticPressure = roomStaticPressure(room, definition);
  const lowerHazards = roomHazards(room, true, true, "lower", definition);
  const upperHazards = roomHazards(room, false, true, "upper", definition);
  const hazards: HazardChannels = {
    atmosphere: Math.max(lowerHazards.atmosphere, upperHazards.atmosphere),
    corrosion: Math.max(lowerHazards.corrosion, upperHazards.corrosion),
    heat: Math.max(lowerHazards.heat, upperHazards.heat),
    pressure: Math.max(lowerHazards.pressure, upperHazards.pressure),
    radiation: Math.max(lowerHazards.radiation, upperHazards.radiation),
  };
  return {
    gasTotal: gasAmount,
    lowerGasTotal: lowerGasAmount,
    upperGasTotal: upperGasAmount,
    liquidTotal: liquidAmount,
    liquidSurfaceElevation: liquidSurfaceElevation(room, definition),
    staticPressure,
    pressure: roomPressure(room, definition),
    pressurePulse: room.pressurePulse,
    dominantGas,
    dominantGasPercent: gasAmount > 0 ? combinedGas[dominantGas] / gasAmount : 0,
    lowerDominantGas,
    lowerDominantGasPercent:
      lowerGasAmount > 0 ? room.gas.lower[lowerDominantGas] / lowerGasAmount : 0,
    lowerGasDensity: roomZoneDensity(room, "lower", definition),
    lowerGasTemperature: room.gasTemperature.lower,
    upperDominantGas,
    upperDominantGasPercent:
      upperGasAmount > 0 ? room.gas.upper[upperDominantGas] / upperGasAmount : 0,
    upperGasDensity: roomZoneDensity(room, "upper", definition),
    upperGasTemperature: room.gasTemperature.upper,
    dominantLiquid,
    dominantLiquidPercent:
      dominantLiquid && liquidAmount > 0 ? room.liquid[dominantLiquid] / liquidAmount : 0,
    hazard,
    hazards,
    groundMovementMultiplier: roomMovementMultiplier(room, false, definition),
    flyingMovementMultiplier: roomMovementMultiplier(room, true, definition),
  };
};

export const takeGas = (gas: GasAmounts, amount: number): GasAmounts => {
  return { ...emptyGas(), ...takeMixture(gas, amount, GAS_TYPES) };
};

export const takeLiquid = (liquid: LiquidAmounts, amount: number): LiquidAmounts => {
  return { ...emptyLiquid(), ...takeMixture(liquid, amount, LIQUID_TYPES) };
};

export const addGas = (target: GasAmounts, packet: GasAmounts): void => {
  addMixture(target, packet, GAS_TYPES);
};

export const addLiquid = (target: LiquidAmounts, packet: LiquidAmounts): void => {
  addMixture(target, packet, LIQUID_TYPES);
};
