import type { SpriteSheetDesign } from "../spriteSheets/render";
import {
  HULL_MATERIAL,
  SITE_MATERIAL,
  type RoomSectionMaterial,
} from "../roomSectionSprites/materials";

export const ARCHITECTURE_FRAME_SIZE = 128;

const outline = (material: RoomSectionMaterial): string =>
  `stroke="${material.outline}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;

const rivet = (material: RoomSectionMaterial, x: number, y: number): string =>
  `<circle cx="${x}" cy="${y}" r="2" fill="${material.hardware}" stroke="${material.outline}" stroke-width="1"/>`;

const walkway = (material: RoomSectionMaterial) => (): string => `<g filter="url(#shadow)">
  <path d="M7 55 L17 45 H121 L111 55Z" fill="${material.highlight}" ${outline(material)}/>
  <path d="M7 55 H111 V82 H7Z" fill="url(#body)" ${outline(material)}/>
  <path d="M14 61 H104 V74 H14Z" fill="${material.interior}" stroke="${material.seam}" stroke-width="1.3"/>
  <path d="M16 62 L34 74 L52 62 L70 74 L88 62 L103 72" fill="none" stroke="${material.seam}" stroke-width="2" opacity=".82"/>
  <path d="M9 53 H113" stroke="${material.highlight}" stroke-width="2" opacity=".72"/>
  <path d="M14 46 V20 M41 46 V25 M77 46 V25 M106 46 V20 M14 22 H106" fill="none" stroke="${material.ladderRail}" stroke-width="4"/>
  <path d="M14 22 H106" stroke="${material.highlight}" stroke-width="1.4" opacity=".86"/>
  ${rivet(material, 15, 67)}${rivet(material, 103, 67)}
  <path d="M13 84 H106" stroke="${material.shadow}" stroke-width="5" opacity=".62"/>
</g>`;

const ladder = (material: RoomSectionMaterial) => (): string => `<g>
  <path d="M22 -8 H44 V136 H22Z M84 -8 H106 V136 H84Z" fill="url(#body)" ${outline(material)}/>
  <path d="M29 -4 V132 M91 -4 V132" stroke="${material.highlight}" stroke-width="3" opacity=".82"/>
  <path d="M40 65 H88" stroke="${material.shadow}" stroke-width="9" stroke-linecap="round"/>
  <path d="M40 64 H88" stroke="${material.ladderRung}" stroke-width="5" stroke-linecap="round"/>
  <path d="M43 62 H85" stroke="${material.highlight}" stroke-width="1.5" stroke-linecap="round" opacity=".65"/>
</g>`;

const architectureDesign = (
  label: string,
  material: RoomSectionMaterial,
  render: SpriteSheetDesign["render"]
): SpriteSheetDesign => ({
  label,
  palette: material.palette,
  render,
  frameCount: 1,
  frameSize: ARCHITECTURE_FRAME_SIZE,
});

export const ARCHITECTURE_SPRITE_DESIGNS = {
  walkway: architectureDesign("Site walkway", SITE_MATERIAL, walkway(SITE_MATERIAL)),
  walkway_hull: architectureDesign("Castellum walkway", HULL_MATERIAL, walkway(HULL_MATERIAL)),
  ladder: architectureDesign("Site ladder", SITE_MATERIAL, ladder(SITE_MATERIAL)),
  ladder_hull: architectureDesign("Castellum ladder", HULL_MATERIAL, ladder(HULL_MATERIAL)),
} satisfies Record<string, SpriteSheetDesign>;
