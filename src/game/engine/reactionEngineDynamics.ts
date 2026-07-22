import type { GameDefinition } from "../definitionTypes";
import { GAS_TYPES, LIQUID_TYPES, type ConnectionId, type GameState, type RoomId } from "../types";
import { gasAmountTotal, liquidAmountTotal, roomUsableVolume } from "./physics";
import { analyzeRoom } from "./roomState";
import { clamp } from "./math";
import { conduitCapacity } from "./networkGeometry";
import {
  definitionRoom,
  gasConduitState,
  liquidConduitState,
  processLineIds,
  roomState,
} from "../world/instances";
import { definitionForMap } from "../world/activeDefinition";

const ROOM_STABLE_RATE = 0.004;
const ROOM_DIRECTION_RATE = 0.001;
const MODERATE_CHANGE_RATE = 0.004;
const HIGH_CHANGE_RATE = 0.015;
const HOMEOSTASIS_DECAY = 35;

export type ReactionEngineChange = "low" | "moderate" | "high";

export interface ReactionEngineRoomSample {
  roomId: RoomId;
  active: boolean;
  gas: readonly number[];
  liquid: readonly number[];
  temperatures: readonly number[];
  inventory: number;
  capacity: number;
  hazard: number;
  reactionRate: number;
}

export interface ReactionEngineLineSample {
  connectionId: ConnectionId;
  enabled: boolean;
  fillRatio: number;
}

export interface ReactionEngineSample {
  elapsed: number;
  levelId: GameState["campaign"]["levelId"];
  roundIndex: number;
  phase: GameState["phase"];
  rooms: readonly ReactionEngineRoomSample[];
  lines: readonly ReactionEngineLineSample[];
}

export interface ReactionEngineDynamics {
  sampleSeconds: number;
  change: ReactionEngineChange;
  changeRate: number;
  homeostasis: number;
  activeReactionRate: number;
  activeRoomCount: number;
  primingLineCount: number;
  drainingLineCount: number;
  buildingRoomIds: readonly RoomId[];
  drainingRoomIds: readonly RoomId[];
  stableRoomIds: readonly RoomId[];
}

const equipmentReactionRate = (game: GameState, roomId: RoomId): number =>
  Object.values(roomState(game, roomId).equipment).reduce(
    (total, equipment) => total + (equipment?.operation?.lastRate ?? 0),
    0
  );

const roomReactionRate = (game: GameState, roomId: RoomId): number =>
  Object.values(roomState(game, roomId).reactions).reduce(
    (total, reaction) => total + Math.abs(reaction.lastRate),
    equipmentReactionRate(game, roomId)
  );

const equipmentOrReactionActive = (
  game: GameState,
  roomId: RoomId,
  definition: GameDefinition
): boolean => {
  const room = roomState(game, roomId);
  const analysis = analyzeRoom(room, definition);
  return (
    Object.values(room.equipment).some((equipment) => equipment?.enabled) ||
    roomReactionRate(game, roomId) >= 0.001 ||
    analysis.hazard >= 0.01 ||
    analysis.liquidTotal >= 0.01 ||
    Math.abs(room.temperature - definitionRoom(game, roomId).ambientTemperature) >= 0.1
  );
};

const addActiveLineRooms = (
  active: Set<RoomId>,
  game: GameState,
  phase: "gas" | "liquid"
): void => {
  const kind = phase === "gas" ? "gas_line" : "liquid_line";
  for (const connectionId of processLineIds(game, kind)) {
    const conduit =
      phase === "gas"
        ? gasConduitState(game, connectionId)
        : liquidConduitState(game, connectionId);
    if (!conduit.enabled) continue;
    const line = game.map.connections[connectionId];
    if (!line || (line.kind !== "gas_line" && line.kind !== "liquid_line")) continue;
    active.add(line.direction[0]);
    if (line.destinationKind === "room") active.add(line.direction[1]);
  }
};

const activeRoomIds = (game: GameState, definition: GameDefinition): Set<RoomId> => {
  const active = new Set(
    game.world.rooms.filter((roomId) => equipmentOrReactionActive(game, roomId, definition))
  );
  addActiveLineRooms(active, game, "gas");
  addActiveLineRooms(active, game, "liquid");
  return active;
};

const roomSample = (
  game: GameState,
  roomId: RoomId,
  active: ReadonlySet<RoomId>,
  definition: GameDefinition
): ReactionEngineRoomSample => {
  const room = roomState(game, roomId);
  const analysis = analyzeRoom(room, definition);
  return {
    roomId,
    active: active.has(roomId),
    gas: GAS_TYPES.flatMap((species) => [room.gas.lower[species], room.gas.upper[species]]),
    liquid: LIQUID_TYPES.map((species) => room.liquid[species]),
    temperatures: [room.temperature, room.gasTemperature.lower, room.gasTemperature.upper],
    inventory: analysis.gasTotal + analysis.liquidTotal,
    capacity: Math.max(1, roomUsableVolume(room, definition)),
    hazard: analysis.hazard,
    reactionRate: roomReactionRate(game, roomId),
  };
};

const lineSamples = (game: GameState, definition: GameDefinition): ReactionEngineLineSample[] => [
  ...processLineIds(game, "gas_line").map((connectionId) => {
    const conduit = gasConduitState(game, connectionId);
    return {
      connectionId,
      enabled: conduit.enabled,
      fillRatio:
        gasAmountTotal(conduit.gas) /
        Math.max(0.001, conduitCapacity(game, connectionId, "gas", definition)),
    };
  }),
  ...processLineIds(game, "liquid_line").map((connectionId) => {
    const conduit = liquidConduitState(game, connectionId);
    return {
      connectionId,
      enabled: conduit.enabled,
      fillRatio:
        liquidAmountTotal(conduit.liquid) /
        Math.max(0.001, conduitCapacity(game, connectionId, "liquid", definition)),
    };
  }),
];

/** A compact physical sample of the live reaction engine; it contains no enemy or combat data. */
export const reactionEngineSample = (
  game: GameState,
  gameDefinition: GameDefinition
): ReactionEngineSample => {
  const definition = definitionForMap(gameDefinition, game.map);
  const active = activeRoomIds(game, definition);
  return {
    elapsed: game.elapsed,
    levelId: game.campaign.levelId,
    roundIndex: game.campaign.roundIndex,
    phase: game.phase,
    rooms: game.world.rooms.map((roomId) => roomSample(game, roomId, active, definition)),
    lines: lineSamples(game, definition),
  };
};

const sumAbsoluteDifference = (left: readonly number[], right: readonly number[]): number =>
  left.reduce((total, value, index) => total + Math.abs(value - (right[index] ?? 0)), 0);

const roomChangeRate = (
  previous: ReactionEngineRoomSample,
  current: ReactionEngineRoomSample,
  seconds: number
): number => {
  const material =
    (sumAbsoluteDifference(previous.gas, current.gas) +
      sumAbsoluteDifference(previous.liquid, current.liquid)) /
    current.capacity;
  const thermal = sumAbsoluteDifference(previous.temperatures, current.temperatures) / 300;
  const reaction =
    Math.abs(current.reactionRate - previous.reactionRate) /
    Math.max(1, current.reactionRate, previous.reactionRate);
  return (material + thermal * 0.25 + reaction * 0.02) / seconds;
};

const roomDirectionRate = (
  previous: ReactionEngineRoomSample,
  current: ReactionEngineRoomSample,
  seconds: number
): number => {
  const inventory = (current.inventory - previous.inventory) / current.capacity / seconds;
  const hazard = ((current.hazard - previous.hazard) / Math.max(1, current.hazard)) * 0.01;
  const reaction =
    ((current.reactionRate - previous.reactionRate) /
      Math.max(1, current.reactionRate, previous.reactionRate)) *
    0.005;
  return inventory + hazard + reaction;
};

const lineChanges = (
  previous: ReactionEngineSample,
  current: ReactionEngineSample,
  seconds: number
): number[] =>
  current.lines
    .filter((line) => line.enabled)
    .map((line) => {
      const prior = previous.lines.find(
        (candidate) => candidate.connectionId === line.connectionId
      );
      return (line.fillRatio - (prior?.fillRatio ?? line.fillRatio)) / seconds;
    });

const changeBand = (changeRate: number): ReactionEngineChange => {
  if (changeRate >= HIGH_CHANGE_RATE) return "high";
  if (changeRate >= MODERATE_CHANGE_RATE) return "moderate";
  return "low";
};

export const reactionEngineDynamics = (
  previous: ReactionEngineSample,
  current: ReactionEngineSample
): ReactionEngineDynamics | null => {
  if (
    previous.levelId !== current.levelId ||
    previous.roundIndex !== current.roundIndex ||
    previous.phase !== current.phase
  )
    return null;
  const seconds = current.elapsed - previous.elapsed;
  if (seconds <= 0) return null;
  const activeRooms = current.rooms.filter((room) => room.active);
  const rates = activeRooms.map((room) => {
    const prior = previous.rooms.find((candidate) => candidate.roomId === room.roomId) ?? room;
    return {
      roomId: room.roomId,
      change: roomChangeRate(prior, room, seconds),
      direction: roomDirectionRate(prior, room, seconds),
    };
  });
  const roomRate =
    rates.length > 0 ? rates.reduce((total, room) => total + room.change, 0) / rates.length : 0;
  const lineRates = lineChanges(previous, current, seconds);
  const lineRate =
    lineRates.length > 0
      ? lineRates.reduce((total, change) => total + Math.abs(change), 0) / lineRates.length
      : 0;
  const changeRate = roomRate + lineRate * 0.35;
  return {
    sampleSeconds: seconds,
    change: changeBand(changeRate),
    changeRate,
    homeostasis: clamp(Math.exp(-changeRate * HOMEOSTASIS_DECAY), 0, 1),
    activeReactionRate: activeRooms.reduce((total, room) => total + room.reactionRate, 0),
    activeRoomCount: activeRooms.length,
    primingLineCount: lineRates.filter((rate) => rate >= ROOM_DIRECTION_RATE).length,
    drainingLineCount: lineRates.filter((rate) => rate <= -ROOM_DIRECTION_RATE).length,
    buildingRoomIds: rates
      .filter((room) => room.direction >= ROOM_DIRECTION_RATE)
      .map((room) => room.roomId),
    drainingRoomIds: rates
      .filter((room) => room.direction <= -ROOM_DIRECTION_RATE)
      .map((room) => room.roomId),
    stableRoomIds: rates
      .filter((room) => room.change < ROOM_STABLE_RATE)
      .map((room) => room.roomId),
  };
};
