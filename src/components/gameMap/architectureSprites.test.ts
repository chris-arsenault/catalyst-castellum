import { describe, expect, it } from "vitest";
import { architectureSpriteUrl, type ArchitectureSpriteId } from "./architectureSprites";

describe("architecture sprite presentation", () => {
  it("keeps free-standing structures separate from assembled room boundaries", () => {
    const assets: ArchitectureSpriteId[] = ["walkway", "walkway_hull", "ladder", "ladder_hull"];
    expect(assets.map(architectureSpriteUrl)).toEqual([
      "/sprites/architecture/walkway.sheet.png",
      "/sprites/architecture/walkway_hull.sheet.png",
      "/sprites/architecture/ladder.sheet.png",
      "/sprites/architecture/ladder_hull.sheet.png",
    ]);
  });

  it("maps architecture ids directly to their rendered vector sheets", () => {
    expect(architectureSpriteUrl("walkway")).toBe("/sprites/architecture/walkway.sheet.png");
  });
});
