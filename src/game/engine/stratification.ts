import { ROOM_ORDER } from "../config";
import type { GameState, GasZone, RoomState } from "../types";
import { clamp } from "./math";
import { gasAmountTotal, gasZoneTotal, kelvin, mixedTemperature, roomZoneDensity } from "./physics";
import { addGas, takeGas } from "./roomState";
import { roomGasMixingRate } from "./equipment";

const PRESSURE_EQUALIZATION_RATE = 5;
const MOLECULAR_DIFFUSION_RATE = 0.025;
const BUOYANT_OVERTURN_RATE = 2.6;
const WALL_HEAT_EXCHANGE_RATE = 0.035;

const oppositeZone = (zone: GasZone): GasZone => (zone === "lower" ? "upper" : "lower");

const transferZoneGas = (room: RoomState, from: GasZone, amount: number): void => {
  if (amount <= 0) return;
  const to = oppositeZone(from);
  const sourceTemperature = room.gasTemperature[from];
  const targetAmount = gasZoneTotal(room, to);
  const packet = takeGas(room.gas[from], amount);
  addGas(room.gas[to], packet);
  room.gasTemperature[to] = mixedTemperature(
    room.gasTemperature[to],
    targetAmount,
    sourceTemperature,
    gasAmountTotal(packet)
  );
};

const equalizeZonePressure = (room: RoomState, dt: number): void => {
  const lower = gasZoneTotal(room, "lower");
  const upper = gasZoneTotal(room, "upper");
  const total = lower + upper;
  if (total <= 0) return;
  const inverseLowerTemperature = 1 / kelvin(room.gasTemperature.lower);
  const inverseUpperTemperature = 1 / kelvin(room.gasTemperature.upper);
  const targetLower =
    total * (inverseLowerTemperature / (inverseLowerTemperature + inverseUpperTemperature));
  const correction = (lower - targetLower) * clamp(PRESSURE_EQUALIZATION_RATE * dt, 0, 1);
  if (correction > 0) transferZoneGas(room, "lower", correction);
  else transferZoneGas(room, "upper", -correction);
};

const swapPackets = (room: RoomState, amount: number): void => {
  if (amount <= 0) return;
  const lowerTemperature = room.gasTemperature.lower;
  const upperTemperature = room.gasTemperature.upper;
  const lowerBefore = gasZoneTotal(room, "lower");
  const upperBefore = gasZoneTotal(room, "upper");
  const lowerPacket = takeGas(room.gas.lower, amount);
  const upperPacket = takeGas(room.gas.upper, amount);
  const lowerPacketAmount = gasAmountTotal(lowerPacket);
  const upperPacketAmount = gasAmountTotal(upperPacket);
  addGas(room.gas.lower, upperPacket);
  addGas(room.gas.upper, lowerPacket);
  room.gasTemperature.lower = mixedTemperature(
    lowerTemperature,
    Math.max(0, lowerBefore - lowerPacketAmount),
    upperTemperature,
    upperPacketAmount
  );
  room.gasTemperature.upper = mixedTemperature(
    upperTemperature,
    Math.max(0, upperBefore - upperPacketAmount),
    lowerTemperature,
    lowerPacketAmount
  );
};

const diffuseZones = (room: RoomState, dt: number): void => {
  const amount =
    Math.min(gasZoneTotal(room, "lower"), gasZoneTotal(room, "upper")) *
    clamp((MOLECULAR_DIFFUSION_RATE + roomGasMixingRate(room)) * dt, 0, 0.2);
  swapPackets(room, amount);
};

const overturnUnstableGas = (room: RoomState, dt: number): void => {
  const instability = roomZoneDensity(room, "upper") - roomZoneDensity(room, "lower");
  if (instability <= 0.0002) return;
  // Plumes carry a little momentum through neutral density, leaving the
  // displaced heavy mixture below instead of stopping just short of parity.
  const exchangeFraction = clamp((instability * BUOYANT_OVERTURN_RATE + 0.04) * dt, 0, 0.35);
  const amount =
    Math.min(gasZoneTotal(room, "lower"), gasZoneTotal(room, "upper")) * exchangeFraction;
  swapPackets(room, amount);
};

const exchangeWallHeat = (room: RoomState, dt: number): void => {
  for (const zone of ["lower", "upper"] as const) {
    room.gasTemperature[zone] +=
      (room.temperature - room.gasTemperature[zone]) * clamp(WALL_HEAT_EXCHANGE_RATE * dt, 0, 1);
  }
};

export const simulateRoomStratification = (room: RoomState, dt: number): void => {
  equalizeZonePressure(room, dt);
  overturnUnstableGas(room, dt);
  diffuseZones(room, dt);
  exchangeWallHeat(room, dt);
};

export const simulateStratification = (state: GameState, dt: number): void => {
  for (const roomId of ROOM_ORDER) simulateRoomStratification(state.rooms[roomId], dt);
};
