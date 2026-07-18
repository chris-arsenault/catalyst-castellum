import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AIR_SPRITE_DESIGNS } from "./creaturesAir";
import { GROUND_SPRITE_DESIGNS } from "./creaturesGround";
import { FRAME_COUNT, FRAME_SIZE, renderSpriteSheetSvg } from "./svg";

const designs = { ...GROUND_SPRITE_DESIGNS, ...AIR_SPRITE_DESIGNS };
const assetDirectory = join(process.cwd(), "public", "sprites", "enemies");

describe("enemy sprite generator", () => {
  it("authors eight smooth vector frames for every animation variant", () => {
    expect(Object.keys(designs)).toHaveLength(9);
    for (const design of Object.values(designs)) {
      const svg = renderSpriteSheetSvg(design.label, design.palette, design.render);
      expect(svg).toContain(`width="${FRAME_SIZE * FRAME_COUNT}" height="${FRAME_SIZE}"`);
      expect(svg.match(/clip-path="url\(#frame-clip\)"/g)).toHaveLength(FRAME_COUNT);
      expect(svg).not.toContain("crispEdges");
    }
  });

  it("keeps checked-in SVG sources and rendered PNG sheets synchronized", async () => {
    for (const [id, design] of Object.entries(designs)) {
      const authored = renderSpriteSheetSvg(design.label, design.palette, design.render);
      const checkedIn = await readFile(join(assetDirectory, `${id}.sheet.svg`), "utf8");
      const png = await stat(join(assetDirectory, `${id}.sheet.png`));
      expect(checkedIn).toBe(authored);
      expect(png.size).toBeGreaterThan(20_000);
    }
  });
});
