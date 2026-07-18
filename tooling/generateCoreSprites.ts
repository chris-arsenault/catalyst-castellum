import { join } from "node:path";
import { CORE_FRAME_SIZE, CORE_SPRITE_DESIGNS } from "./coreSprites/designs";
import { generateSpriteSheets } from "./spriteSheets/render";
import { FRAME_COUNT, RENDER_SCALE } from "./spriteSheets/svg";

await generateSpriteSheets(join(process.cwd(), "public", "sprites", "core"), CORE_SPRITE_DESIGNS);

console.log(
  `Generated ${Object.keys(CORE_SPRITE_DESIGNS).length} Core sheets (${FRAME_COUNT} frames each, ${CORE_FRAME_SIZE * RENDER_SCALE}px cells).`
);
