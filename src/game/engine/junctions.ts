import {
  GAS_BUFFERS,
  GAS_JUNCTIONS,
  GAS_SOURCES,
  LIQUID_JUNCTIONS,
  LIQUID_SOURCES,
  TRANSPORT_RUNS,
  emptyGas,
  emptyLiquid,
} from "../config";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  TRANSPORT_RUN_IDS,
  type GameState,
  type GasAmounts,
  type LiquidAmounts,
  type RoomId,
  type TransportPhase,
} from "../types";
import { liquidFillRatio, mixedTemperature } from "./physics";
import { addGas, addLiquid, gasAmountTotal, liquidAmountTotal } from "./roomState";

const GAS_LOCAL_PORT_RATE = 2.8;
const LIQUID_LOCAL_PORT_RATE = 2.4;
const STANDARD_SOURCE_TEMPERATURE = 22;

interface GasPool {
  contents: GasAmounts;
  temperature: number;
}

const gasJunctionDemanded = (state: GameState, roomId: RoomId): boolean =>
  TRANSPORT_RUN_IDS.some((runId) => {
    const definition = TRANSPORT_RUNS[runId].gas;
    const conduit = state.gasConduits[runId];
    return definition?.direction[0] === roomId && conduit.installed && conduit.enabled;
  });

const liquidJunctionDemanded = (state: GameState, roomId: RoomId): boolean =>
  TRANSPORT_RUN_IDS.some((runId) => {
    const definition = TRANSPORT_RUNS[runId].liquid;
    const conduit = state.liquidConduits[runId];
    return definition?.direction[0] === roomId && conduit.installed && conduit.enabled;
  });

const gasPools = (state: GameState, roomId: RoomId): GasPool[] => {
  const definition = GAS_JUNCTIONS[roomId];
  const pools: GasPool[] = [];
  for (const sourceId of definition.sourceIds) {
    if (!state.availability.gasSources.includes(sourceId)) continue;
    pools.push({
      contents: state.gasSources[sourceId].gas,
      temperature: STANDARD_SOURCE_TEMPERATURE,
    });
  }
  for (const bufferId of definition.bufferIds) {
    pools.push({
      contents: state.gasBuffers[bufferId].gas,
      temperature: state.rooms[GAS_BUFFERS[bufferId].hostRoomId].temperature,
    });
  }
  if (definition.includeRoomInventory) {
    const zone = definition.roomPortHeight < 0.5 ? "lower" : "upper";
    pools.push({
      contents: state.rooms[roomId].gas[zone],
      temperature: state.rooms[roomId].gasTemperature[zone],
    });
  }
  return pools;
};

const liquidPools = (state: GameState, roomId: RoomId): LiquidAmounts[] => {
  const definition = LIQUID_JUNCTIONS[roomId];
  const pools: LiquidAmounts[] = [];
  for (const sourceId of definition.sourceIds) {
    if (state.availability.liquidSources.includes(sourceId)) {
      pools.push(state.liquidSources[sourceId].liquid);
    }
  }
  for (const bufferId of definition.bufferIds) pools.push(state.liquidBuffers[bufferId].liquid);
  if (
    definition.includeRoomInventory &&
    liquidFillRatio(state.rooms[roomId]) >= definition.roomPortHeight
  ) {
    pools.push(state.rooms[roomId].liquid);
  }
  return pools;
};

const combinedGas = (pools: readonly GasPool[]): GasAmounts => {
  const combined = emptyGas();
  for (const pool of pools) addGas(combined, pool.contents);
  return combined;
};

const combinedLiquid = (pools: readonly LiquidAmounts[]): LiquidAmounts => {
  const combined = emptyLiquid();
  for (const pool of pools) addLiquid(combined, pool);
  return combined;
};

const takeGasFromPools = (
  pools: readonly GasPool[],
  requested: number
): { packet: GasAmounts; temperature: number } => {
  const combined = combinedGas(pools);
  const total = gasAmountTotal(combined);
  const amount = Math.min(requested, total);
  const packet = emptyGas();
  if (amount <= 0) return { packet, temperature: STANDARD_SOURCE_TEMPERATURE };
  let temperature = 0;
  for (const pool of pools) {
    const share = gasAmountTotal(pool.contents) / total;
    temperature += pool.temperature * share;
  }
  for (const species of GAS_TYPES) {
    const speciesMoved = amount * (combined[species] / total);
    packet[species] = speciesMoved;
    if (speciesMoved <= 0) continue;
    for (const pool of pools) {
      const poolShare = combined[species] > 0 ? pool.contents[species] / combined[species] : 0;
      pool.contents[species] = Math.max(0, pool.contents[species] - speciesMoved * poolShare);
    }
  }
  return { packet, temperature };
};

const takeLiquidFromPools = (pools: readonly LiquidAmounts[], requested: number): LiquidAmounts => {
  const combined = combinedLiquid(pools);
  const total = liquidAmountTotal(combined);
  const amount = Math.min(requested, total);
  const packet = emptyLiquid();
  if (amount <= 0) return packet;
  for (const species of LIQUID_TYPES) {
    const speciesMoved = amount * (combined[species] / total);
    packet[species] = speciesMoved;
    if (speciesMoved <= 0) continue;
    for (const pool of pools) {
      const poolShare = combined[species] > 0 ? pool[species] / combined[species] : 0;
      pool[species] = Math.max(0, pool[species] - speciesMoved * poolShare);
    }
  }
  return packet;
};

export const refillLocalJunctions = (state: GameState, dt: number): void => {
  for (const roomId of Object.keys(state.rooms) as RoomId[]) {
    if (gasJunctionDemanded(state, roomId)) {
      const junction = state.gasJunctions[roomId];
      const definition = GAS_JUNCTIONS[roomId];
      const headroom = Math.max(0, definition.capacity - gasAmountTotal(junction.gas));
      const existing = gasAmountTotal(junction.gas);
      const moved = takeGasFromPools(
        gasPools(state, roomId),
        Math.min(headroom, GAS_LOCAL_PORT_RATE * dt)
      );
      addGas(junction.gas, moved.packet);
      junction.temperature = mixedTemperature(
        junction.temperature,
        existing,
        moved.temperature,
        gasAmountTotal(moved.packet)
      );
    }
    if (liquidJunctionDemanded(state, roomId)) {
      const junction = state.liquidJunctions[roomId];
      const definition = LIQUID_JUNCTIONS[roomId];
      const headroom = Math.max(0, definition.capacity - liquidAmountTotal(junction.liquid));
      addLiquid(
        junction.liquid,
        takeLiquidFromPools(
          liquidPools(state, roomId),
          Math.min(headroom, LIQUID_LOCAL_PORT_RATE * dt)
        )
      );
    }
  }
};

export const takeGasFromJunction = (state: GameState, roomId: RoomId, amount: number): GasAmounts =>
  takeGasFromPools(
    [
      {
        contents: state.gasJunctions[roomId].gas,
        temperature: state.gasJunctions[roomId].temperature,
      },
    ],
    amount
  ).packet;

export const takeLiquidFromJunction = (
  state: GameState,
  roomId: RoomId,
  amount: number
): LiquidAmounts => takeLiquidFromPools([state.liquidJunctions[roomId].liquid], amount);

export const junctionGasAvailable = (state: GameState, roomId: RoomId): number =>
  gasAmountTotal(state.gasJunctions[roomId].gas);

export const junctionLiquidAvailable = (state: GameState, roomId: RoomId): number =>
  liquidAmountTotal(state.liquidJunctions[roomId].liquid);

export const junctionGasTemperature = (state: GameState, roomId: RoomId): number =>
  state.gasJunctions[roomId].temperature;

export const sourceDefinitionFor = (phase: TransportPhase) =>
  phase === "gas" ? GAS_SOURCES : LIQUID_SOURCES;
