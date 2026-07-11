import { DEVICE_CATALOG, GAS_NAMES, LIQUID_LABELS, ROOM_DEFINITIONS, ambientGas } from "../config";
import { GAS_TYPES, type DeviceKey, type GameState, type GasType, type RoomId } from "../types";
import { addEvent } from "./events";
import { clamp, round, sumRecord } from "./math";
import {
  drainLiquid,
  flushGas,
  gasTotal,
  injectGas,
  injectLiquid,
  injectMixture,
  liquidTotal,
} from "./roomState";

const gasChargeSize = (payload: GasType): number => {
  if (payload === "fuel_gas") return 32;
  if (payload === "co2") return 36;
  return 38;
};

const activateGasTank = (state: GameState, roomId: RoomId, deviceKey: DeviceKey): void => {
  const payload = DEVICE_CATALOG[deviceKey].gasPayload;
  if (!payload) return;
  const amount = gasChargeSize(payload);
  injectGas(state.rooms[roomId], payload, amount);
  addEvent(
    state,
    "info",
    `${GAS_NAMES[payload]} injected`,
    `${ROOM_DEFINITIONS[roomId].name} received a ${amount}-unit gas charge.`,
    roomId
  );
};

const activateLiquidTank = (state: GameState, roomId: RoomId, deviceKey: DeviceKey): void => {
  const payload = DEVICE_CATALOG[deviceKey].liquidPayload;
  if (!payload) return;
  const amount = payload === "water" ? 30 : 34;
  const room = state.rooms[roomId];
  injectLiquid(room, payload, amount);
  addEvent(
    state,
    "info",
    `${LIQUID_LABELS[payload]} released`,
    `${ROOM_DEFINITIONS[roomId].name} fill level rose to ${Math.round(liquidTotal(room))}%.`,
    roomId
  );
};

const activateVent = (state: GameState, roomId: RoomId): void => {
  flushGas(state.rooms[roomId]);
  addEvent(
    state,
    "good",
    "Atmosphere flushed",
    `${ROOM_DEFINITIONS[roomId].name} was pulled back toward breathable ambient air.`,
    roomId
  );
};

const activateDrain = (state: GameState, roomId: RoomId): void => {
  const room = state.rooms[roomId];
  const before = liquidTotal(room);
  drainLiquid(room);
  addEvent(
    state,
    "good",
    "Floor drain opened",
    `${Math.round(before - liquidTotal(room))}% of room volume was drained.`,
    roomId
  );
};

const activateDoor = (state: GameState, roomId: RoomId): void => {
  state.rooms[roomId].sealTimer = 10;
  addEvent(
    state,
    "warning",
    "Pressure door sealed",
    "Gas exchange stopped and occupants are slowed for 10 seconds.",
    roomId
  );
};

const ignitionFailure = (state: GameState, roomId: RoomId, co2Fraction: number): void => {
  const detail =
    co2Fraction >= 0.45
      ? `CO₂ at ${Math.round(co2Fraction * 100)}% suppressed the flame front.`
      : "The chamber lacked a viable fuel-and-oxygen mixture.";
  addEvent(state, "danger", "Ignition failed", detail, roomId);
};

const activateIgniter = (state: GameState, roomId: RoomId): void => {
  const room = state.rooms[roomId];
  const total = Math.max(gasTotal(room), 1);
  const co2Fraction = room.gas.co2 / total;
  const suppression = clamp(1 - co2Fraction * 1.7, 0, 1);
  const possible = Math.min(room.gas.fuel_gas, room.gas.oxygen / 1.12);
  const burned = possible * suppression;
  if (burned < 1.5) return ignitionFailure(state, roomId, co2Fraction);

  room.gas.fuel_gas -= burned;
  room.gas.oxygen -= burned * 1.12;
  room.gas.co2 += burned * 0.94;
  room.temperature = clamp(room.temperature + burned * 2.65, 22, 260);
  room.flashTimer = 1.35;
  room.flashIntensity = clamp(burned / 22, 0.4, 1.8);
  state.stats.reactions += 1;
  addEvent(
    state,
    "reaction",
    "Combustion front",
    `${round(burned, 1)} units burned; chamber temperature reached ${Math.round(room.temperature)}°C.`,
    roomId
  );
};

const activateBoiler = (state: GameState, roomId: RoomId): void => {
  const room = state.rooms[roomId];
  const water = Math.min(room.liquid.water, 20);
  if (water < 2) {
    addEvent(
      state,
      "danger",
      "Boiler ran dry",
      "At least 2% water fill is required to create a useful steam charge.",
      roomId
    );
    return;
  }
  room.liquid.water -= water;
  injectGas(room, "steam", water * 1.45);
  room.temperature = clamp(room.temperature + 24 + water * 1.2, 22, 190);
  state.stats.reactions += 1;
  addEvent(
    state,
    "reaction",
    "Flash boiler fired",
    `${round(water * 1.45, 1)} units of steam entered the chamber.`,
    roomId
  );
};

const activateFan = (state: GameState, roomId: RoomId): void => {
  const targetId = ROOM_DEFINITIONS[roomId].forward[0];
  if (!targetId) return;
  const room = state.rooms[roomId];
  const packet = ambientGas();
  for (const key of GAS_TYPES) {
    packet[key] = room.gas[key] * 0.28;
    room.gas[key] -= packet[key];
  }
  injectMixture(state.rooms[targetId], packet);
  addEvent(
    state,
    "info",
    "Atmosphere transferred",
    `${ROOM_DEFINITIONS[roomId].name} pushed ${Math.round(sumRecord(packet, GAS_TYPES))} units into ${ROOM_DEFINITIONS[targetId].name}.`,
    roomId
  );
};

export const activateInstalledDevice = (
  state: GameState,
  roomId: RoomId,
  deviceKey: DeviceKey
): void => {
  switch (DEVICE_CATALOG[deviceKey].kind) {
    case "gas_tank":
      return activateGasTank(state, roomId, deviceKey);
    case "liquid_tank":
      return activateLiquidTank(state, roomId, deviceKey);
    case "vent":
      return activateVent(state, roomId);
    case "drain":
      return activateDrain(state, roomId);
    case "door":
      return activateDoor(state, roomId);
    case "igniter":
      return activateIgniter(state, roomId);
    case "boiler":
      return activateBoiler(state, roomId);
    case "fan":
      return activateFan(state, roomId);
  }
};
