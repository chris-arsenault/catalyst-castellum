import { DEFAULT_GAME_DEFINITION } from "./definition";
import type { GameDefinition } from "./definitionTypes";
import {
  decodeGame as decodeGameForDefinition,
  encodeGame as encodeGameForDefinition,
} from "./persistence/saveCodec";

export const createSaveCodec = (definition: GameDefinition) =>
  Object.freeze({
    encode: (game: Parameters<typeof encodeGameForDefinition>[0]) =>
      encodeGameForDefinition(game, definition),
    decode: (raw: string) => decodeGameForDefinition(raw, definition),
  });

export type SaveCodec = ReturnType<typeof createSaveCodec>;

export const DEFAULT_SAVE_CODEC = createSaveCodec(DEFAULT_GAME_DEFINITION);
export const encodeGame = DEFAULT_SAVE_CODEC.encode;
export const decodeGame = DEFAULT_SAVE_CODEC.decode;
