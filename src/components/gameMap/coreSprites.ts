import type { Texture } from "pixi.js";
import type { CoreDamageState } from "./coreDamageModel";
import { loadSpriteTextures } from "./spriteTextures";

export const CORE_SPRITE_FRAME_COUNT = 8;
export const CORE_SPRITE_SOURCE_SIZE = 704;
export const CORE_SPRITE_DISPLAY_SIZE = 352;

export const coreSpriteUrl = (state: CoreDamageState): string => `/sprites/core/${state}.sheet.png`;

export const loadCoreSpriteTextures = (state: CoreDamageState): Promise<Texture[]> =>
  loadSpriteTextures(coreSpriteUrl(state), CORE_SPRITE_FRAME_COUNT, CORE_SPRITE_SOURCE_SIZE, true);
