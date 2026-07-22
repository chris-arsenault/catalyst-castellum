import type { GameDefinition } from "../definitionTypes";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type ConnectionId,
  type GameState,
  type GasAmounts,
  type LiquidAmounts,
  type RoomId,
} from "../types";
import { definitionForMap } from "../world/activeDefinition";
import { facilityModelFor } from "../world/derivedModel";
import { conduitState, gasJunctionState, liquidJunctionState, roomState } from "../world/instances";
import { channelTotal } from "./damage";
import { simulateInstalledEquipment } from "./equipment";
import { refillLocalJunctions } from "./junctions";
import { conduitEndpoint } from "./networkGeometry";
import {
  gasAmountTotal,
  gasZoneForPort,
  liquidAmountTotal,
  mixedTemperature,
  roomUsableVolume,
} from "./physics";
import { simulateReactions } from "./reactions";
import { addGas, addLiquid, analyzeRoom, cloneGame, takeGas, takeLiquid } from "./roomState";

const GAS_SAMPLE_FILL = 0.18;
const LIQUID_SAMPLE_FILL = 0.12;
const RESPONSE_SECONDS = 1;
const REACTION_RATE_WEIGHT = 8;

export type ConduitRoomEffectTone = "increase" | "decrease" | "steady";

export interface ConduitRoomEffect {
  connectionId: ConnectionId;
  enabled: boolean;
  roomId: RoomId;
  scoreDelta: number;
  tone: ConduitRoomEffectTone;
}

const scaledGas = (mixture: GasAmounts, amount: number): GasAmounts => {
  const total = gasAmountTotal(mixture);
  return Object.fromEntries(
    GAS_TYPES.map((species) => [species, total > 0 ? (mixture[species] / total) * amount : 0])
  ) as GasAmounts;
};

const scaledLiquid = (mixture: LiquidAmounts, amount: number): LiquidAmounts => {
  const total = liquidAmountTotal(mixture);
  return Object.fromEntries(
    LIQUID_TYPES.map((species) => [species, total > 0 ? (mixture[species] / total) * amount : 0])
  ) as LiquidAmounts;
};

const targetRoomId = (
  game: GameState,
  connectionId: ConnectionId
): { roomId: RoomId; external: boolean } => {
  const line = game.map.connections[connectionId];
  if (!line || (line.kind !== "gas_line" && line.kind !== "liquid_line"))
    throw new Error(`Connection ${connectionId} is not a process line.`);
  return line.destinationKind === "room"
    ? { roomId: line.direction[1], external: false }
    : { roomId: line.direction[0], external: true };
};

const sourceSample = (
  game: GameState,
  connectionId: ConnectionId,
  definition: GameDefinition
): GameState => {
  const sample = cloneGame(game);
  conduitState(sample, connectionId).enabled = true;
  refillLocalJunctions(sample, RESPONSE_SECONDS, definition);
  return sample;
};

const gasPortZone = (
  game: GameState,
  connectionId: ConnectionId,
  roomId: RoomId,
  endpoint: "from" | "to"
) => {
  const port = conduitEndpoint(game, connectionId, "gas", endpoint);
  return gasZoneForPort(facilityModelFor(game).roomPortHeight(roomId, port.elevation));
};

const addRepresentativeGas = (
  game: GameState,
  sample: GameState,
  connectionId: ConnectionId,
  roomId: RoomId,
  definition: GameDefinition
): void => {
  const line = game.map.connections[connectionId];
  if (!line || line.kind !== "gas_line") return;
  const junction = gasJunctionState(sample, line.direction[0]);
  if (gasAmountTotal(junction.gas) <= 0) return;
  const room = roomState(game, roomId);
  const zone = gasPortZone(game, connectionId, roomId, "to");
  const amount = roomUsableVolume(room, definition) * GAS_SAMPLE_FILL;
  const previous = gasAmountTotal(room.gas[zone]);
  addGas(room.gas[zone], scaledGas(junction.gas, amount));
  room.gasTemperature[zone] = mixedTemperature(
    room.gasTemperature[zone],
    previous,
    junction.temperature,
    amount
  );
};

const addRepresentativeLiquid = (
  game: GameState,
  sample: GameState,
  connectionId: ConnectionId,
  roomId: RoomId,
  definition: GameDefinition
): void => {
  const line = game.map.connections[connectionId];
  if (!line || line.kind !== "liquid_line") return;
  const junction = liquidJunctionState(sample, line.direction[0]);
  if (liquidAmountTotal(junction.liquid) <= 0) return;
  const amount = roomUsableVolume(roomState(game, roomId), definition) * LIQUID_SAMPLE_FILL;
  addLiquid(roomState(game, roomId).liquid, scaledLiquid(junction.liquid, amount));
};

const removeRepresentativeMaterial = (
  game: GameState,
  connectionId: ConnectionId,
  roomId: RoomId,
  definition: GameDefinition
): void => {
  const line = game.map.connections[connectionId];
  if (!line || (line.kind !== "gas_line" && line.kind !== "liquid_line")) return;
  const room = roomState(game, roomId);
  if (line.kind === "gas_line") {
    const zone = gasPortZone(game, connectionId, roomId, "from");
    const amount = gasAmountTotal(room.gas[zone]) * GAS_SAMPLE_FILL;
    takeGas(room.gas[zone], amount);
    addGas(room.gas[zone], scaledGas(definition.ambientGas, amount));
    return;
  }
  takeLiquid(room.liquid, liquidAmountTotal(room.liquid) * LIQUID_SAMPLE_FILL);
};

const applyRepresentativeTransfer = (
  game: GameState,
  sample: GameState,
  connectionId: ConnectionId,
  roomId: RoomId,
  external: boolean,
  definition: GameDefinition
): void => {
  if (external) return removeRepresentativeMaterial(game, connectionId, roomId, definition);
  const line = game.map.connections[connectionId];
  if (line?.kind === "gas_line")
    return addRepresentativeGas(game, sample, connectionId, roomId, definition);
  addRepresentativeLiquid(game, sample, connectionId, roomId, definition);
};

const roomEffectiveness = (game: GameState, roomId: RoomId, definition: GameDefinition): number => {
  simulateInstalledEquipment(game, RESPONSE_SECONDS, definition);
  const bursts = simulateReactions(game, RESPONSE_SECONDS, definition);
  const analysis = analyzeRoom(roomState(game, roomId), definition);
  const burstStrength = bursts
    .filter((burst) => burst.roomId === roomId)
    .reduce((total, burst) => total + channelTotal(burst.channels), 0);
  const routeControl =
    (1 - analysis.groundMovementMultiplier) * 12 + (1 - analysis.flyingMovementMultiplier) * 6;
  const room = roomState(game, roomId);
  const reactionRate = Object.values(room.reactions).reduce(
    (total, reaction) => total + Math.abs(reaction.lastRate),
    0
  );
  const equipmentRate = Object.values(room.equipment).reduce(
    (total, equipment) => total + (equipment?.operation?.lastRate ?? 0),
    0
  );
  return (
    channelTotal(analysis.hazards) +
    burstStrength +
    routeControl +
    (reactionRate + equipmentRate) * REACTION_RATE_WEIGHT
  );
};

const effectTone = (scoreDelta: number, baseline: number): ConduitRoomEffectTone => {
  const threshold = Math.max(0.05, Math.abs(baseline) * 0.01);
  if (scoreDelta > threshold) return "increase";
  if (scoreDelta < -threshold) return "decrease";
  return "steady";
};

/** First-order target-room response to one representative packet, independent of wave survival. */
export const conduitRoomEffect = (
  source: GameState,
  connectionId: ConnectionId,
  enabled: boolean,
  gameDefinition: GameDefinition
): ConduitRoomEffect => {
  const definition = definitionForMap(gameDefinition, source.map);
  const target = targetRoomId(source, connectionId);
  const sample = sourceSample(source, connectionId, definition);
  const baseline = cloneGame(source);
  const changed = cloneGame(source);
  applyRepresentativeTransfer(
    changed,
    sample,
    connectionId,
    target.roomId,
    target.external,
    definition
  );
  const baselineScore = roomEffectiveness(baseline, target.roomId, definition);
  const openingDelta = roomEffectiveness(changed, target.roomId, definition) - baselineScore;
  const scoreDelta = enabled ? openingDelta : -openingDelta;
  return {
    connectionId,
    enabled,
    roomId: target.roomId,
    scoreDelta,
    tone: effectTone(scoreDelta, baselineScore),
  };
};
