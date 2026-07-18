import { join } from "node:path";
import { ROOM_SECTION_FRAME_SIZE, ROOM_SECTION_SPRITE_DESIGNS } from "./roomSectionSprites/designs";
import { generateSpriteSheets } from "./spriteSheets/render";
import { RENDER_SCALE } from "./spriteSheets/svg";

await generateSpriteSheets(
  join(process.cwd(), "public", "sprites", "rooms"),
  ROOM_SECTION_SPRITE_DESIGNS
);

console.log(
  `Generated ${Object.keys(ROOM_SECTION_SPRITE_DESIGNS).length} room-section sheets (${ROOM_SECTION_FRAME_SIZE * RENDER_SCALE}px cells).`
);
