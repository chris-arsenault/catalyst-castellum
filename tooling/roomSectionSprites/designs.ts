import { fixed } from "../spriteSheets/svg";
import type { SpriteSheetDesign } from "../spriteSheets/render";
import { HULL_MATERIAL, SITE_MATERIAL, type RoomSectionMaterial } from "./materials";

export const ROOM_SECTION_FRAME_SIZE = 64;

const staticFrame = { frameCount: 1, frameSize: ROOM_SECTION_FRAME_SIZE } as const;

const outline = (material: RoomSectionMaterial): string =>
  `stroke="${material.outline}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;

const shellFill = (material: RoomSectionMaterial): string =>
  material.kind === "hull" ? "url(#body)" : "url(#shell)";

const design = (
  label: string,
  render: SpriteSheetDesign["render"],
  animated = false
): SpriteSheetDesign => ({
  label,
  palette: SITE_MATERIAL.palette,
  render,
  ...(animated ? { frameSize: ROOM_SECTION_FRAME_SIZE } : staticFrame),
});

const hullDesign = (
  label: string,
  render: SpriteSheetDesign["render"],
  animated = false
): SpriteSheetDesign => ({ ...design(label, render, animated), palette: HULL_MATERIAL.palette });

const backWall = (material: RoomSectionMaterial, variant: "a" | "b") => (): string => `<g>
  <rect x="24" y="24" width="16" height="16" fill="${variant === "a" ? material.backA : material.backB}"/>
  <path d="M24 24 H40 M24 24 V40" stroke="${material.seam}" stroke-width=".8" opacity=".5"/>
  <path d="M40 24 V40 M24 40 H40" stroke="${material.bevel}" stroke-width="1.1" opacity=".82"/>
  <path d="M25 25 H39" stroke="${material.highlight}" stroke-width=".7" opacity="${material.kind === "hull" ? ".22" : ".12"}"/>
  ${
    variant === "a"
      ? `<path d="M26 37 L37 26" stroke="${material.detail}" stroke-width=".8" opacity=".34"/><circle cx="27" cy="27" r=".9" fill="${material.hardware}" opacity=".7"/>`
      : `<path d="M27 27 H37 V37" fill="none" stroke="${material.seam}" stroke-width=".7" opacity=".34"/><circle cx="37" cy="27" r=".9" fill="${material.hardware}" opacity=".7"/>`
  }
</g>`;

const hullWiring = (): string => `<g filter="url(#shadow)">
  <path d="M8 24 C18 24 19 30 28 30 S41 23 56 25" fill="none" stroke="${HULL_MATERIAL.shadow}" stroke-width="5" opacity=".9"/>
  <path d="M8 23 C18 23 20 28 28 28 S42 21 56 23" fill="none" stroke="${HULL_MATERIAL.hardware}" stroke-width="1.7" opacity=".95"/>
  <path d="M9 27 C20 27 20 33 31 33 S43 27 56 29" fill="none" stroke="#57a8ad" stroke-width="1.5" opacity=".9"/>
  <rect x="27" y="24" width="11" height="13" rx="2" fill="url(#body)" ${outline(HULL_MATERIAL)}/>
  <circle cx="32.5" cy="28" r="1.5" fill="${HULL_MATERIAL.signal}" stroke="${HULL_MATERIAL.outline}" stroke-width=".6"/>
  <path d="M30 33 H35" stroke="${HULL_MATERIAL.highlight}" stroke-width="1" opacity=".65"/>
</g>`;

const hullGauges = (): string => `<g filter="url(#shadow)">
  <path d="M18 22 H46 V42 H18Z" fill="url(#body)" ${outline(HULL_MATERIAL)}/>
  <path d="M20 24 H44" stroke="${HULL_MATERIAL.highlight}" stroke-width="1" opacity=".68"/>
  <circle cx="26" cy="32" r="5" fill="${HULL_MATERIAL.interior}" stroke="${HULL_MATERIAL.hardware}" stroke-width="1.1"/>
  <circle cx="38" cy="32" r="5" fill="${HULL_MATERIAL.interior}" stroke="#65aeb1" stroke-width="1.1"/>
  <path d="M26 32 L28 29 M38 32 L36 29" stroke="${HULL_MATERIAL.highlight}" stroke-width="1"/>
  <circle cx="23" cy="39" r="1.2" fill="#d9f47b"/><circle cx="28" cy="39" r="1.2" fill="#d78562"/>
  <path d="M34 39 H42" stroke="${HULL_MATERIAL.highlight}" stroke-width="1" opacity=".64"/>
</g>`;

const floor = (material: RoomSectionMaterial) => (): string => `<g>
  <rect x="24" y="33" width="16" height="8" fill="${material.shadow}" opacity=".7"/>
  <path d="M24 29 H40 V38 H24Z" fill="url(#body)" ${outline(material)}/>
  <path d="M24 28 H40 V32 H24Z" fill="${material.seam}" stroke="${material.outline}" stroke-width="1"/>
  <path d="M25 29 H39" stroke="${material.highlight}" stroke-width=".9" opacity=".72"/>
  <path d="M27 34 L37 31" stroke="${material.detail}" stroke-width="1" opacity=".82"/>
  <circle cx="27" cy="35" r="1" fill="${material.hardware}" stroke="${material.outline}" stroke-width=".6"/>
</g>`;

const ceiling = (material: RoomSectionMaterial) => (): string => `<g>
  <rect x="24" y="23" width="16" height="8" fill="${material.shadow}" opacity=".68"/>
  <path d="M24 26 H40 V35 H24Z" fill="${shellFill(material)}" ${outline(material)}/>
  <path d="M24 32 H40 V36 H24Z" fill="${material.seam}" stroke="${material.outline}" stroke-width="1"/>
  <path d="M25 33 H39" stroke="${material.highlight}" stroke-width=".8" opacity=".64"/>
  <path d="M27 29 H37" stroke="${material.hardware}" stroke-width="1" opacity=".72"/>
</g>`;

const wall = (material: RoomSectionMaterial, side: "left" | "right") => (): string => {
  const x = side === "left" ? 27 : 29;
  const highlight = side === "left" ? 33 : 30;
  return `<g>
    <rect x="${side === "left" ? 24 : 32}" y="24" width="8" height="16" fill="${material.shadow}" opacity=".68"/>
    <rect x="${x}" y="24" width="8" height="16" fill="url(#body)" ${outline(material)}/>
    <path d="M${highlight} 25 V39" stroke="${material.highlight}" stroke-width=".9" opacity=".68"/>
    <path d="M${x + 2} 28 L${x + 6} 25 M${x + 2} 39 L${x + 6} 36" stroke="${material.detail}" stroke-width=".9"/>
    <circle cx="${x + 4}" cy="32" r="1" fill="${material.hardware}" stroke="${material.outline}" stroke-width=".5"/>
  </g>`;
};

const corner =
  (material: RoomSectionMaterial, horizontal: "left" | "right", vertical: "floor" | "ceiling") =>
  (): string => {
    const sx = horizontal === "left" ? 1 : -1;
    const sy = vertical === "floor" ? -1 : 1;
    const transform = `translate(32 32) scale(${sx} ${sy}) translate(-32 -32)`;
    return `<g transform="${transform}" filter="url(#shadow)">
    <path d="M27 18 V37 H46 V29 H35 V18Z" fill="${shellFill(material)}" ${outline(material)}/>
    <path d="M30 19 V33 H45" fill="none" stroke="${material.highlight}" stroke-width="1" opacity=".64"/>
    <path d="M35 29 H44" stroke="${material.hardware}" stroke-width="1.2" opacity=".78"/>
    <circle cx="31" cy="29" r="1.4" fill="${material.hardware}" stroke="${material.outline}" stroke-width=".7"/>
  </g>`;
  };

type SidePortalKind = "passage" | "door" | "core_door";

const sidePortalAccent = (material: RoomSectionMaterial, kind: SidePortalKind): string => {
  if (kind === "passage") return material.passage;
  return kind === "door" ? material.pressure : material.hardware;
};

const sidePortalShell = (
  material: RoomSectionMaterial,
  kind: SidePortalKind,
  accent: string
): string => {
  const shell = shellFill(material);
  const edge = outline(material);
  if (kind === "passage")
    return `<path d="M21 8 H61 V15 H28 L21 18Z" fill="${shell}" ${edge}/>
      <path d="M21 49 L28 51 H61 V57 H21Z" fill="url(#body)" ${edge}/>
      <path d="M27 13 H60 M27 52 H60" stroke="${material.highlight}" stroke-width="1" opacity=".68"/>`;
  if (kind === "door")
    return `<path d="M18 7 H61 V16 H29 L18 20Z" fill="${shell}" ${edge}/>
      <path d="M18 48 L29 50 H61 V58 H18Z" fill="url(#body)" ${edge}/>
      <path d="M26 13 H60 M26 52 H60" stroke="${material.highlight}" stroke-width="1" opacity=".64"/>
      <path d="M21 18 H60 M21 49 H60" stroke="${accent}" stroke-width="1.4" opacity=".76"/>`;
  return `<path d="M15 5 H61 V17 H30 L15 21Z" fill="${shell}" ${edge}/>
    <path d="M15 47 L30 49 H61 V59 H15Z" fill="url(#body)" ${edge}/>
    <path d="M22 13 H60 M22 53 H60" stroke="${material.highlight}" stroke-width="1.2" opacity=".7"/>
    <path d="M18 19 H60 M18 48 H60" stroke="${accent}" stroke-width="1.8" opacity=".84"/>`;
};

const sidePortalMachinery = (
  material: RoomSectionMaterial,
  kind: SidePortalKind,
  accent: string
): string => {
  if (kind === "passage")
    return `<path d="M29 11 H58" stroke="${accent}" stroke-width="2.2" opacity=".74"/>
      <path d="M29 53 H58" stroke="${accent}" stroke-width="1.6" opacity=".64"/>
      <circle cx="25" cy="12" r="1.6" fill="${accent}" stroke="${material.outline}" stroke-width=".8"/>`;
  if (kind === "door")
    return `<rect x="20" y="8" width="12" height="8" rx="2" fill="${material.machinery}" stroke="${accent}" stroke-width="1"/>
      <circle cx="25" cy="12" r="1.5" fill="${material.signal}"/>
      <path d="M35 12 H59 M28 53 H59" stroke="${accent}" stroke-width="2" opacity=".78"/>`;
  return `<rect x="17" y="7" width="16" height="10" rx="2" fill="${material.machinery}" stroke="${accent}" stroke-width="1.2"/>
    <circle cx="25" cy="12" r="2" fill="${accent}" stroke="${material.outline}" stroke-width="1"/>
    <path d="M36 12 H59 M25 53 H59" stroke="${accent}" stroke-width="2.6" opacity=".8"/>
    <rect x="18" y="50" width="10" height="6" rx="1.5" fill="${material.machinery}" stroke="${accent}" stroke-width="1"/>`;
};

const sidePortal =
  (material: RoomSectionMaterial, side: "left" | "right", kind: SidePortalKind) => (): string => {
    const accent = sidePortalAccent(material, kind);
    const transform = side === "left" ? "" : ` transform="translate(64 0) scale(-1 1)"`;
    return `<g${transform} filter="url(#shadow)">
    ${sidePortalShell(material, kind, accent)}
    ${sidePortalMachinery(material, kind, accent)}
  </g>`;
  };

type VerticalPortalKind = "shaft" | "trapdoor" | "hole";

const verticalPortalAccent = (material: RoomSectionMaterial, kind: VerticalPortalKind): string => {
  if (kind === "shaft") return material.passage;
  return kind === "trapdoor" ? material.pressure : material.hardware;
};

const horizontalPortalMachinery = (
  material: RoomSectionMaterial,
  kind: VerticalPortalKind,
  accent: string
): string => {
  if (kind === "shaft")
    return `<path d="M19 35 V21 Q19 18 22 18 M45 35 V21 Q45 18 42 18" fill="none" stroke="${accent}" stroke-width="2.2"/>
      <path d="M17 24 H22 M42 24 H47" stroke="${material.highlight}" stroke-width="1" opacity=".64"/>`;
  if (kind === "trapdoor")
    return `<rect x="10" y="29" width="10" height="7" rx="2" fill="${material.machinery}" stroke="${accent}" stroke-width="1"/>
      <rect x="44" y="29" width="10" height="7" rx="2" fill="${material.machinery}" stroke="${accent}" stroke-width="1"/>
      <circle cx="15" cy="32.5" r="1.2" fill="${material.signal}"/><circle cx="49" cy="32.5" r="1.2" fill="${material.signal}"/>`;
  return `<path d="M10 30 L16 25 M15 35 L21 28 M43 28 L49 35 M48 25 L54 30" stroke="${accent}" stroke-width="2" opacity=".85"/>
    <circle cx="13" cy="36" r="1.4" fill="${accent}" stroke="${material.outline}" stroke-width=".7"/>
    <circle cx="51" cy="36" r="1.4" fill="${accent}" stroke="${material.outline}" stroke-width=".7"/>`;
};

const horizontalPortal =
  (material: RoomSectionMaterial, side: "floor" | "ceiling", kind: VerticalPortalKind) =>
  (): string => {
    const accent = verticalPortalAccent(material, kind);
    const transform = side === "floor" ? "" : ` transform="translate(0 64) scale(1 -1)"`;
    return `<g${transform} filter="url(#shadow)">
    <path d="M7 29 L13 24 H20 L24 29 L21 40 H10 L7 36Z" fill="${shellFill(material)}" ${outline(material)}/>
    <path d="M57 29 L51 24 H44 L40 29 L43 40 H54 L57 36Z" fill="${shellFill(material)}" ${outline(material)}/>
    <path d="M13 27 H20 L24 30 M51 27 H44 L40 30" fill="none" stroke="${material.highlight}" stroke-width="1" opacity=".68"/>
    <path d="M24 29 L21 40 M40 29 L43 40" stroke="${accent}" stroke-width="1.4" opacity=".78"/>
    ${horizontalPortalMachinery(material, kind, accent)}
  </g>`;
  };

const horizontalSpanMachinery = (
  material: RoomSectionMaterial,
  kind: SidePortalKind,
  accent: string
): string => {
  if (kind === "passage")
    return `<path d="M25 48 H39" stroke="${material.highlight}" stroke-width="1" opacity=".62"/>
      <path d="M27 53 H37" stroke="${accent}" stroke-width="1.4" opacity=".72"/>`;
  if (kind === "door")
    return `<circle cx="28" cy="12" r="1.3" fill="${accent}"/><circle cx="36" cy="12" r="1.3" fill="${accent}"/>
      <path d="M25 51 H39" stroke="${accent}" stroke-width="1.6" opacity=".76"/>`;
  return `<path d="M24 12 H40 M24 53 H40" stroke="${accent}" stroke-width="2.3" opacity=".82"/>
    <circle cx="32" cy="11" r="1.5" fill="${material.signal}"/>`;
};

const horizontalSpan = (material: RoomSectionMaterial, kind: SidePortalKind) => (): string => {
  const accent = sidePortalAccent(material, kind);
  return `<g>
    <rect x="24" y="15" width="16" height="35" fill="${material.interior}"/>
    <path d="M24 31 H40" stroke="${material.seam}" stroke-width=".7" opacity=".3"/>
    <path d="M24 8 H40 V15 H24Z M24 50 H40 V57 H24Z" fill="${shellFill(material)}" stroke="${material.outline}" stroke-width="1"/>
    <path d="M24 15 H40 M24 50 H40" stroke="${material.highlight}" stroke-width=".8" opacity=".54"/>
    ${horizontalSpanMachinery(material, kind, accent)}
  </g>`;
};

const verticalSpan = (material: RoomSectionMaterial, kind: VerticalPortalKind) => (): string => {
  const accent = verticalPortalAccent(material, kind);
  const ladder =
    kind === "shaft"
      ? `\n    <path d="M27 24 V40 M37 24 V40" stroke="${material.ladderRail}" stroke-width="3.4"/><path d="M27 28 H37 M27 35 H37" stroke="${material.ladderRung}" stroke-width="1.8"/>`
      : "";
  return `<g>
    <rect x="15" y="24" width="34" height="16" fill="${material.interior}"/>
    <path d="M8 24 H15 V40 H8Z M49 24 H56 V40 H49Z" fill="${shellFill(material)}" stroke="${material.outline}" stroke-width="1"/>
    <path d="M15 24 V40 M49 24 V40" stroke="${accent}" stroke-width="1.3" opacity=".76"/>
    <path d="M11 25 V39 M53 25 V39" stroke="${material.highlight}" stroke-width=".8" opacity=".56"/>${ladder}
  </g>`;
};

const doorLeaf =
  (material: RoomSectionMaterial, kind: "door" | "core_door") =>
  (_phase: number, frame: number): string => {
    const progress = frame / 7;
    const accent = kind === "door" ? material.pressure : material.hardware;
    const panelWidth = (kind === "door" ? 21 : 23) * (1 - progress) + 3;
    const gap = 1 + (kind === "door" ? 20 : 22) * progress;
    const left = 32 - gap - panelWidth;
    const right = 32 + gap;
    return `<g filter="url(#shadow)">
    <rect x="${fixed(left)}" y="13" width="${fixed(panelWidth)}" height="41" rx="2" fill="url(#body)" ${outline(material)}/>
    <rect x="${fixed(right)}" y="13" width="${fixed(panelWidth)}" height="41" rx="2" fill="url(#body)" ${outline(material)}/>
    <path d="M${fixed(32 - gap - 4)} 17 V50 M${fixed(32 + gap + 4)} 17 V50" stroke="${accent}" stroke-width="2"/>
    <path d="M${fixed(left + 3)} 17 H${fixed(32 - gap - 6)} M${fixed(32 + gap + 6)} 17 H${fixed(right + panelWidth - 3)}" stroke="${material.highlight}" stroke-width="1" opacity=".58"/>
  </g>`;
  };

const trapdoorLeaf =
  (material: RoomSectionMaterial) =>
  (_phase: number, frame: number): string => {
    const progress = frame / 7;
    const panelWidth = 21 * (1 - progress) + 3;
    const leftEnd = 31 - 20 * progress;
    const rightStart = 33 + 20 * progress;
    return `<g filter="url(#shadow)">
    <rect x="${fixed(leftEnd - panelWidth)}" y="27" width="${fixed(panelWidth)}" height="10" rx="2" fill="url(#body)" stroke="${material.pressure}" stroke-width="1.5"/>
    <rect x="${fixed(rightStart)}" y="27" width="${fixed(panelWidth)}" height="10" rx="2" fill="url(#body)" stroke="${material.pressure}" stroke-width="1.5"/>
    <path d="M${fixed(leftEnd - 3)} 29 V35 M${fixed(rightStart + 3)} 29 V35" stroke="${material.highlight}" stroke-width="1"/>
  </g>`;
  };

export const ROOM_SECTION_SPRITE_DESIGNS = {
  back_wall_a: design("Back wall panel A", backWall(SITE_MATERIAL, "a")),
  back_wall_b: design("Back wall panel B", backWall(SITE_MATERIAL, "b")),
  back_wall_hull_a: hullDesign("Hull back wall panel A", backWall(HULL_MATERIAL, "a")),
  back_wall_hull_b: hullDesign("Hull back wall panel B", backWall(HULL_MATERIAL, "b")),
  floor: design("Room floor section", floor(SITE_MATERIAL)),
  floor_hull: hullDesign("Hull floor section", floor(HULL_MATERIAL)),
  ceiling: design("Room ceiling section", ceiling(SITE_MATERIAL)),
  ceiling_hull: hullDesign("Hull ceiling section", ceiling(HULL_MATERIAL)),
  wall_left: design("Left wall section", wall(SITE_MATERIAL, "left")),
  wall_left_hull: hullDesign("Hull left wall section", wall(HULL_MATERIAL, "left")),
  wall_right: design("Right wall section", wall(SITE_MATERIAL, "right")),
  wall_right_hull: hullDesign("Hull right wall section", wall(HULL_MATERIAL, "right")),
  corner_floor_left: design("Floor left corner", corner(SITE_MATERIAL, "left", "floor")),
  corner_floor_left_hull: hullDesign(
    "Hull floor left corner",
    corner(HULL_MATERIAL, "left", "floor")
  ),
  corner_floor_right: design("Floor right corner", corner(SITE_MATERIAL, "right", "floor")),
  corner_floor_right_hull: hullDesign(
    "Hull floor right corner",
    corner(HULL_MATERIAL, "right", "floor")
  ),
  corner_ceiling_left: design("Ceiling left corner", corner(SITE_MATERIAL, "left", "ceiling")),
  corner_ceiling_left_hull: hullDesign(
    "Hull ceiling left corner",
    corner(HULL_MATERIAL, "left", "ceiling")
  ),
  corner_ceiling_right: design("Ceiling right corner", corner(SITE_MATERIAL, "right", "ceiling")),
  corner_ceiling_right_hull: hullDesign(
    "Hull ceiling right corner",
    corner(HULL_MATERIAL, "right", "ceiling")
  ),
  hull_wiring: hullDesign("Lived-in hull wiring", hullWiring),
  hull_gauges: hullDesign("Lived-in hull gauges", hullGauges),
  wall_left_passage: design("Left passage frame", sidePortal(SITE_MATERIAL, "left", "passage")),
  wall_left_passage_hull: hullDesign(
    "Hull left passage frame",
    sidePortal(HULL_MATERIAL, "left", "passage")
  ),
  wall_right_passage: design("Right passage frame", sidePortal(SITE_MATERIAL, "right", "passage")),
  wall_right_passage_hull: hullDesign(
    "Hull right passage frame",
    sidePortal(HULL_MATERIAL, "right", "passage")
  ),
  wall_left_door: design("Left pressure-door frame", sidePortal(SITE_MATERIAL, "left", "door")),
  wall_left_door_hull: hullDesign(
    "Hull left pressure-door frame",
    sidePortal(HULL_MATERIAL, "left", "door")
  ),
  wall_right_door: design("Right pressure-door frame", sidePortal(SITE_MATERIAL, "right", "door")),
  wall_right_door_hull: hullDesign(
    "Hull right pressure-door frame",
    sidePortal(HULL_MATERIAL, "right", "door")
  ),
  wall_left_core_door: hullDesign(
    "Left Core-door frame",
    sidePortal(HULL_MATERIAL, "left", "core_door")
  ),
  wall_right_core_door: hullDesign(
    "Right Core-door frame",
    sidePortal(HULL_MATERIAL, "right", "core_door")
  ),
  floor_shaft: design(
    "Floor ladder-shaft frame",
    horizontalPortal(SITE_MATERIAL, "floor", "shaft")
  ),
  floor_shaft_hull: hullDesign(
    "Hull floor ladder-shaft frame",
    horizontalPortal(HULL_MATERIAL, "floor", "shaft")
  ),
  ceiling_shaft: design(
    "Ceiling ladder-shaft frame",
    horizontalPortal(SITE_MATERIAL, "ceiling", "shaft")
  ),
  ceiling_shaft_hull: hullDesign(
    "Hull ceiling ladder-shaft frame",
    horizontalPortal(HULL_MATERIAL, "ceiling", "shaft")
  ),
  floor_trapdoor: design(
    "Floor trapdoor frame",
    horizontalPortal(SITE_MATERIAL, "floor", "trapdoor")
  ),
  floor_trapdoor_hull: hullDesign(
    "Hull floor trapdoor frame",
    horizontalPortal(HULL_MATERIAL, "floor", "trapdoor")
  ),
  ceiling_trapdoor: design(
    "Ceiling trapdoor frame",
    horizontalPortal(SITE_MATERIAL, "ceiling", "trapdoor")
  ),
  ceiling_trapdoor_hull: hullDesign(
    "Hull ceiling trapdoor frame",
    horizontalPortal(HULL_MATERIAL, "ceiling", "trapdoor")
  ),
  floor_hole: design("Floor opening frame", horizontalPortal(SITE_MATERIAL, "floor", "hole")),
  floor_hole_hull: hullDesign(
    "Hull floor opening frame",
    horizontalPortal(HULL_MATERIAL, "floor", "hole")
  ),
  ceiling_hole: design("Ceiling opening frame", horizontalPortal(SITE_MATERIAL, "ceiling", "hole")),
  ceiling_hole_hull: hullDesign(
    "Hull ceiling opening frame",
    horizontalPortal(HULL_MATERIAL, "ceiling", "hole")
  ),
  horizontal_passage_span: design(
    "Horizontal passage span",
    horizontalSpan(SITE_MATERIAL, "passage")
  ),
  horizontal_passage_span_hull: hullDesign(
    "Horizontal hull passage mouth",
    horizontalSpan(HULL_MATERIAL, "passage")
  ),
  horizontal_door_span: design(
    "Horizontal pressure-door span",
    horizontalSpan(SITE_MATERIAL, "door")
  ),
  horizontal_door_span_hull: hullDesign(
    "Horizontal hull pressure-door mouth",
    horizontalSpan(HULL_MATERIAL, "door")
  ),
  horizontal_core_span: hullDesign(
    "Horizontal Core-door span",
    horizontalSpan(HULL_MATERIAL, "core_door")
  ),
  vertical_shaft_span: design("Vertical ladder-shaft span", verticalSpan(SITE_MATERIAL, "shaft")),
  vertical_shaft_span_hull: hullDesign(
    "Vertical hull ladder-shaft mouth",
    verticalSpan(HULL_MATERIAL, "shaft")
  ),
  vertical_trapdoor_span: design("Vertical trapdoor span", verticalSpan(SITE_MATERIAL, "trapdoor")),
  vertical_trapdoor_span_hull: hullDesign(
    "Vertical hull trapdoor mouth",
    verticalSpan(HULL_MATERIAL, "trapdoor")
  ),
  vertical_hole_span: design("Vertical opening span", verticalSpan(SITE_MATERIAL, "hole")),
  vertical_hole_span_hull: hullDesign(
    "Vertical hull opening mouth",
    verticalSpan(HULL_MATERIAL, "hole")
  ),
  door_leaf: design("Sliding pressure-door leaf", doorLeaf(SITE_MATERIAL, "door"), true),
  door_leaf_hull: hullDesign(
    "Sliding hull pressure-door leaf",
    doorLeaf(HULL_MATERIAL, "door"),
    true
  ),
  core_door_leaf: hullDesign("Sliding Core-door leaf", doorLeaf(HULL_MATERIAL, "core_door"), true),
  trapdoor_leaf: design("Sliding trapdoor leaf", trapdoorLeaf(SITE_MATERIAL), true),
  trapdoor_leaf_hull: hullDesign("Sliding hull trapdoor leaf", trapdoorLeaf(HULL_MATERIAL), true),
} satisfies Record<string, SpriteSheetDesign>;
