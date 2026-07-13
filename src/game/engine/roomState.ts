import { emptyGas, emptyLiquid } from "../config";
import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import {
  GAS_BUFFER_IDS,
  DAMAGE_SOURCE_IDS,
  GAS_SOURCE_IDS,
  GAS_TYPES,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  LIQUID_TYPES,
  PROCESS_IDS,
  ROOM_REACTION_IDS,
  TRANSPORT_RUN_IDS,
  type GameState,
  type GasAmounts,
  type HazardChannels,
  type LiquidAmounts,
  type LimitingFactor,
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
    DAMAGE_SOURCE_IDS.map((sourceId) => [sourceId, cloneHazards(ledger[sourceId])])
  ) as GameState["enemies"][number]["damageBySource"];

const cloneRooms = (rooms: GameState["rooms"], definition: GameDefinition): GameState["rooms"] =>
  Object.fromEntries(
    definition.roomOrder.map((id) => [
      id,
      {
        ...rooms[id],
        gas: {
          lower: { ...rooms[id].gas.lower },
          upper: { ...rooms[id].gas.upper },
        },
        gasTemperature: { ...rooms[id].gasTemperature },
        flashCooldown: { ...rooms[id].flashCooldown },
        liquid: { ...rooms[id].liquid },
        reactions: Object.fromEntries(
          ROOM_REACTION_IDS.map((reactionId) => [
            reactionId,
            {
              ...rooms[id].reactions[reactionId],
              limitingFactor: cloneLimitingFactor(rooms[id].reactions[reactionId].limitingFactor),
            },
          ])
        ) as RoomState["reactions"],
        equipment: Object.fromEntries(
          Object.entries(rooms[id].equipment).map(([socketId, instance]) => [
            socketId,
            instance ? { ...instance } : null,
          ])
        ) as RoomState["equipment"],
      },
    ])
  ) as GameState["rooms"];

const cloneMaterialState = (
  state: GameState
): Pick<
  GameState,
  "gasSources" | "liquidSources" | "gasBuffers" | "liquidBuffers" | "gasVent" | "liquidDrain"
> => ({
  gasSources: Object.fromEntries(
    GAS_SOURCE_IDS.map((id) => [id, { gas: { ...state.gasSources[id].gas } }])
  ) as GameState["gasSources"],
  liquidSources: Object.fromEntries(
    LIQUID_SOURCE_IDS.map((id) => [id, { liquid: { ...state.liquidSources[id].liquid } }])
  ) as GameState["liquidSources"],
  gasBuffers: Object.fromEntries(
    GAS_BUFFER_IDS.map((id) => [id, { gas: { ...state.gasBuffers[id].gas } }])
  ) as GameState["gasBuffers"],
  liquidBuffers: Object.fromEntries(
    LIQUID_BUFFER_IDS.map((id) => [id, { liquid: { ...state.liquidBuffers[id].liquid } }])
  ) as GameState["liquidBuffers"],
  gasVent: { ...state.gasVent },
  liquidDrain: { ...state.liquidDrain },
});

const cloneNetworkState = (
  state: GameState,
  definition: GameDefinition
): Pick<GameState, "gasJunctions" | "liquidJunctions" | "gasConduits" | "liquidConduits"> => ({
  gasJunctions: Object.fromEntries(
    definition.roomOrder.map((id) => [
      id,
      { ...state.gasJunctions[id], gas: { ...state.gasJunctions[id].gas } },
    ])
  ) as GameState["gasJunctions"],
  liquidJunctions: Object.fromEntries(
    definition.roomOrder.map((id) => [id, { liquid: { ...state.liquidJunctions[id].liquid } }])
  ) as GameState["liquidJunctions"],
  gasConduits: Object.fromEntries(
    TRANSPORT_RUN_IDS.map((id) => [
      id,
      {
        ...state.gasConduits[id],
        route: state.gasConduits[id].route.map((cell) => ({ ...cell })),
        gas: { ...state.gasConduits[id].gas },
        lastSpeciesFlow: { ...state.gasConduits[id].lastSpeciesFlow },
      },
    ])
  ) as GameState["gasConduits"],
  liquidConduits: Object.fromEntries(
    TRANSPORT_RUN_IDS.map((id) => [
      id,
      {
        ...state.liquidConduits[id],
        route: state.liquidConduits[id].route.map((cell) => ({ ...cell })),
        liquid: { ...state.liquidConduits[id].liquid },
        lastSpeciesFlow: { ...state.liquidConduits[id].lastSpeciesFlow },
      },
    ])
  ) as GameState["liquidConduits"],
});

const cloneCombatState = (
  state: GameState
): Pick<GameState, "enemies" | "stats" | "lastReport" | "events" | "incidents"> => ({
  enemies: state.enemies.map((enemy) => ({
    ...enemy,
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
    killsBySource: { ...state.stats.killsBySource },
  },
  lastReport: state.lastReport
    ? {
        ...state.lastReport,
        damageByChannel: cloneHazards(state.lastReport.damageByChannel),
        damageBySource: { ...state.lastReport.damageBySource },
        killsBySource: { ...state.lastReport.killsBySource },
      }
    : null,
  events: state.events.map((event) => ({ ...event, parameters: { ...event.parameters } })),
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

export const cloneGame = (
  state: GameState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): GameState => ({
  ...state,
  campaign: {
    ...state.campaign,
    completedLevelIds: [...state.campaign.completedLevelIds],
  },
  availability: {
    equipment: [...state.availability.equipment],
    gasRuns: [...state.availability.gasRuns],
    liquidRuns: [...state.availability.liquidRuns],
    gasSources: [...state.availability.gasSources],
    liquidSources: [...state.availability.liquidSources],
  },
  rooms: cloneRooms(state.rooms, definition),
  ...cloneMaterialState(state),
  ...cloneNetworkState(state, definition),
  portalStates: Object.fromEntries(
    Object.entries(state.portalStates).map(([portalId, portalState]) => [
      portalId,
      { ...portalState },
    ])
  ),
  processes: Object.fromEntries(
    PROCESS_IDS.map((id) => [
      id,
      {
        ...state.processes[id],
        limitingFactor: cloneLimitingFactor(state.processes[id].limitingFactor),
      },
    ])
  ) as GameState["processes"],
  ...cloneCombatState(state),
});

const dominantKey = <T extends string>(values: Record<T, number>, keys: readonly T[]): T =>
  keys.reduce((best, key) => (values[key] > values[best] ? key : best), keys[0] as T);

export const analyzeRoom = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
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
