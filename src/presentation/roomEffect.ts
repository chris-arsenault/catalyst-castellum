import type { ConduitRoomEffect, GameRuntime } from "../game/runtime";
import type { ConnectionId, GameState, RoomId } from "../game/types";
import type { Translator } from "../localization/translator";
import { instance } from "../game/world/instances";
import { roomCopy } from "./entityCopy";

export type RoomEffectTone = "increase" | "decrease" | "steady";

export interface RoomEffectCopy {
  roomId: RoomId;
  name: string;
  tone: RoomEffectTone;
  label: string;
}

export interface ConduitRoomEffectCopy {
  connectionId: ConnectionId;
  basisLabel: string;
  rooms: readonly RoomEffectCopy[];
}

export interface RoomEffectPresentation {
  conduit: (game: GameState, connectionId: ConnectionId, enabled: boolean) => ConduitRoomEffectCopy;
}

const boundedCache = <Value>() => {
  const entries = new Map<string, Value>();
  return {
    get(key: string): Value | undefined {
      return entries.get(key);
    },
    set(key: string, value: Value): void {
      entries.set(key, value);
      if (entries.size > 36) entries.delete(entries.keys().next().value as string);
    },
  };
};

const configurationKey = (game: GameState): string => {
  const conduits = [...Object.entries(game.gasConduits), ...Object.entries(game.liquidConduits)]
    .map(([id, conduit]) => `${id}:${Number(conduit.enabled)}:${Number(conduit.blocked)}`)
    .join("|");
  const equipment = Object.entries(game.rooms)
    .flatMap(([roomId, room]) =>
      Object.entries(room.equipment).flatMap(([socketId, item]) =>
        item
          ? [`${roomId}:${socketId}:${item.equipmentId}:${item.level}:${Number(item.enabled)}`]
          : []
      )
    )
    .join("|");
  return [
    game.campaign.levelId,
    game.campaign.roundIndex,
    game.mapRevision,
    game.phase,
    Math.floor(game.elapsed),
    conduits,
    equipment,
  ].join(";");
};

const localizeImpact = (
  game: GameState,
  impact: ConduitRoomEffect,
  translator: Translator
): ConduitRoomEffectCopy => ({
  connectionId: impact.connectionId,
  basisLabel: translator.text("ui.roomEffect.basis"),
  rooms: [
    {
      roomId: impact.roomId,
      tone: impact.tone,
      name: roomCopy(instance(game.map.rooms, impact.roomId, "room effect"), translator).name,
      label: translator.text(`ui.roomEffect.${impact.tone}`),
    },
  ],
});

export const createRoomEffectPresentation = (
  runtime: GameRuntime,
  translator: Translator
): RoomEffectPresentation => {
  const cache = boundedCache<ConduitRoomEffect>();
  return Object.freeze({
    conduit: (game: GameState, connectionId: ConnectionId, enabled: boolean) => {
      const key = `${configurationKey(game)};${connectionId};${Number(enabled)}`;
      let impact = cache.get(key);
      if (!impact) {
        impact = runtime.roomEffect.conduit(game, connectionId, enabled);
        cache.set(key, impact);
      }
      return localizeImpact(game, impact, translator);
    },
  });
};
