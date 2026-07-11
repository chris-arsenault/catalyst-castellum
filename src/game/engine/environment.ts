import { AMBIENT_TEMPERATURE, CONNECTIONS, ROOM_ORDER, ambientGas } from "../config";
import { GAS_TYPES, LIQUID_TYPES, type GameState, type GasAmounts, type RoomState } from "../types";
import { clamp } from "./math";
import { analyzeRoom, gasCapacity, gasTotal, injectGas, liquidTotal } from "./roomState";

const emptyGasDeltas = (): Record<(typeof ROOM_ORDER)[number], GasAmounts> => {
  const deltas = Object.fromEntries(ROOM_ORDER.map((id) => [id, ambientGas()])) as Record<
    (typeof ROOM_ORDER)[number],
    GasAmounts
  >;
  for (const id of ROOM_ORDER) for (const gas of GAS_TYPES) deltas[id][gas] = 0;
  return deltas;
};

export const simulateFlow = (state: GameState, dt: number): void => {
  const rate = 0.045 * dt * (state.phase === "settle" ? 3.2 : 1);
  const gasDelta = emptyGasDeltas();
  for (const connection of CONNECTIONS) {
    const from = state.rooms[connection.from];
    const to = state.rooms[connection.to];
    if (from.sealTimer > 0 || to.sealTimer > 0) continue;
    for (const gas of GAS_TYPES) {
      const transfer = (from.gas[gas] - to.gas[gas]) * rate;
      gasDelta[connection.from][gas] -= transfer;
      gasDelta[connection.to][gas] += transfer;
    }
    const heatTransfer = (from.temperature - to.temperature) * rate * 0.35;
    from.temperature -= heatTransfer;
    to.temperature += heatTransfer;
  }
  for (const id of ROOM_ORDER) {
    for (const gas of GAS_TYPES) {
      state.rooms[id].gas[gas] = Math.max(0, state.rooms[id].gas[gas] + gasDelta[id][gas]);
    }
  }
};

const neutralizeLiquids = (state: GameState, room: RoomState, dt: number): void => {
  const neutralized = Math.min(room.liquid.acid, room.liquid.caustic, 11 * dt);
  if (neutralized <= 0) return;
  room.liquid.acid -= neutralized;
  room.liquid.caustic -= neutralized;
  room.liquid.neutral_liquid += neutralized * 1.85;
  room.temperature = clamp(room.temperature + neutralized * 1.25, AMBIENT_TEMPERATURE, 220);
  state.stats.reactions += neutralized * 0.08;
};

const condenseSteam = (room: RoomState, dt: number): void => {
  if (room.temperature >= 45 || room.gas.steam <= 0.1) return;
  const condensationRate = room.gas.steam * 0.018 + (45 - room.temperature) * 0.01;
  const condensed = Math.min(room.gas.steam, condensationRate * dt);
  room.gas.steam -= condensed;
  room.liquid.water = Math.min(88, room.liquid.water + condensed * 0.72);
};

const vaporizeWater = (room: RoomState, dt: number): void => {
  if (room.temperature <= 100 || room.liquid.water <= 0.1) return;
  const vaporized = Math.min(room.liquid.water, (room.temperature - 95) * 0.018 * dt);
  room.liquid.water -= vaporized;
  injectGas(room, "steam", vaporized * 1.3);
  room.temperature -= vaporized * 0.55;
};

const consumeToxicResidue = (room: RoomState, dt: number): void => {
  if (room.residue <= 0.1 || room.gas.toxic_gas <= 0.1) return;
  const consumed = Math.min(room.gas.toxic_gas, room.residue * 0.045 * dt);
  room.gas.toxic_gas -= consumed;
  room.residue = Math.max(0, room.residue - consumed * 0.28);
};

const settleDrain = (state: GameState, room: RoomState, dt: number): void => {
  const total = liquidTotal(room);
  if (state.phase !== "settle" || !room.devices.includes("drain") || total <= 0) return;
  const removed = Math.min(total, 4.2 * dt);
  for (const liquid of LIQUID_TYPES) room.liquid[liquid] *= (total - removed) / total;
  room.residue = Math.max(0, room.residue - 0.25 * dt);
};

const releaseOverpressure = (room: RoomState): void => {
  if (room.sealTimer > 0 || gasTotal(room) <= gasCapacity(room) * 1.08) return;
  const scale = (gasCapacity(room) * 1.08) / gasTotal(room);
  for (const gas of GAS_TYPES) room.gas[gas] *= scale;
};

const simulateRoomReactions = (state: GameState, room: RoomState, dt: number): void => {
  room.sealTimer = Math.max(0, room.sealTimer - dt);
  room.flashTimer = Math.max(0, room.flashTimer - dt);
  if (room.flashTimer <= 0) room.flashIntensity = Math.max(0, room.flashIntensity - dt * 2);
  neutralizeLiquids(state, room, dt);
  condenseSteam(room, dt);
  vaporizeWater(room, dt);
  consumeToxicResidue(room, dt);
  settleDrain(state, room, dt);
  const coolingRate = state.phase === "settle" ? 0.04 : 0.016;
  room.temperature += (AMBIENT_TEMPERATURE - room.temperature) * coolingRate * dt;
  releaseOverpressure(room);
  state.stats.peakHazard = Math.max(state.stats.peakHazard, analyzeRoom(room).hazard);
};

export const simulateReactions = (state: GameState, dt: number): void => {
  for (const id of ROOM_ORDER) simulateRoomReactions(state, state.rooms[id], dt);
};
