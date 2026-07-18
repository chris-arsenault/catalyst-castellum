import { join } from "node:path";
import {
  ARCHITECTURE_FRAME_SIZE,
  ARCHITECTURE_SPRITE_DESIGNS,
} from "./architectureSprites/designs";
import { generateSpriteSheets } from "./spriteSheets/render";
import { RENDER_SCALE } from "./spriteSheets/svg";

await generateSpriteSheets(
  join(process.cwd(), "public", "sprites", "architecture"),
  ARCHITECTURE_SPRITE_DESIGNS
);

console.log(
  `Generated ${Object.keys(ARCHITECTURE_SPRITE_DESIGNS).length} architecture sheets (${ARCHITECTURE_FRAME_SIZE * RENDER_SCALE}px cells).`
);
