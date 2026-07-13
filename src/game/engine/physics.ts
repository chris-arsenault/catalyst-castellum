import { HYDROGEN_FLASH_RULES } from "../content/chemistry";
import { roomLiquidSurfaceElevation, roomVolume } from "../content/facilityGeometry";
import { SPECIES_DEFINITIONS } from "../content/substances";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GasAmounts,
  type GasType,
  type GasZone,
  type HazardChannels,
  type LiquidAmounts,
  type LiquidType,
  type RoomState,
} from "../types";
import { clamp, sumRecord } from "./math";
import { roomEquipmentVolume } from "./equipment";

export const STANDARD_PRESSURE = 101.3;
export const STANDARD_TEMPERATURE = 22;
export const MAX_LIQUID_FILL_RATIO = 0.92;
export const MAX_ROOM_STATIC_PRESSURE = 260;
export const LIQUID_SLOW_START = 0.15;
export const PRESSURE_SLOW_START = 1.3;
export const CATASTROPHIC_PRESSURE_START = 2.2;
export const AMBIENT_MOLAR_MASS = 28.97;

const MINIMUM_GAS_VOLUME_RATIO = 1 - MAX_LIQUID_FILL_RATIO;
const ABSOLUTE_ZERO_OFFSET = 273.15;

const minimumGasVolume = (room: RoomState): number =>
  roomVolume(room.id) * MINIMUM_GAS_VOLUME_RATIO;

const maximumLiquidFill = (room: RoomState): number => roomVolume(room.id) * MAX_LIQUID_FILL_RATIO;

export const kelvin = (temperature: number): number => temperature + ABSOLUTE_ZERO_OFFSET;

const temperatureRatio = (temperature: number): number =>
  kelvin(temperature) / kelvin(STANDARD_TEMPERATURE);

export const gasAmountTotal = (gas: GasAmounts): number => sumRecord(gas, GAS_TYPES);
export const liquidAmountTotal = (liquid: LiquidAmounts): number => sumRecord(liquid, LIQUID_TYPES);
export const gasZoneTotal = (room: RoomState, zone: GasZone): number =>
  gasAmountTotal(room.gas[zone]);
export const gasTotal = (room: RoomState): number =>
  gasZoneTotal(room, "lower") + gasZoneTotal(room, "upper");
export const liquidTotal = (room: RoomState): number => liquidAmountTotal(room.liquid);

export const combinedRoomGas = (room: RoomState): GasAmounts =>
  Object.fromEntries(
    GAS_TYPES.map((gas) => [gas, room.gas.lower[gas] + room.gas.upper[gas]])
  ) as GasAmounts;

export const roomGasTemperature = (room: RoomState): number => {
  const lowerAmount = gasZoneTotal(room, "lower");
  const upperAmount = gasZoneTotal(room, "upper");
  const total = lowerAmount + upperAmount;
  if (total <= 0) return room.temperature;
  return (
    (room.gasTemperature.lower * lowerAmount + room.gasTemperature.upper * upperAmount) / total
  );
};

export const mixedTemperature = (
  existingTemperature: number,
  existingAmount: number,
  incomingTemperature: number,
  incomingAmount: number
): number => {
  const total = existingAmount + incomingAmount;
  if (total <= 0) return existingTemperature;
  return (existingTemperature * existingAmount + incomingTemperature * incomingAmount) / total;
};

export const roomUsableVolume = (room: RoomState): number =>
  Math.max(minimumGasVolume(room), roomVolume(room.id) - roomEquipmentVolume(room));

export const gasCapacity = (room: RoomState): number =>
  Math.max(minimumGasVolume(room), roomUsableVolume(room) - liquidTotal(room));

export const gasZoneCapacity = (room: RoomState): number => gasCapacity(room) / 2;

export const roomStaticPressure = (room: RoomState): number =>
  (gasTotal(room) / gasCapacity(room)) *
  STANDARD_PRESSURE *
  temperatureRatio(roomGasTemperature(room));

export const roomPressure = (room: RoomState): number =>
  roomStaticPressure(room) + room.pressurePulse;

export const roomGasHeadroom = (room: RoomState): number => {
  const maximumGas =
    (gasCapacity(room) * MAX_ROOM_STATIC_PRESSURE) /
    (STANDARD_PRESSURE * temperatureRatio(roomGasTemperature(room)));
  return Math.max(0, maximumGas - gasTotal(room));
};

export const roomLiquidHeadroom = (room: RoomState): number => {
  const gasVolumeAtPressureLimit =
    (gasTotal(room) * STANDARD_PRESSURE * temperatureRatio(roomGasTemperature(room))) /
    MAX_ROOM_STATIC_PRESSURE;
  const requiredGasVolume = Math.max(minimumGasVolume(room), gasVolumeAtPressureLimit);
  const maximumLiquid = Math.min(
    maximumLiquidFill(room),
    roomUsableVolume(room) - requiredGasVolume
  );
  return Math.max(0, maximumLiquid - liquidTotal(room));
};

export const liquidFillRatio = (room: RoomState): number =>
  liquidTotal(room) / roomUsableVolume(room);

export const liquidSurfaceElevation = (room: RoomState): number => {
  const effectiveVolume = liquidFillRatio(room) * roomVolume(room.id);
  return roomLiquidSurfaceElevation(room.id, effectiveVolume);
};

export const gasZoneForPort = (portHeight: number): GasZone =>
  portHeight < 0.5 ? "lower" : "upper";

export const pressureMovementMultiplier = (room: RoomState): number => {
  const pressureRatio = roomStaticPressure(room) / STANDARD_PRESSURE;
  const slowdown = clamp((pressureRatio - PRESSURE_SLOW_START) / 1.2, 0, 0.55);
  return 1 - slowdown;
};

export const liquidMovementMultiplier = (room: RoomState, flying: boolean): number => {
  if (flying) return 1;
  const maximumFillRatio =
    Math.min(maximumLiquidFill(room), roomUsableVolume(room) - minimumGasVolume(room)) /
    roomUsableVolume(room);
  const fillRange = maximumFillRatio - LIQUID_SLOW_START;
  const slowdown = clamp(((liquidFillRatio(room) - LIQUID_SLOW_START) / fillRange) * 0.65, 0, 0.65);
  return 1 - slowdown;
};

export const roomMovementMultiplier = (room: RoomState, flying: boolean): number =>
  Math.max(0.2, pressureMovementMultiplier(room) * liquidMovementMultiplier(room, flying));

export const gasPercent = (room: RoomState, gas: GasType, zone?: GasZone): number => {
  if (zone) {
    const total = gasZoneTotal(room, zone);
    return total > 0 ? room.gas[zone][gas] / total : 0;
  }
  const total = gasTotal(room);
  return total > 0 ? (room.gas.lower[gas] + room.gas.upper[gas]) / total : 0;
};

export const liquidPercent = (room: RoomState, liquid: LiquidType): number => {
  const total = liquidTotal(room);
  return total > 0 ? room.liquid[liquid] / total : 0;
};

export const liquidStrength = (room: RoomState, liquid: LiquidType): number =>
  room.liquid[liquid] * liquidPercent(room, liquid);

export const gasMixtureMolarMass = (gas: GasAmounts): number => {
  const total = gasAmountTotal(gas);
  if (total <= 0) return AMBIENT_MOLAR_MASS;
  return (
    GAS_TYPES.reduce(
      (mass, species) => mass + gas[species] * SPECIES_DEFINITIONS[species].molarMass,
      0
    ) / total
  );
};

export const gasRelativeDensity = (gas: GasAmounts, temperature: number): number =>
  gasMixtureMolarMass(gas) / AMBIENT_MOLAR_MASS / temperatureRatio(temperature);

export const roomZoneDensity = (room: RoomState, zone: GasZone): number =>
  gasRelativeDensity(room.gas[zone], room.gasTemperature[zone]);

export const liquidRelativeDensity = (liquid: LiquidAmounts): number => {
  const total = liquidAmountTotal(liquid);
  if (total <= 0) return 1;
  return (
    LIQUID_TYPES.reduce(
      (density, species) =>
        density + liquid[species] * SPECIES_DEFINITIONS[species].referenceDensity,
      0
    ) / total
  );
};

const gasPartialRatio = (room: RoomState, gas: GasType, zone: GasZone): number =>
  (roomStaticPressure(room) / STANDARD_PRESSURE) * gasPercent(room, gas, zone);

export const roomHazards = (
  room: RoomState,
  floorContact = true,
  needsOxygen = true,
  zone: GasZone = floorContact ? "lower" : "upper"
): HazardChannels => {
  const chlorine = gasPartialRatio(room, "chlorine", zone);
  const hydrogenChloride = gasPartialRatio(room, "hydrogen_chloride", zone);
  const oxygen = gasPartialRatio(room, "oxygen", zone);
  const carbonDioxide = gasPartialRatio(room, "carbon_dioxide", zone);
  const steam = gasPartialRatio(room, "steam", zone);
  const respiration = needsOxygen
    ? Math.max(0, 0.13 - oxygen) * 58 + Math.max(0, carbonDioxide - 0.14) * 24
    : 0;
  const atmosphere =
    Math.max(0, chlorine - 0.004) * 105 + Math.max(0, hydrogenChloride - 0.006) * 42 + respiration;
  let corrosion = Math.max(0, chlorine - 0.004) * 80 + Math.max(0, hydrogenChloride - 0.006) * 72;
  if (floorContact) {
    corrosion += Math.max(0, liquidStrength(room, "sodium_hydroxide") - 2) * 0.72;
    corrosion += Math.max(0, liquidStrength(room, "hydrochloric_acid") - 2) * 0.58;
    corrosion += Math.max(0, liquidStrength(room, "sodium_hypochlorite") - 5) * 0.24;
  }
  const heat = Math.max(0, steam - 0.13) * 26 + Math.max(0, room.gasTemperature[zone] - 48) * 0.17;
  const pressure =
    Math.max(0, roomStaticPressure(room) / STANDARD_PRESSURE - CATASTROPHIC_PRESSURE_START) * 90;
  return { atmosphere, corrosion, heat, pressure, radiation: 0 };
};

const totalHazard = (hazards: HazardChannels): number =>
  hazards.atmosphere + hazards.corrosion + hazards.heat + hazards.pressure + hazards.radiation;

export const roomHazardScore = (room: RoomState): number => {
  const lower = totalHazard(roomHazards(room, true, true, "lower"));
  const upper = totalHazard(roomHazards(room, false, true, "upper"));
  return clamp(Math.max(lower, upper) * 3.5, 0, 100);
};

const chlorineExposureEffect = (label: string, chlorine: number): string | null => {
  if (chlorine < 0.006) return null;
  return `${label} Cl₂ inhalation ${chlorine >= 0.04 ? "severe" : "active"}`;
};

const zoneExposureEffects = (room: RoomState, zone: GasZone): string[] => {
  const effects: string[] = [];
  const label = zone === "lower" ? "Lower" : "Upper";
  const chlorine = gasPartialRatio(room, "chlorine", zone);
  const hydrogenChloride = gasPartialRatio(room, "hydrogen_chloride", zone);
  const hydrogen = gasPartialRatio(room, "hydrogen", zone);
  const oxygen = gasPartialRatio(room, "oxygen", zone);
  const flashExtent = Math.min(room.gas[zone].hydrogen / 2, room.gas[zone].oxygen);
  const chlorineEffect = chlorineExposureEffect(label, chlorine);
  if (chlorineEffect) effects.push(chlorineEffect);
  if (hydrogenChloride >= 0.009) effects.push(`${label} HCl respiratory corrosion`);
  if (chlorine >= 0.01 && hydrogen >= 0.01) effects.push(`${label} H₂ / Cl₂ mixture`);
  if (
    gasPercent(room, "hydrogen", zone) >= 0.005 &&
    gasPercent(room, "oxygen", zone) >= HYDROGEN_FLASH_RULES.minimumOxygenFraction
  ) {
    const charge = Math.min(1, flashExtent / (HYDROGEN_FLASH_RULES.ignitionExtent / 2));
    effects.push(`${label} H₂/O₂ flash charge ${Math.round(charge * 100)}%`);
  }
  if (oxygen < 0.13) effects.push(`${label} oxygen partial pressure low`);
  if (room.gasTemperature[zone] >= 55)
    effects.push(`${label} heat exposure ${Math.round(room.gasTemperature[zone])}°C`);
  return effects;
};

const liquidExposureEffects = (room: RoomState): string[] => {
  const effects: string[] = [];
  if (liquidStrength(room, "sodium_hydroxide") >= 4) effects.push("NaOH floor contact corrosive");
  if (liquidStrength(room, "hydrochloric_acid") >= 4)
    effects.push("HCl(aq) floor contact corrosive");
  if (liquidStrength(room, "sodium_hypochlorite") >= 7) effects.push("NaOCl oxidizer pool active");
  return effects;
};

export const roomExpectedEffects = (room: RoomState): string[] => {
  const effects = [
    ...zoneExposureEffects(room, "lower"),
    ...zoneExposureEffects(room, "upper"),
    ...liquidExposureEffects(room),
  ];
  const liquidMovement = liquidMovementMultiplier(room, false);
  const pressureMovement = pressureMovementMultiplier(room);
  if (liquidMovement < 0.99)
    effects.push(`Liquid depth slows ground movement ${Math.round((1 - liquidMovement) * 100)}%`);
  if (pressureMovement < 0.99)
    effects.push(`Overpressure slows all movement ${Math.round((1 - pressureMovement) * 100)}%`);
  const catastrophicPressure = roomHazards(room).pressure;
  if (catastrophicPressure > 0.01)
    effects.push(`Catastrophic static pressure ${catastrophicPressure.toFixed(1)} pressure/s`);
  if (room.pressurePulse > 1)
    effects.push(
      `Transient pressure impulse affects transport +${Math.round(room.pressurePulse)} kPa`
    );
  return effects.length > 0 ? effects : ["Enemy exposure below damage thresholds"];
};
