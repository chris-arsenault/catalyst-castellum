import { emptyGas, emptyLiquid } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type GasAmounts,
  type LiquidAmounts,
  type RoomId,
} from "../types";
import { supplyAvailable, supplyDefinitionsFor } from "./campaign";
import { liquidFillRatio, mixedTemperature } from "./physics";
import {
  definitionGasJunction,
  definitionLiquidJunction,
  gasLineDefinition,
  liquidLineDefinition,
  processLineIds,
} from "../world/instances";
import { addGas, addLiquid, gasAmountTotal, liquidAmountTotal } from "./roomState";
import {
  gasConduitState,
  gasJunctionState,
  liquidConduitState,
  liquidJunctionState,
  roomState,
} from "../world/instances";

export const GAS_LOCAL_PORT_RATE = 2.8;
export const LIQUID_LOCAL_PORT_RATE = 2.4;
const STANDARD_SOURCE_TEMPERATURE = 22;

interface GasPool {
  contents: GasAmounts;
  temperature: number;
}

const equipmentGasOutputsInRoom = (state: GameState, roomId: RoomId): GasAmounts[] =>
  Object.values(roomState(state, roomId).equipment).flatMap((instance) =>
    instance
      ? Object.values(instance.operation?.outputs ?? {}).flatMap((output) =>
          output?.phase === "gas" ? [output.gas] : []
        )
      : []
  );

const equipmentLiquidOutputsInRoom = (state: GameState, roomId: RoomId): LiquidAmounts[] =>
  Object.values(roomState(state, roomId).equipment).flatMap((instance) =>
    instance
      ? Object.values(instance.operation?.outputs ?? {}).flatMap((output) =>
          output?.phase === "liquid" ? [output.liquid] : []
        )
      : []
  );

const gasJunctionDemanded = (state: GameState, roomId: RoomId): boolean =>
  processLineIds(state, "gas_line").some((runId) => {
    const definition = gasLineDefinition(state, runId);
    if (definition?.direction[0] !== roomId) return false;
    const conduit = gasConduitState(state, runId);
    return conduit.enabled;
  });

const liquidJunctionDemanded = (state: GameState, roomId: RoomId): boolean =>
  processLineIds(state, "liquid_line").some((runId) => {
    const definition = liquidLineDefinition(state, runId);
    if (definition?.direction[0] !== roomId) return false;
    const conduit = liquidConduitState(state, runId);
    return conduit.enabled;
  });

const gasPools = (state: GameState, roomId: RoomId, gameDefinition: GameDefinition): GasPool[] => {
  const definition = definitionGasJunction(gameDefinition, roomId);
  const pools: GasPool[] = [];
  for (const sourceId of definition.sourceIds) {
    if (!supplyAvailable(state, sourceId, gameDefinition)) continue;
    const source = state.gasSources[sourceId];
    if (!source) continue;
    pools.push({
      contents: source.gas,
      temperature: STANDARD_SOURCE_TEMPERATURE,
    });
  }
  for (const output of equipmentGasOutputsInRoom(state, roomId)) {
    pools.push({
      contents: output,
      temperature: roomState(state, roomId).temperature,
    });
  }
  if (definition.includeRoomInventory) {
    const zone = definition.roomPortHeight < 0.5 ? "lower" : "upper";
    pools.push({
      contents: roomState(state, roomId).gas[zone],
      temperature: roomState(state, roomId).gasTemperature[zone],
    });
  }
  return pools;
};

const liquidPools = (
  state: GameState,
  roomId: RoomId,
  gameDefinition: GameDefinition
): LiquidAmounts[] => {
  const definition = definitionLiquidJunction(gameDefinition, roomId);
  const pools: LiquidAmounts[] = [];
  for (const sourceId of definition.sourceIds) {
    if (supplyAvailable(state, sourceId, gameDefinition)) {
      const source = state.liquidSources[sourceId];
      if (source) pools.push(source.liquid);
    }
  }
  pools.push(...equipmentLiquidOutputsInRoom(state, roomId));
  if (
    definition.includeRoomInventory &&
    liquidFillRatio(roomState(state, roomId), gameDefinition) >= definition.roomPortHeight
  ) {
    pools.push(roomState(state, roomId).liquid);
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

/** Unlimited supplies restore their authored mixture as junctions draw from them. */
const replenishInfiniteGasSources = (state: GameState, gameDefinition: GameDefinition): void => {
  for (const supply of supplyDefinitionsFor(state, gameDefinition)) {
    if (
      supply.phase !== "gas" ||
      supply.replenishment.kind !== "unlimited" ||
      !supplyAvailable(state, supply.id, gameDefinition)
    )
      continue;
    const source = state.gasSources[supply.id];
    if (!source) continue;
    const current = gasAmountTotal(source.gas);
    const headroom = Math.max(0, supply.capacity - current);
    const ratedAmount = gasAmountTotal({
      ...emptyGas(),
      ...supply.replenishment.contents,
    });
    if (headroom <= 0 || ratedAmount <= 0) continue;
    for (const [species, amount] of Object.entries(supply.replenishment.contents)) {
      source.gas[species as keyof GasAmounts] += (amount ?? 0) * (headroom / ratedAmount);
    }
  }
};

const replenishInfiniteLiquidSources = (state: GameState, gameDefinition: GameDefinition): void => {
  for (const supply of supplyDefinitionsFor(state, gameDefinition)) {
    if (
      supply.phase !== "liquid" ||
      supply.replenishment.kind !== "unlimited" ||
      !supplyAvailable(state, supply.id, gameDefinition)
    )
      continue;
    const source = state.liquidSources[supply.id];
    if (!source) continue;
    const current = liquidAmountTotal(source.liquid);
    const headroom = Math.max(0, supply.capacity - current);
    const ratedAmount = liquidAmountTotal({
      ...emptyLiquid(),
      ...supply.replenishment.contents,
    });
    if (headroom <= 0 || ratedAmount <= 0) continue;
    for (const [species, amount] of Object.entries(supply.replenishment.contents)) {
      source.liquid[species as keyof LiquidAmounts] += (amount ?? 0) * (headroom / ratedAmount);
    }
  }
};

export const refillLocalJunctions = (
  state: GameState,
  dt: number,
  gameDefinition: GameDefinition
): void => {
  replenishInfiniteGasSources(state, gameDefinition);
  replenishInfiniteLiquidSources(state, gameDefinition);
  for (const roomId of state.world.rooms) {
    if (gasJunctionDemanded(state, roomId)) {
      const junction = gasJunctionState(state, roomId);
      const definition = definitionGasJunction(gameDefinition, roomId);
      const headroom = Math.max(0, definition.capacity - gasAmountTotal(junction.gas));
      const existing = gasAmountTotal(junction.gas);
      const moved = takeGasFromPools(
        gasPools(state, roomId, gameDefinition),
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
      const junction = liquidJunctionState(state, roomId);
      const definition = definitionLiquidJunction(gameDefinition, roomId);
      const headroom = Math.max(0, definition.capacity - liquidAmountTotal(junction.liquid));
      addLiquid(
        junction.liquid,
        takeLiquidFromPools(
          liquidPools(state, roomId, gameDefinition),
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
        contents: gasJunctionState(state, roomId).gas,
        temperature: gasJunctionState(state, roomId).temperature,
      },
    ],
    amount
  ).packet;

export const takeLiquidFromJunction = (
  state: GameState,
  roomId: RoomId,
  amount: number
): LiquidAmounts => takeLiquidFromPools([liquidJunctionState(state, roomId).liquid], amount);

export const junctionGasAvailable = (state: GameState, roomId: RoomId): number =>
  gasAmountTotal(gasJunctionState(state, roomId).gas);

export const junctionLiquidAvailable = (state: GameState, roomId: RoomId): number =>
  liquidAmountTotal(liquidJunctionState(state, roomId).liquid);

export const junctionGasTemperature = (state: GameState, roomId: RoomId): number =>
  gasJunctionState(state, roomId).temperature;
