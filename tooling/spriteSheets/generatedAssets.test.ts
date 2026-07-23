import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHITECTURE_SPRITE_DESIGNS } from "../architectureSprites/designs";
import { CORE_SPRITE_DESIGNS } from "../coreSprites/designs";
import { MACHINE_SPRITE_DESIGNS } from "../machineSprites/designs";
import { ROOM_SECTION_SPRITE_DESIGNS } from "../roomSectionSprites/designs";
import { ROOM_SECTION_SPRITE_IDS } from "../../src/components/gameMap/roomSectionSprites";
import { FRAME_COUNT, FRAME_SIZE, renderSpriteSheetSvg } from "./svg";
import type { SpriteSheetDesign } from "./render";

const assertSynchronized = async (
  directory: string,
  designs: Record<string, SpriteSheetDesign>,
  minimumPngSize = 10_000
): Promise<void> => {
  for (const [id, design] of Object.entries(designs)) {
    const authored = renderSpriteSheetSvg(design.label, design.palette, design.render, {
      frameCount: design.frameCount ?? FRAME_COUNT,
      frameSize: design.frameSize ?? FRAME_SIZE,
    });
    const checkedIn = await readFile(join(directory, `${id}.sheet.svg`), "utf8");
    const png = await stat(join(directory, `${id}.sheet.png`));
    expect(checkedIn).toBe(authored);
    expect(png.size).toBeGreaterThan(minimumPngSize);
  }
};

const assertRoomMaterialsAreDistinct = (designs: Record<string, SpriteSheetDesign>): void => {
  for (const [site, hull] of [
    ["floor", "floor_hull"],
    ["wall_left", "wall_left_hull"],
    ["ceiling_hole", "ceiling_hole_hull"],
    ["vertical_shaft_span", "vertical_shaft_span_hull"],
  ] as const) {
    expect(designs[site]?.palette).not.toEqual(designs[hull]?.palette);
    expect(designs[site]?.render(0, 0)).not.toBe(designs[hull]?.render(0, 0));
  }
};

describe("machine and architecture sprite generation", () => {
  it("authors nine softly animated room-scale machines", async () => {
    expect(Object.keys(MACHINE_SPRITE_DESIGNS)).toHaveLength(9);
    await assertSynchronized(
      join(process.cwd(), "public", "sprites", "machines"),
      MACHINE_SPRITE_DESIGNS
    );
  });

  it("authors site and hull variants of both free-standing structures", async () => {
    expect(Object.keys(ARCHITECTURE_SPRITE_DESIGNS)).toHaveLength(4);
    expect(ARCHITECTURE_SPRITE_DESIGNS.walkway.frameCount).toBe(1);
    expect(ARCHITECTURE_SPRITE_DESIGNS.walkway.palette).not.toEqual(
      ARCHITECTURE_SPRITE_DESIGNS.walkway_hull.palette
    );
    expect(ARCHITECTURE_SPRITE_DESIGNS.walkway.render(0, 0)).not.toBe(
      ARCHITECTURE_SPRITE_DESIGNS.walkway_hull.render(0, 0)
    );
    expect(ARCHITECTURE_SPRITE_DESIGNS.ladder.render(0, 0)).not.toBe(
      ARCHITECTURE_SPRITE_DESIGNS.ladder_hull.render(0, 0)
    );
    await assertSynchronized(
      join(process.cwd(), "public", "sprites", "architecture"),
      ARCHITECTURE_SPRITE_DESIGNS
    );
  });

  it("authors modular room boundaries and eight-frame closures", async () => {
    const designs: Record<string, SpriteSheetDesign> = ROOM_SECTION_SPRITE_DESIGNS;
    expect(Object.keys(ROOM_SECTION_SPRITE_DESIGNS)).toHaveLength(60);
    expect(Object.keys(ROOM_SECTION_SPRITE_DESIGNS).sort()).toEqual(
      [...ROOM_SECTION_SPRITE_IDS].sort()
    );
    expect(ROOM_SECTION_SPRITE_DESIGNS.floor.frameCount).toBe(1);
    expect(designs.door_leaf?.frameCount ?? FRAME_COUNT).toBe(FRAME_COUNT);
    expect(designs.door_leaf_hull?.frameCount ?? FRAME_COUNT).toBe(FRAME_COUNT);
    expect(designs.trapdoor_leaf?.frameCount ?? FRAME_COUNT).toBe(FRAME_COUNT);
    expect(designs.trapdoor_leaf_hull?.frameCount ?? FRAME_COUNT).toBe(FRAME_COUNT);
    assertRoomMaterialsAreDistinct(designs);
    await assertSynchronized(
      join(process.cwd(), "public", "sprites", "rooms"),
      ROOM_SECTION_SPRITE_DESIGNS,
      500
    );
  });

  it("authors four shaded and softly animated Core damage states", async () => {
    expect(Object.keys(CORE_SPRITE_DESIGNS)).toHaveLength(4);
    await assertSynchronized(join(process.cwd(), "public", "sprites", "core"), CORE_SPRITE_DESIGNS);
  });
});
