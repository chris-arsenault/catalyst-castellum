import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import {
  FRAME_COUNT,
  FRAME_SIZE,
  RENDER_SCALE,
  renderSpriteSheetSvg,
  type SpriteFrame,
  type SpritePalette,
} from "./svg";

export interface SpriteSheetDesign {
  label: string;
  palette: SpritePalette;
  render: SpriteFrame;
  frameCount?: number;
  frameSize?: number;
}

export const generateSpriteSheets = async (
  outputDirectory: string,
  designs: Record<string, SpriteSheetDesign>
): Promise<void> => {
  await mkdir(outputDirectory, { recursive: true });
  for (const [id, design] of Object.entries(designs)) {
    const frameCount = design.frameCount ?? FRAME_COUNT;
    const frameSize = design.frameSize ?? FRAME_SIZE;
    const svg = renderSpriteSheetSvg(design.label, design.palette, design.render, {
      frameCount,
      frameSize,
    });
    const renderer = new Resvg(svg, {
      fitTo: { mode: "width", value: frameSize * frameCount * RENDER_SCALE },
      imageRendering: 0,
    });
    await Promise.all([
      writeFile(join(outputDirectory, `${id}.sheet.svg`), svg),
      writeFile(join(outputDirectory, `${id}.sheet.png`), renderer.render().asPng()),
    ]);
  }
};
