import {
  DEVICE_CATALOG,
  GAS_LABELS,
  GAS_NAMES,
  LIQUID_LABELS,
  MAX_ENERGY,
  ROOM_DEFINITIONS,
  WAVES,
} from "../config";
import type {
  CommandResult,
  DeviceKey,
  DevicePreview,
  GameCommand,
  GameState,
  RoomId,
} from "../types";
import { activateInstalledDevice } from "./deviceEffects";
import { addEvent, makeStats } from "./events";
import { round } from "./math";
import { analyzeRoom, cloneGame, gasPercent, liquidTotal, roomPressure } from "./roomState";

export const cooldownKey = (roomId: RoomId, device: DeviceKey): string => `${roomId}:${device}`;

const reject = (state: GameState, reason: string): CommandResult => ({
  state,
  accepted: false,
  reason,
});

const togglePause = (source: GameState): CommandResult => {
  const staticPhase = ["build", "victory", "defeat"].includes(source.phase);
  if (staticPhase) return reject(source, "There is no live simulation to pause.");
  const state = cloneGame(source);
  state.paused = !state.paused;
  return { state, accepted: true };
};

const setSpeed = (source: GameState, speed: 1 | 2): CommandResult => {
  const state = cloneGame(source);
  state.speed = speed;
  return { state, accepted: true };
};

const startPrime = (source: GameState): CommandResult => {
  if (source.phase !== "build") {
    return reject(source, "Priming can only begin from the build phase.");
  }
  const state = cloneGame(source);
  Object.assign(state, {
    phase: "prime",
    phaseTime: 0,
    energy: MAX_ENERGY,
    paused: false,
    stats: makeStats(),
    spawnCursor: 0,
    enemies: [],
    cooldowns: {},
  });
  addEvent(
    state,
    "info",
    `Cycle ${state.cycle} priming`,
    "The simulation is live. Fill, flush, heat, and seal chambers before opening the intake."
  );
  return { state, accepted: true };
};

const startAssault = (source: GameState): CommandResult => {
  if (source.phase !== "prime") return reject(source, "The base must be primed before assault.");
  const state = cloneGame(source);
  Object.assign(state, {
    phase: "assault",
    phaseTime: 0,
    spawnCursor: 0,
    enemies: [],
    paused: false,
  });
  addEvent(
    state,
    "warning",
    `Intakes opened — cycle ${state.cycle}`,
    `${WAVES[state.cycle]?.length ?? 0} hostiles detected on approach.`
  );
  return { state, accepted: true };
};

const installDevice = (source: GameState, roomId: RoomId, deviceKey: DeviceKey): CommandResult => {
  if (source.phase !== "build")
    return reject(source, "Modules can only be installed during build.");
  const room = source.rooms[roomId];
  const definition = ROOM_DEFINITIONS[roomId];
  const device = DEVICE_CATALOG[deviceKey];
  if (definition.kind !== "chamber") return reject(source, "This room has no build sockets.");
  if (room.devices.includes(deviceKey)) return reject(source, "That module is already installed.");
  if (room.devices.length >= definition.slots)
    return reject(source, "All room sockets are occupied.");
  if (source.buildPoints < device.cost) return reject(source, "Not enough fabricator points.");

  const state = cloneGame(source);
  state.rooms[roomId].devices.push(deviceKey);
  state.buildPoints -= device.cost;
  addEvent(
    state,
    "good",
    `${device.name} installed`,
    `${definition.name} now has ${state.rooms[roomId].devices.length}/${definition.slots} sockets occupied.`,
    roomId
  );
  return { state, accepted: true };
};

const removeDevice = (source: GameState, roomId: RoomId, deviceKey: DeviceKey): CommandResult => {
  if (source.phase !== "build") return reject(source, "Modules can only be salvaged during build.");
  if (!source.rooms[roomId].devices.includes(deviceKey)) {
    return reject(source, "That module is not installed here.");
  }
  const state = cloneGame(source);
  state.rooms[roomId].devices = state.rooms[roomId].devices.filter(
    (device) => device !== deviceKey
  );
  state.buildPoints += DEVICE_CATALOG[deviceKey].cost;
  addEvent(
    state,
    "info",
    `${DEVICE_CATALOG[deviceKey].name} salvaged`,
    "Its full fabricator value was returned.",
    roomId
  );
  return { state, accepted: true };
};

const activateDevice = (source: GameState, roomId: RoomId, deviceKey: DeviceKey): CommandResult => {
  if (source.phase !== "prime" && source.phase !== "assault") {
    return reject(source, "Live controls are available during prime and assault.");
  }
  if (source.paused) return reject(source, "Resume the simulation before firing a device.");
  if (!source.rooms[roomId].devices.includes(deviceKey)) {
    return reject(source, "That device is not installed here.");
  }
  const device = DEVICE_CATALOG[deviceKey];
  const remaining = source.cooldowns[cooldownKey(roomId, deviceKey)] ?? 0;
  if (remaining > 0) return reject(source, `Device recharging for ${round(remaining, 1)}s.`);
  if (source.energy < device.energyCost) return reject(source, "Insufficient actuator pressure.");

  const state = cloneGame(source);
  state.energy = Math.max(0, state.energy - device.energyCost);
  state.cooldowns[cooldownKey(roomId, deviceKey)] = device.cooldown;
  activateInstalledDevice(state, roomId, deviceKey);
  return { state, accepted: true };
};

export const executeCommand = (source: GameState, command: GameCommand): CommandResult => {
  switch (command.type) {
    case "toggle_pause":
      return togglePause(source);
    case "set_speed":
      return setSpeed(source, command.speed);
    case "start_prime":
      return startPrime(source);
    case "start_assault":
      return startAssault(source);
    case "install_device":
      return installDevice(source, command.roomId, command.device);
    case "remove_device":
      return removeDevice(source, command.roomId, command.device);
    case "activate_device":
      return activateDevice(source, command.roomId, command.device);
  }
};

const percentString = (value: number): string => `${Math.round(value * 100)}%`;

const addPayloadChanges = (
  changes: string[],
  state: GameState,
  result: GameState,
  roomId: RoomId,
  deviceKey: DeviceKey
): void => {
  const device = DEVICE_CATALOG[deviceKey];
  const before = state.rooms[roomId];
  const after = result.rooms[roomId];
  if (device.gasPayload) {
    changes.push(
      `${GAS_LABELS[device.gasPayload]} ${percentString(gasPercent(before, device.gasPayload))} → ${percentString(gasPercent(after, device.gasPayload))}`
    );
  }
  if (device.liquidPayload) {
    changes.push(
      `${LIQUID_LABELS[device.liquidPayload]} ${Math.round(before.liquid[device.liquidPayload])}% → ${Math.round(after.liquid[device.liquidPayload])}% room volume`
    );
  }
};

const addRoomMetricChanges = (
  changes: string[],
  state: GameState,
  result: GameState,
  roomId: RoomId
): void => {
  const beforeRoom = state.rooms[roomId];
  const afterRoom = result.rooms[roomId];
  const before = analyzeRoom(beforeRoom);
  const after = analyzeRoom(afterRoom);
  if (Math.abs(after.liquidTotal - before.liquidTotal) >= 1) {
    changes.push(
      `Liquid fill ${Math.round(before.liquidTotal)}% → ${Math.round(after.liquidTotal)}%`
    );
  }
  if (Math.abs(after.pressure - before.pressure) >= 2) {
    changes.push(`Pressure ${Math.round(before.pressure)} → ${Math.round(after.pressure)} kPa`);
  }
  if (Math.abs(afterRoom.temperature - beforeRoom.temperature) >= 2) {
    changes.push(
      `Temperature ${Math.round(beforeRoom.temperature)} → ${Math.round(afterRoom.temperature)}°C`
    );
  }
  if (Math.abs(after.hazard - before.hazard) >= 1) {
    changes.push(`Hazard ${Math.round(before.hazard)} → ${Math.round(after.hazard)}`);
  }
  if (after.dominantGas !== before.dominantGas) {
    changes.push(`Dominant gas becomes ${GAS_NAMES[after.dominantGas]}`);
  }
};

const addFanTargetChange = (
  changes: string[],
  state: GameState,
  result: GameState,
  roomId: RoomId,
  deviceKey: DeviceKey
): void => {
  if (DEVICE_CATALOG[deviceKey].kind !== "fan") return;
  const targetId = ROOM_DEFINITIONS[roomId].forward[0];
  if (!targetId) return;
  const before = analyzeRoom(state.rooms[targetId]);
  const after = analyzeRoom(result.rooms[targetId]);
  changes.push(
    `${ROOM_DEFINITIONS[targetId].name} hazard ${Math.round(before.hazard)} → ${Math.round(after.hazard)}`
  );
};

export const previewDevice = (
  state: GameState,
  roomId: RoomId,
  deviceKey: DeviceKey
): DevicePreview => {
  const device = DEVICE_CATALOG[deviceKey];
  const result = executeCommand(state, { type: "activate_device", roomId, device: deviceKey });
  if (!result.accepted) {
    return {
      accepted: false,
      title: device.activeLabel,
      summary: result.reason ?? "Device unavailable.",
      changes: [],
    };
  }

  const changes: string[] = [];
  addPayloadChanges(changes, state, result.state, roomId, deviceKey);
  addRoomMetricChanges(changes, state, result.state, roomId);
  addFanTargetChange(changes, state, result.state, roomId, deviceKey);
  if (changes.length === 0) changes.push("No tactically meaningful state change predicted.");
  return {
    accepted: true,
    title: device.activeLabel,
    summary: `${device.energyCost} pressure · ${device.cooldown}s recharge`,
    changes,
  };
};

export const previewPressure = (state: GameState, roomId: RoomId): number =>
  roomPressure(state.rooms[roomId]);

export const previewLiquidFill = (state: GameState, roomId: RoomId): number =>
  liquidTotal(state.rooms[roomId]);
