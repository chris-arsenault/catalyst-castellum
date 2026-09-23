import type { ProcessEncounterState, ProcessPhysicsDefinition } from "../encounter/processTypes";
import type { CombatDefinition, EncounterTower } from "../encounter/types";
type TowerSupplyDefinition = ProcessPhysicsDefinition & Pick<CombatDefinition, "towers">;
import type { GasType, LiquidType, SpeciesId, TowerDefinition, TowerSupplyStatus } from "../types";
import {
  gasConduitState,
  gasLineDefinition,
  liquidConduitState,
  liquidLineDefinition,
  processLineIds,
  roomState,
} from "../world/instances";
import { towerRoomId } from "./towerPlacement";
import { effectiveTowerStats } from "./towerStats";

const SUPPLIED_DAMAGE_MULTIPLIER = 1.35;
const REDUCED_CADENCE_MULTIPLIER = 0.55;

const localAmount = (
  state: ProcessEncounterState,
  tower: EncounterTower,
  speciesId: SpeciesId,
  definition: TowerSupplyDefinition
): number => {
  const phase = definition.species[speciesId].phase;
  const resources = state.process.towerResources[tower.id];
  if (phase === "gas") return resources?.gas[speciesId as GasType] ?? 0;
  if (phase === "liquid") return resources?.liquid[speciesId as LiquidType] ?? 0;
  return 0;
};

const changeLocalAmount = (
  state: ProcessEncounterState,
  tower: EncounterTower,
  speciesId: SpeciesId,
  delta: number,
  definition: TowerSupplyDefinition
): void => {
  const phase = definition.species[speciesId].phase;
  const resources = (state.process.towerResources[tower.id] ??= { gas: {}, liquid: {} });
  if (phase === "gas") {
    const typed = speciesId as GasType;
    resources.gas[typed] = Math.max(0, (resources.gas[typed] ?? 0) + delta);
  } else if (phase === "liquid") {
    const typed = speciesId as LiquidType;
    resources.liquid[typed] = Math.max(0, (resources.liquid[typed] ?? 0) + delta);
  }
};

const incomingGasLines = (state: ProcessEncounterState, roomId: string) =>
  processLineIds(state, "gas_line").flatMap((connectionId) => {
    const line = gasLineDefinition(state, connectionId);
    const conduit = gasConduitState(state, connectionId);
    return line?.direction[1] === roomId && conduit.enabled ? [{ connectionId, conduit }] : [];
  });

const incomingLiquidLines = (state: ProcessEncounterState, roomId: string) =>
  processLineIds(state, "liquid_line").flatMap((connectionId) => {
    const line = liquidLineDefinition(state, connectionId);
    const conduit = liquidConduitState(state, connectionId);
    return line?.direction[1] === roomId && conduit.enabled ? [{ connectionId, conduit }] : [];
  });

const deliveredRates = (
  state: ProcessEncounterState,
  roomId: string,
  towerDefinition: TowerDefinition
): { connectionIds: string[]; rates: Map<SpeciesId, number> } => {
  const rates = new Map<SpeciesId, number>();
  const accepted = new Set(towerDefinition.supply?.acceptedSpecies ?? []);
  const lines =
    towerDefinition.supply?.port === "gas"
      ? incomingGasLines(state, roomId).filter(({ conduit }) => conduit.flowCause === "fan")
      : incomingLiquidLines(state, roomId).filter(({ conduit }) => conduit.flowCause === "pump");
  for (const { conduit } of lines) {
    for (const speciesId of accepted) {
      const rate = conduit.lastSpeciesFlow[speciesId as never] ?? 0;
      rates.set(speciesId, (rates.get(speciesId) ?? 0) + Math.max(0, rate));
    }
  }
  return { connectionIds: lines.map(({ connectionId }) => connectionId), rates };
};

const shotDemand = (
  tower: EncounterTower,
  towerDefinition: TowerDefinition,
  definition: TowerSupplyDefinition
): number => {
  const cadence = effectiveTowerStats(tower, definition).cadence;
  return towerDefinition.supply ? towerDefinition.supply.rate / Math.max(0.001, cadence) : 0;
};

const supplyMode = (
  requirement: NonNullable<TowerDefinition["supply"]>,
  assisted: boolean
): TowerSupplyStatus["mode"] => {
  if (assisted) return "assisted";
  if (requirement.insufficientFlow === "direct_mode") return "direct";
  if (requirement.insufficientFlow === "reduced_cadence") return "reduced";
  return "paused";
};

const supplyModifier = (mode: TowerSupplyStatus["mode"]): number => {
  if (mode === "assisted") return SUPPLIED_DAMAGE_MULTIPLIER;
  if (mode === "reduced") return REDUCED_CADENCE_MULTIPLIER;
  if (mode === "paused") return 0;
  return 1;
};

export const towerSupplyQuery = (
  state: ProcessEncounterState,
  tower: EncounterTower,
  definition: TowerSupplyDefinition
): TowerSupplyStatus | null => {
  const towerDefinition = definition.towers[tower.chassisId];
  if (!towerDefinition) throw new Error(`Unknown tower chassis: ${tower.chassisId}`);
  const requirement = towerDefinition.supply;
  const destinationRoomId = towerRoomId(state, tower);
  if (!requirement || !destinationRoomId) return null;
  const delivered = deliveredRates(state, destinationRoomId, towerDefinition);
  const availableRate = [...delivered.rates.values()].reduce((total, rate) => total + rate, 0);
  const storedAmount = requirement.acceptedSpecies.reduce(
    (total, speciesId) => total + localAmount(state, tower, speciesId, definition),
    0
  );
  const demand = shotDemand(tower, towerDefinition, definition);
  const assisted = storedAmount + 0.0001 >= demand;
  const mode = supplyMode(requirement, assisted);
  const limitingSpecies = requirement.acceptedSpecies.reduce<SpeciesId | null>(
    (limiting, speciesId) => {
      if (!limiting) return speciesId;
      return (delivered.rates.get(speciesId) ?? 0) < (delivered.rates.get(limiting) ?? 0)
        ? speciesId
        : limiting;
    },
    null
  );
  return {
    towerId: tower.id,
    destinationRoomId,
    connectionIds: delivered.connectionIds,
    availableRate,
    demandedRate: requirement.rate,
    storedAmount,
    capacity: requirement.localCapacity,
    limitingSpecies,
    mode,
    modifier: supplyModifier(mode),
  };
};

const roomSpeciesAmount = (
  state: ProcessEncounterState,
  roomId: string,
  speciesId: SpeciesId,
  definition: TowerSupplyDefinition
): number => {
  const room = roomState(state, roomId);
  const phase = definition.species[speciesId].phase;
  if (phase === "gas") {
    const gas = speciesId as GasType;
    return room.gas.lower[gas] + room.gas.upper[gas];
  }
  return phase === "liquid" ? room.liquid[speciesId as LiquidType] : 0;
};

const takeRoomSpecies = (
  state: ProcessEncounterState,
  roomId: string,
  speciesId: SpeciesId,
  requested: number,
  definition: TowerSupplyDefinition
): number => {
  const room = roomState(state, roomId);
  const available = roomSpeciesAmount(state, roomId, speciesId, definition);
  const moved = Math.min(available, requested);
  if (moved <= 0) return 0;
  const phase = definition.species[speciesId].phase;
  if (phase === "liquid") {
    room.liquid[speciesId as LiquidType] -= moved;
    return moved;
  }
  if (phase !== "gas") return 0;
  const gas = speciesId as GasType;
  const lowerShare = available > 0 ? room.gas.lower[gas] / available : 0;
  room.gas.lower[gas] = Math.max(0, room.gas.lower[gas] - moved * lowerShare);
  room.gas.upper[gas] = Math.max(0, room.gas.upper[gas] - moved * (1 - lowerShare));
  return moved;
};

export const serviceTowerSupplies = (
  state: ProcessEncounterState,
  dt: number,
  definition: TowerSupplyDefinition
): void => {
  const towers = Object.values(state.towers).sort((left, right) => left.id.localeCompare(right.id));
  const remainingDelivered = new Map<string, number>();
  for (const tower of towers) {
    const towerDefinition = definition.towers[tower.chassisId];
    if (!towerDefinition) throw new Error(`Unknown tower chassis: ${tower.chassisId}`);
    const requirement = towerDefinition.supply;
    const before = towerSupplyQuery(state, tower, definition);
    if (!requirement || !before) {
      delete state.process.towerSupply[tower.id];
      continue;
    }
    let remaining = Math.min(
      requirement.rate * dt,
      Math.max(0, requirement.localCapacity - before.storedAmount)
    );
    const delivered = deliveredRates(state, before.destinationRoomId, towerDefinition);
    for (const speciesId of requirement.acceptedSpecies) {
      if (remaining <= 0) break;
      const allocationKey = `${requirement.port}:${before.destinationRoomId}:${speciesId}`;
      const available =
        remainingDelivered.get(allocationKey) ?? (delivered.rates.get(speciesId) ?? 0) * dt;
      const moved = takeRoomSpecies(
        state,
        before.destinationRoomId,
        speciesId,
        Math.min(remaining, available),
        definition
      );
      changeLocalAmount(state, tower, speciesId, moved, definition);
      remaining -= moved;
      remainingDelivered.set(allocationKey, Math.max(0, available - moved));
    }
    const after = towerSupplyQuery(state, tower, definition);
    if (after) state.process.towerSupply[tower.id] = after;
  }
};

export interface TowerSupplyUse {
  mode: TowerSupplyStatus["mode"];
  damageMultiplier: number;
  cadenceMultiplier: number;
  consumed: Partial<Record<SpeciesId, number>>;
}

export const consumeTowerSupplyForShot = (
  state: ProcessEncounterState,
  tower: EncounterTower,
  definition: TowerSupplyDefinition
): TowerSupplyUse => {
  const towerDefinition = definition.towers[tower.chassisId];
  if (!towerDefinition) throw new Error(`Unknown tower chassis: ${tower.chassisId}`);
  const requirement = towerDefinition.supply;
  const status = towerSupplyQuery(state, tower, definition);
  if (!requirement || !status)
    return { mode: "direct", damageMultiplier: 1, cadenceMultiplier: 1, consumed: {} };
  if (status.mode !== "assisted") {
    state.process.towerSupply[tower.id] = status;
    return {
      mode: status.mode,
      damageMultiplier: 1,
      cadenceMultiplier: status.mode === "reduced" ? REDUCED_CADENCE_MULTIPLIER : 1,
      consumed: {},
    };
  }
  let remaining = shotDemand(tower, towerDefinition, definition);
  const consumed: Partial<Record<SpeciesId, number>> = {};
  for (const speciesId of requirement.acceptedSpecies) {
    const moved = Math.min(remaining, localAmount(state, tower, speciesId, definition));
    if (moved <= 0) continue;
    changeLocalAmount(state, tower, speciesId, -moved, definition);
    consumed[speciesId] = moved;
    remaining -= moved;
  }
  const after = towerSupplyQuery(state, tower, definition);
  if (after) state.process.towerSupply[tower.id] = after;
  return {
    mode: "assisted",
    damageMultiplier: SUPPLIED_DAMAGE_MULTIPLIER,
    cadenceMultiplier: 1,
    consumed,
  };
};

export const releaseTowerByproducts = (
  state: ProcessEncounterState,
  tower: EncounterTower,
  consumed: Partial<Record<SpeciesId, number>>,
  definition: TowerSupplyDefinition
): number => {
  const roomId = towerRoomId(state, tower);
  if (!roomId) return 0;
  const room = roomState(state, roomId);
  let reactedHydrogen = 0;
  for (const [speciesId, amountValue] of Object.entries(consumed)) {
    const amount = amountValue ?? 0;
    if (amount <= 0) continue;
    if (speciesId === "hydrogen") {
      reactedHydrogen = Math.min(
        amount,
        roomSpeciesAmount(state, roomId, "oxygen", definition) * 2
      );
      takeRoomSpecies(state, roomId, "oxygen", reactedHydrogen / 2, definition);
      room.gas.upper.steam += reactedHydrogen;
      room.gas.upper.hydrogen += amount - reactedHydrogen;
      continue;
    }
    const phase = definition.species[speciesId as SpeciesId].phase;
    if (phase === "gas") room.gas.upper[speciesId as GasType] += amount;
    else if (phase === "liquid") room.liquid[speciesId as LiquidType] += amount;
  }
  return reactedHydrogen;
};
