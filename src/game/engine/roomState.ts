import { emptyGas, emptyLiquid } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type GasAmounts,
  type HazardChannels,
  type LiquidAmounts,
  type LimitingFactor,
  type EquipmentInstance,
  type EquipmentOutputState,
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

const cloneHazards = (channels: HazardChannels): HazardChannels => ({ ...channels });
const cloneLimitingFactor = (factor: LimitingFactor): LimitingFactor => ({ ...factor });

const cloneDamageLedger = (ledger: GameState["enemies"][number]["damageBySource"]) =>
  Object.fromEntries(
    Object.entries(ledger).map(([sourceId, channels]) => [sourceId, cloneHazards(channels)])
  ) as GameState["enemies"][number]["damageBySource"];

const cloneEquipmentOutput = (output: EquipmentOutputState | null): EquipmentOutputState | null => {
  if (!output) return null;
  return output.phase === "gas"
    ? { phase: "gas", gas: { ...output.gas } }
    : { phase: "liquid", liquid: { ...output.liquid } };
};

const cloneEquipment = (instance: EquipmentInstance): EquipmentInstance => ({
  ...instance,
  operation: instance.operation
    ? {
        ...instance.operation,
        limitingFactor: cloneLimitingFactor(instance.operation.limitingFactor),
        outputs: Object.fromEntries(
          Object.entries(instance.operation.outputs).map(([id, output]) => [
            id,
            cloneEquipmentOutput(output),
          ])
        ) as NonNullable<EquipmentInstance["operation"]>["outputs"],
      }
    : null,
});

const cloneRooms = (rooms: GameState["rooms"]): GameState["rooms"] =>
  Object.fromEntries(
    Object.entries(rooms).map(([id, room]) => [
      id,
      {
        ...room,
        gas: {
          lower: { ...room.gas.lower },
          upper: { ...room.gas.upper },
        },
        gasTemperature: { ...room.gasTemperature },
        flashCooldown: { ...room.flashCooldown },
        liquid: { ...room.liquid },
        stationary: { ...room.stationary },
        reactions: Object.fromEntries(
          Object.entries(room.reactions).map(([reactionId, telemetry]) => [
            reactionId,
            {
              ...telemetry,
              limitingFactor: cloneLimitingFactor(telemetry.limitingFactor),
            },
          ])
        ) as RoomState["reactions"],
        equipment: Object.fromEntries(
          Object.entries(room.equipment).map(([socketId, instance]) => [
            socketId,
            instance ? cloneEquipment(instance) : null,
          ])
        ) as RoomState["equipment"],
      },
    ])
  ) as GameState["rooms"];

const cloneMaterialState = (
  state: GameState
): Pick<GameState, "gasSources" | "liquidSources" | "gasVent" | "liquidDrain"> => ({
  gasSources: Object.fromEntries(
    Object.entries(state.gasSources).map(([id, source]) => [id, { gas: { ...source.gas } }])
  ) as GameState["gasSources"],
  liquidSources: Object.fromEntries(
    Object.entries(state.liquidSources).map(([id, source]) => [
      id,
      { liquid: { ...source.liquid } },
    ])
  ) as GameState["liquidSources"],
  gasVent: { ...state.gasVent },
  liquidDrain: { ...state.liquidDrain },
});

const cloneNetworkState = (
  state: GameState
): Pick<GameState, "gasJunctions" | "liquidJunctions" | "gasConduits" | "liquidConduits"> => ({
  gasJunctions: Object.fromEntries(
    Object.entries(state.gasJunctions).map(([id, junction]) => [
      id,
      { ...junction, gas: { ...junction.gas } },
    ])
  ) as GameState["gasJunctions"],
  liquidJunctions: Object.fromEntries(
    Object.entries(state.liquidJunctions).map(([id, junction]) => [
      id,
      { liquid: { ...junction.liquid } },
    ])
  ) as GameState["liquidJunctions"],
  gasConduits: Object.fromEntries(
    Object.entries(state.gasConduits).map(([id, conduit]) => [
      id,
      {
        ...conduit,
        route: conduit.route.map((cell) => ({ ...cell })),
        gas: { ...conduit.gas },
        lastSpeciesFlow: { ...conduit.lastSpeciesFlow },
      },
    ])
  ) as GameState["gasConduits"],
  liquidConduits: Object.fromEntries(
    Object.entries(state.liquidConduits).map(([id, conduit]) => [
      id,
      {
        ...conduit,
        route: conduit.route.map((cell) => ({ ...cell })),
        liquid: { ...conduit.liquid },
        lastSpeciesFlow: { ...conduit.lastSpeciesFlow },
      },
    ])
  ) as GameState["liquidConduits"],
});

const cloneCombatState = (
  state: GameState
): Pick<GameState, "enemies" | "stats" | "lastReport" | "events" | "incidents"> => ({
  enemies: state.enemies.map((enemy) => ({
    ...enemy,
    behavior: { ...enemy.behavior },
    path: enemy.path.map((step) => ({ ...step, cell: { ...step.cell } })),
    damageBySource: cloneDamageLedger(enemy.damageBySource),
    lastDamage: enemy.lastDamage
      ? { ...enemy.lastDamage, channels: cloneHazards(enemy.lastDamage.channels) }
      : null,
  })),
  stats: {
    ...state.stats,
    damageByChannel: cloneHazards(state.stats.damageByChannel),
    damageBySource: { ...state.stats.damageBySource },
    fieldDamageAbsorbedBySource: { ...state.stats.fieldDamageAbsorbedBySource },
    killsBySource: { ...state.stats.killsBySource },
  },
  lastReport: state.lastReport
    ? {
        ...state.lastReport,
        damageByChannel: cloneHazards(state.lastReport.damageByChannel),
        damageBySource: { ...state.lastReport.damageBySource },
        fieldDamageAbsorbedBySource: {
          ...state.lastReport.fieldDamageAbsorbedBySource,
        },
        killsBySource: { ...state.lastReport.killsBySource },
      }
    : null,
  events: state.events.map((event) => ({
    ...event,
    parameters: { ...event.parameters },
  })) as GameState["events"],
  incidents: state.incidents.map((incident) => ({
    ...incident,
    damageByChannel: cloneHazards(incident.damageByChannel),
    targets: incident.targets.map((target) => ({
      ...target,
      worldPosition: { ...target.worldPosition },
      damageByChannel: cloneHazards(target.damageByChannel),
    })),
  })),
});

export const cloneGame = (state: GameState): GameState => ({
  ...state,
  pack: { ...state.pack },
  // The map is immutable between edits; clones share it so derived geometry caches hold.
  map: state.map,
  mapRevision: state.mapRevision,
  run: { ...state.run },
  world: {
    rooms: [...state.world.rooms],
    connections: [...state.world.connections],
  },
  campaign: {
    ...state.campaign,
    completedLevelIds: [...state.campaign.completedLevelIds],
  },
  availability: {
    equipment: [...state.availability.equipment],
    gasLines: [...state.availability.gasLines],
    liquidLines: [...state.availability.liquidLines],
  },
  rooms: cloneRooms(state.rooms),
  ...cloneMaterialState(state),
  ...cloneNetworkState(state),
  portalStates: Object.fromEntries(
    Object.entries(state.portalStates).map(([portalId, portalState]) => [
      portalId,
      { ...portalState },
    ])
  ),
  ...cloneCombatState(state),
});

const dominantKey = <T extends string>(values: Record<T, number>, keys: readonly T[]): T =>
  keys.reduce((best, key) => (values[key] > values[best] ? key : best), keys[0] as T);

export const analyzeRoom = (room: RoomState, definition: GameDefinition): RoomAnalysis => {
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
