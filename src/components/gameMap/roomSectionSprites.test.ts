import { describe, expect, it } from "vitest";
import {
  ROOM_SECTION_SPRITE_IDS,
  ROOM_SECTION_TRANSITION_FRAMES,
  roomSectionFrameCount,
  roomSectionSpriteUrl,
  type RoomSectionSpriteId,
} from "./roomSectionSprites";

const CLOSURE_ASSETS = new Set<RoomSectionSpriteId>([
  "door_leaf",
  "door_leaf_hull",
  "core_door_leaf",
  "trapdoor_leaf",
  "trapdoor_leaf_hull",
]);

describe("modular room sprite presentation", () => {
  it("keeps structural sections static and animates closure leaves", () => {
    expect(ROOM_SECTION_SPRITE_IDS).toHaveLength(60);
    for (const assetId of ROOM_SECTION_SPRITE_IDS) {
      expect(roomSectionFrameCount(assetId)).toBe(
        CLOSURE_ASSETS.has(assetId) ? ROOM_SECTION_TRANSITION_FRAMES : 1
      );
    }
  });

  it("maps every section id to the checked-in room sheet directory", () => {
    for (const assetId of ROOM_SECTION_SPRITE_IDS) {
      expect(roomSectionSpriteUrl(assetId)).toBe(`/sprites/rooms/${assetId}.sheet.png`);
    }
  });
});
