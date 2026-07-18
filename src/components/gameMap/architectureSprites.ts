import type { Texture } from "pixi.js";
import { loadSpriteTextures } from "./spriteTextures";

export const ARCHITECTURE_SPRITE_SOURCE_SIZE = 256;
export const ARCHITECTURE_TRANSITION_FRAME_COUNT = 8;

export type ArchitectureSpriteId =
  | "walkway"
  | "ladder"
  | "passage"
  | "ladder_shaft"
  | "floor_hole"
  | "door"
  | "core_door"
  | "trapdoor";

export const architectureSpriteUrl = (assetId: ArchitectureSpriteId): string =>
  `/sprites/architecture/${assetId}.sheet.png`;

export const architectureFrameCount = (assetId: ArchitectureSpriteId): number =>
  assetId === "door" || assetId === "core_door" || assetId === "trapdoor"
    ? ARCHITECTURE_TRANSITION_FRAME_COUNT
    : 1;

export const loadArchitectureSpriteTextures = (assetId: ArchitectureSpriteId): Promise<Texture[]> =>
  loadSpriteTextures(
    architectureSpriteUrl(assetId),
    architectureFrameCount(assetId),
    ARCHITECTURE_SPRITE_SOURCE_SIZE,
    true
  );
