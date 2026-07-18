import type { Texture } from "pixi.js";
import { loadSpriteTextures } from "./spriteTextures";

export const ARCHITECTURE_SPRITE_SOURCE_SIZE = 256;

export type ArchitectureSpriteId = "walkway" | "walkway_hull" | "ladder" | "ladder_hull";

export const architectureSpriteUrl = (assetId: ArchitectureSpriteId): string =>
  `/sprites/architecture/${assetId}.sheet.png`;

export const loadArchitectureSpriteTextures = (assetId: ArchitectureSpriteId): Promise<Texture[]> =>
  loadSpriteTextures(architectureSpriteUrl(assetId), 1, ARCHITECTURE_SPRITE_SOURCE_SIZE, true);
