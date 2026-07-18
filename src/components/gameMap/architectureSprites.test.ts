import { describe, expect, it } from "vitest";
import {
  ARCHITECTURE_TRANSITION_FRAME_COUNT,
  architectureFrameCount,
  architectureSpriteUrl,
  type ArchitectureSpriteId,
} from "./architectureSprites";

describe("architecture sprite presentation", () => {
  it("keeps structural hardware static and reserves animation for moving closures", () => {
    const staticAssets: ArchitectureSpriteId[] = [
      "walkway",
      "ladder",
      "passage",
      "ladder_shaft",
      "floor_hole",
    ];
    const closures: ArchitectureSpriteId[] = ["door", "core_door", "trapdoor"];
    for (const assetId of staticAssets) expect(architectureFrameCount(assetId)).toBe(1);
    for (const assetId of closures)
      expect(architectureFrameCount(assetId)).toBe(ARCHITECTURE_TRANSITION_FRAME_COUNT);
  });

  it("maps architecture ids directly to their rendered vector sheets", () => {
    expect(architectureSpriteUrl("core_door")).toBe("/sprites/architecture/core_door.sheet.png");
  });
});
