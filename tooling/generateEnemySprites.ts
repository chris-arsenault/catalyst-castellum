import { join } from "node:path";
import { AIR_SPRITE_DESIGNS } from "./enemySprites/creaturesAir";
import { GROUND_SPRITE_DESIGNS } from "./enemySprites/creaturesGround";
import { generateSpriteSheets } from "./spriteSheets/render";
import { FRAME_COUNT, FRAME_SIZE, RENDER_SCALE } from "./spriteSheets/svg";

const outputDirectory = join(process.cwd(), "public", "sprites", "enemies");
const designs = { ...GROUND_SPRITE_DESIGNS, ...AIR_SPRITE_DESIGNS };

await generateSpriteSheets(outputDirectory, designs);

console.log(
  `Generated ${Object.keys(designs).length} vector sprite sheets (${FRAME_COUNT} frames each, ${FRAME_SIZE * RENDER_SCALE}px cells).`
);
