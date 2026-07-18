import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHITECTURE_SPRITE_DESIGNS } from "../architectureSprites/designs";
import { CORE_SPRITE_DESIGNS } from "../coreSprites/designs";
import { MACHINE_SPRITE_DESIGNS } from "../machineSprites/designs";
import { FRAME_COUNT, FRAME_SIZE, renderSpriteSheetSvg } from "./svg";
import type { SpriteSheetDesign } from "./render";

const assertSynchronized = async (
  directory: string,
  designs: Record<string, SpriteSheetDesign>
): Promise<void> => {
  for (const [id, design] of Object.entries(designs)) {
    const authored = renderSpriteSheetSvg(design.label, design.palette, design.render, {
      frameCount: design.frameCount ?? FRAME_COUNT,
      frameSize: design.frameSize ?? FRAME_SIZE,
    });
    const checkedIn = await readFile(join(directory, `${id}.sheet.svg`), "utf8");
    const png = await stat(join(directory, `${id}.sheet.png`));
    expect(checkedIn).toBe(authored);
    expect(png.size).toBeGreaterThan(10_000);
  }
};

describe("machine and architecture sprite generation", () => {
  it("authors four softly animated room-scale machines", async () => {
    expect(Object.keys(MACHINE_SPRITE_DESIGNS)).toHaveLength(4);
    await assertSynchronized(
      join(process.cwd(), "public", "sprites", "machines"),
      MACHINE_SPRITE_DESIGNS
    );
  });

  it("authors static structures and eight-frame portal transitions", async () => {
    const designs: Record<string, SpriteSheetDesign> = ARCHITECTURE_SPRITE_DESIGNS;
    expect(Object.keys(ARCHITECTURE_SPRITE_DESIGNS)).toHaveLength(8);
    expect(ARCHITECTURE_SPRITE_DESIGNS.walkway.frameCount).toBe(1);
    expect(designs.door?.frameCount ?? FRAME_COUNT).toBe(FRAME_COUNT);
    expect(designs.trapdoor?.frameCount ?? FRAME_COUNT).toBe(FRAME_COUNT);
    await assertSynchronized(
      join(process.cwd(), "public", "sprites", "architecture"),
      ARCHITECTURE_SPRITE_DESIGNS
    );
  });

  it("authors four shaded and softly animated Core damage states", async () => {
    expect(Object.keys(CORE_SPRITE_DESIGNS)).toHaveLength(4);
    await assertSynchronized(join(process.cwd(), "public", "sprites", "core"), CORE_SPRITE_DESIGNS);
  });
});
