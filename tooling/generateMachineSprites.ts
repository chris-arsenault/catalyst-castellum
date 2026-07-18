import { join } from "node:path";
import { MACHINE_SPRITE_DESIGNS, MACHINE_FRAME_SIZE } from "./machineSprites/designs";
import { generateSpriteSheets } from "./spriteSheets/render";
import { FRAME_COUNT, RENDER_SCALE } from "./spriteSheets/svg";

await generateSpriteSheets(
  join(process.cwd(), "public", "sprites", "machines"),
  MACHINE_SPRITE_DESIGNS
);

console.log(
  `Generated ${Object.keys(MACHINE_SPRITE_DESIGNS).length} machine sheets (${FRAME_COUNT} frames each, ${MACHINE_FRAME_SIZE * RENDER_SCALE}px cells).`
);
