import type { Texture } from "pixi.js";
import { loadSpriteTextures } from "./spriteTextures";

export const ROOM_SECTION_SOURCE_SIZE = 128;
export const ROOM_SECTION_DISPLAY_SIZE = 64;
export const ROOM_SECTION_TRANSITION_FRAMES = 8;

export const ROOM_SECTION_SPRITE_IDS = [
  "back_wall_a",
  "back_wall_b",
  "back_wall_hull_a",
  "back_wall_hull_b",
  "floor",
  "floor_hull",
  "ceiling",
  "ceiling_hull",
  "wall_left",
  "wall_left_hull",
  "wall_right",
  "wall_right_hull",
  "corner_floor_left",
  "corner_floor_left_hull",
  "corner_floor_right",
  "corner_floor_right_hull",
  "corner_ceiling_left",
  "corner_ceiling_left_hull",
  "corner_ceiling_right",
  "corner_ceiling_right_hull",
  "hull_wiring",
  "hull_gauges",
  "wall_left_passage",
  "wall_left_passage_hull",
  "wall_right_passage",
  "wall_right_passage_hull",
  "wall_left_door",
  "wall_left_door_hull",
  "wall_right_door",
  "wall_right_door_hull",
  "wall_left_core_door",
  "wall_right_core_door",
  "floor_shaft",
  "floor_shaft_hull",
  "ceiling_shaft",
  "ceiling_shaft_hull",
  "floor_trapdoor",
  "floor_trapdoor_hull",
  "ceiling_trapdoor",
  "ceiling_trapdoor_hull",
  "floor_hole",
  "floor_hole_hull",
  "ceiling_hole",
  "ceiling_hole_hull",
  "horizontal_passage_span",
  "horizontal_passage_span_hull",
  "horizontal_door_span",
  "horizontal_door_span_hull",
  "horizontal_core_span",
  "vertical_shaft_span",
  "vertical_shaft_span_hull",
  "vertical_trapdoor_span",
  "vertical_trapdoor_span_hull",
  "vertical_hole_span",
  "vertical_hole_span_hull",
  "door_leaf",
  "door_leaf_hull",
  "core_door_leaf",
  "trapdoor_leaf",
  "trapdoor_leaf_hull",
] as const;

export type RoomSectionSpriteId = (typeof ROOM_SECTION_SPRITE_IDS)[number];

export const roomSectionSpriteUrl = (assetId: RoomSectionSpriteId): string =>
  `/sprites/rooms/${assetId}.sheet.png`;

export const roomSectionFrameCount = (assetId: RoomSectionSpriteId): number =>
  assetId.includes("_leaf") ? ROOM_SECTION_TRANSITION_FRAMES : 1;

export const loadRoomSectionTextures = (assetId: RoomSectionSpriteId): Promise<Texture[]> =>
  loadSpriteTextures(
    roomSectionSpriteUrl(assetId),
    roomSectionFrameCount(assetId),
    ROOM_SECTION_SOURCE_SIZE,
    true
  );
