import { facilityModelForMap } from "../world/derivedModel";
import type { GameDefinition } from "../definitionTypes";
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
  type SpeciesHazardRule,
} from "../types";
import { clamp, sumRecord } from "./math";
import { roomEquipmentVolume } from "./equipment";

export const STANDARD_PRESSURE = 101.3;
export const STANDARD_TEMPERATURE = 22;
export const MAX_LIQUID_FILL_RATIO = 0.92;
export const MAX_ROOM_STATIC_PRESSURE = 260;
export const LIQUID_SLOW_START = 0.15;
export const PRESSURE_SLOW_START = 1.3;
/** Compatibility threshold for the default content pack; mechanics read the bound definition. */
export const CATASTROPHIC_PRESSURE_START = 2.2;
export const AMBIENT_MOLAR_MASS = 28.97;

const MINIMUM_GAS_VOLUME_RATIO = 1 - MAX_LIQUID_FILL_RATIO;
const ABSOLUTE_ZERO_OFFSET = 273.15;

const minimumGasVolume = (room: RoomState, definition: GameDefinition): number =>
  facilityModelForMap(definition.map).roomVolume(room.id) * MINIMUM_GAS_VOLUME_RATIO;

const maximumLiquidFill = (room: RoomState, definition: GameDefinition): number =>
  facilityModelForMap(definition.map).roomVolume(room.id) * MAX_LIQUID_FILL_RATIO;

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

export const roomUsableVolume = (room: RoomState, definition: GameDefinition): number =>
  Math.max(
    minimumGasVolume(room, definition),
    facilityModelForMap(definition.map).roomVolume(room.id) - roomEquipmentVolume(room, definition)
  );

export const gasCapacity = (room: RoomState, definition: GameDefinition): number =>
  Math.max(
    minimumGasVolume(room, definition),
    roomUsableVolume(room, definition) - liquidTotal(room)
  );

export const gasZoneCapacity = (room: RoomState, definition: GameDefinition): number =>
  gasCapacity(room, definition) / 2;

export const roomStaticPressure = (room: RoomState, definition: GameDefinition): number =>
  (gasTotal(room) / gasCapacity(room, definition)) *
  STANDARD_PRESSURE *
  temperatureRatio(roomGasTemperature(room));

export const roomPressure = (room: RoomState, definition: GameDefinition): number =>
  roomStaticPressure(room, definition) + room.pressurePulse;

export const roomGasHeadroom = (room: RoomState, definition: GameDefinition): number => {
  const maximumGas =
    (gasCapacity(room, definition) * MAX_ROOM_STATIC_PRESSURE) /
    (STANDARD_PRESSURE * temperatureRatio(roomGasTemperature(room)));
  return Math.max(0, maximumGas - gasTotal(room));
};

export const roomLiquidHeadroom = (room: RoomState, definition: GameDefinition): number => {
  const gasVolumeAtPressureLimit =
    (gasTotal(room) * STANDARD_PRESSURE * temperatureRatio(roomGasTemperature(room))) /
    MAX_ROOM_STATIC_PRESSURE;
  const requiredGasVolume = Math.max(minimumGasVolume(room, definition), gasVolumeAtPressureLimit);
  const maximumLiquid = Math.min(
    maximumLiquidFill(room, definition),
    roomUsableVolume(room, definition) - requiredGasVolume
  );
  return Math.max(0, maximumLiquid - liquidTotal(room));
};

export const liquidFillRatio = (room: RoomState, definition: GameDefinition): number =>
  liquidTotal(room) / roomUsableVolume(room, definition);

export const liquidSurfaceElevation = (room: RoomState, definition: GameDefinition): number => {
  const effectiveVolume =
    liquidFillRatio(room, definition) * facilityModelForMap(definition.map).roomVolume(room.id);
  return facilityModelForMap(definition.map).roomLiquidSurfaceElevation(room.id, effectiveVolume);
};

export const gasZoneForPort = (portHeight: number): GasZone =>
  portHeight < 0.5 ? "lower" : "upper";

export const pressureMovementMultiplier = (room: RoomState, definition: GameDefinition): number => {
  const pressureRatio = roomStaticPressure(room, definition) / STANDARD_PRESSURE;
  const slowdown = clamp((pressureRatio - PRESSURE_SLOW_START) / 1.2, 0, 0.55);
  return 1 - slowdown;
};

export const liquidMovementMultiplier = (
  room: RoomState,
  flying: boolean,
  definition: GameDefinition
): number => {
  if (flying) return 1;
  const maximumFillRatio =
    Math.min(
      maximumLiquidFill(room, definition),
      roomUsableVolume(room, definition) - minimumGasVolume(room, definition)
    ) / roomUsableVolume(room, definition);
  const fillRange = maximumFillRatio - LIQUID_SLOW_START;
  const slowdown = clamp(
    ((liquidFillRatio(room, definition) - LIQUID_SLOW_START) / fillRange) * 0.65,
    0,
    0.65
  );
  return 1 - slowdown;
};

export const roomMovementMultiplier = (
  room: RoomState,
  flying: boolean,
  definition: GameDefinition
): number =>
  Math.max(
    0.2,
    pressureMovementMultiplier(room, definition) *
      liquidMovementMultiplier(room, flying, definition)
  );

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

export const gasMixtureMolarMass = (gas: GasAmounts, definition: GameDefinition): number => {
  const total = gasAmountTotal(gas);
  if (total <= 0) return AMBIENT_MOLAR_MASS;
  return (
    GAS_TYPES.reduce(
      (mass, species) => mass + gas[species] * definition.species[species].molarMass,
      0
    ) / total
  );
};

export const gasRelativeDensity = (
  gas: GasAmounts,
  temperature: number,
  definition: GameDefinition
): number =>
  gasMixtureMolarMass(gas, definition) / AMBIENT_MOLAR_MASS / temperatureRatio(temperature);

export const roomZoneDensity = (
  room: RoomState,
  zone: GasZone,
  definition: GameDefinition
): number => gasRelativeDensity(room.gas[zone], room.gasTemperature[zone], definition);

export const liquidRelativeDensity = (
  liquid: LiquidAmounts,
  definition: GameDefinition
): number => {
  const total = liquidAmountTotal(liquid);
  if (total <= 0) return 1;
  return (
    LIQUID_TYPES.reduce(
      (density, species) =>
        density + liquid[species] * definition.species[species].referenceDensity,
      0
    ) / total
  );
};

export const gasPartialRatio = (
  room: RoomState,
  gas: GasType,
  zone: GasZone,
  definition: GameDefinition
): number =>
  (roomStaticPressure(room, definition) / STANDARD_PRESSURE) * gasPercent(room, gas, zone);

const hazardExposureApplies = (
  rule: SpeciesHazardRule,
  floorContact: boolean,
  needsOxygen: boolean
): boolean =>
  rule.exposure === "all" ||
  (rule.exposure === "floor_contact" && floorContact) ||
  (rule.exposure === "oxygen_breathers" && needsOxygen);

const hazardExcess = (value: number, rule: SpeciesHazardRule): number =>
  rule.direction === "above"
    ? Math.max(0, value - rule.threshold)
    : Math.max(0, rule.threshold - value);

const speciesHazards = (
  room: RoomState,
  floorContact: boolean,
  needsOxygen: boolean,
  zone: GasZone,
  definition: GameDefinition
): HazardChannels => {
  const hazards: HazardChannels = {
    atmosphere: 0,
    corrosion: 0,
    heat: 0,
    pressure: 0,
    radiation: 0,
  };
  for (const species of Object.values(definition.species)) {
    const value =
      species.phase === "gas"
        ? gasPartialRatio(room, species.id as GasType, zone, definition)
        : liquidStrength(room, species.id as LiquidType);
    for (const rule of species.hazards) {
      if (!hazardExposureApplies(rule, floorContact, needsOxygen)) continue;
      hazards[rule.channel] += hazardExcess(value, rule) * rule.rate;
    }
  }
  return hazards;
};

export const roomHazards = (
  room: RoomState,
  floorContact = true,
  needsOxygen = true,
  zone: GasZone = floorContact ? "lower" : "upper",
  definition: GameDefinition
): HazardChannels => {
  const hazards = speciesHazards(room, floorContact, needsOxygen, zone, definition);
  hazards.heat +=
    Math.max(
      0,
      room.gasTemperature[zone] - definition.environmentHazards.gasTemperature.threshold
    ) * definition.environmentHazards.gasTemperature.rate;
  hazards.pressure +=
    Math.max(
      0,
      roomStaticPressure(room, definition) / STANDARD_PRESSURE -
        definition.environmentHazards.staticPressure.ratioThreshold
    ) * definition.environmentHazards.staticPressure.rate;
  return hazards;
};

const totalHazard = (hazards: HazardChannels): number =>
  hazards.atmosphere + hazards.corrosion + hazards.heat + hazards.pressure + hazards.radiation;

export const roomHazardScore = (room: RoomState, definition: GameDefinition): number => {
  const lower = totalHazard(roomHazards(room, true, true, "lower", definition));
  const upper = totalHazard(roomHazards(room, false, true, "upper", definition));
  return clamp(Math.max(lower, upper) * 3.5, 0, 100);
};
