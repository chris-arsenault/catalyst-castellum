import { fixed } from "../spriteSheets/svg";
import type { SpriteSheetDesign } from "../spriteSheets/render";

export const ARCHITECTURE_FRAME_SIZE = 128;

const outline = `stroke="#13201c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
const palette = {
  dark: "#263a33",
  body: "#58766a",
  light: "#aec5ba",
  accent: "#d6af61",
  glow: "#ffe6a1",
};

const rivet = (x: number, y: number, color = "#d9c58d"): string =>
  `<circle cx="${x}" cy="${y}" r="2" fill="${color}" stroke="#15201c" stroke-width="1"/>`;

const walkway = (): string => `<g filter="url(#shadow)">
  <path d="M7 55 L17 45 H121 L111 55Z" fill="#a5bcb1" ${outline}/>
  <path d="M7 55 H111 V82 H7Z" fill="url(#body)" ${outline}/>
  <path d="M14 61 H104 V74 H14Z" fill="#1d312a" stroke="#718f82" stroke-width="1.3"/>
  <path d="M16 62 L34 74 L52 62 L70 74 L88 62 L103 72" fill="none" stroke="#9eb4aa" stroke-width="2" opacity=".72"/>
  <path d="M9 53 H113" stroke="#e2eee8" stroke-width="2" opacity=".58"/>
  <path d="M14 46 V20 M41 46 V25 M77 46 V25 M106 46 V20 M14 22 H106" fill="none" stroke="#658278" stroke-width="4"/>
  <path d="M14 22 H106" stroke="#c1d4cc" stroke-width="1.4" opacity=".8"/>
  ${rivet(15, 67)}${rivet(103, 67)}
  <path d="M13 84 H106" stroke="#050a08" stroke-width="5" opacity=".55"/>
</g>`;

const ladder = (): string => `<g>
  <path d="M22 -8 H44 V136 H22Z M84 -8 H106 V136 H84Z" fill="url(#body)" ${outline}/>
  <path d="M29 -4 V132 M91 -4 V132" stroke="#d8c07b" stroke-width="3" opacity=".88"/>
  <path d="M40 65 H88" stroke="#192a25" stroke-width="9" stroke-linecap="round"/>
  <path d="M40 64 H88" stroke="#c9b46e" stroke-width="5" stroke-linecap="round"/>
  <path d="M43 62 H85" stroke="#fff0b1" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
</g>`;

const fullLadderBody = (): string => `
  <path d="M35 9 H49 V119 H35Z M79 9 H93 V119 H79Z" fill="url(#body)" ${outline}/>
  <path d="M40 11 V116 M84 11 V116" stroke="#d8c07b" stroke-width="3" opacity=".88"/>
  ${Array.from({ length: 7 }, (_, index) => {
    const y = 18 + index * 15;
    return `<path d="M46 ${y} H82" stroke="#192a25" stroke-width="7"/><path d="M46 ${y - 1} H82" stroke="#c9b46e" stroke-width="3"/><path d="M49 ${y - 2} H79" stroke="#fff0b1" stroke-width="1" opacity=".55"/>`;
  }).join("")}
  <path d="M32 8 Q42 1 52 8 M76 8 Q86 1 96 8" fill="none" stroke="#90a99d" stroke-width="3"/>
  ${rivet(42, 14)}${rivet(86, 14)}${rivet(42, 113)}${rivet(86, 113)}
`;

const passage = (): string => `<g filter="url(#shadow)">
  <path d="M18 108 V47 Q18 18 47 13 H81 Q110 18 110 47 V108 H94 V49 Q94 32 78 29 H50 Q34 32 34 49 V108Z" fill="url(#shell)" ${outline}/>
  <path d="M35 108 V50 Q35 33 51 30 H77 Q93 33 93 50 V108Z" fill="#050a08" stroke="#769184" stroke-width="2"/>
  <path d="M26 104 V48 Q26 26 49 21 H79 Q102 26 102 48 V104" fill="none" stroke="#c6d8cf" stroke-width="2" opacity=".5"/>
  <path d="M22 96 H38 M90 96 H106 M22 69 H37 M91 69 H106 M31 31 L43 39 M97 31 L85 39" stroke="#d6af61" stroke-width="3" opacity=".72"/>
  ${rivet(27, 52)}${rivet(101, 52)}${rivet(27, 89)}${rivet(101, 89)}
  <ellipse cx="64" cy="108" rx="39" ry="6" fill="#020605" opacity=".6"/>
</g>`;

const ladderShaft = (): string => `<g filter="url(#shadow)">
  <path d="M23 8 H105 V120 H23Z" fill="#13221d" stroke="#668477" stroke-width="2"/>
  <path d="M27 12 H101 V116 H27Z" fill="#050a08" stroke="#293f36" stroke-width="2"/>
  <path d="M20 8 H108 V20 H20Z M20 108 H108 V120 H20Z" fill="url(#shell)" ${outline}/>
  <path d="M27 17 H101 M27 111 H101" stroke="#d6af61" stroke-width="2" opacity=".72"/>
  <g transform="translate(0 1)">${fullLadderBody()}</g>
  ${rivet(27, 14)}${rivet(101, 14)}${rivet(27, 114)}${rivet(101, 114)}
</g>`;

const floorHole = (): string => `<g filter="url(#shadow)">
  <ellipse cx="64" cy="74" rx="49" ry="19" fill="#030706" stroke="#15241f" stroke-width="3"/>
  <path d="M12 54 L23 44 H105 L116 54 L106 65 H22Z" fill="url(#shell)" ${outline}/>
  <path d="M24 53 H104 L96 60 H32Z" fill="#050a08" stroke="#7e9b8d" stroke-width="1.5"/>
  <path d="M18 51 L28 45 M32 54 L42 45 M48 54 L58 45 M64 54 L74 45 M80 54 L90 45 M96 54 L106 47" stroke="#d6af61" stroke-width="3" opacity=".82"/>
  <path d="M23 66 L34 102 M105 66 L94 102" stroke="#334b41" stroke-width="5"/>
  <path d="M26 68 L35 98 M102 68 L93 98" stroke="#9bb0a6" stroke-width="1.3"/>
</g>`;

const doorFrame = (accent: string): string => `
  <path d="M12 114 V31 L27 13 H101 L116 31 V114 H103 V35 L94 25 H34 L25 35 V114Z" fill="url(#shell)" ${outline}/>
  <path d="M22 112 V35 L33 22 H95 L106 35 V112" fill="none" stroke="#b9ccc2" stroke-width="2" opacity=".5"/>
  <path d="M15 98 H30 M98 98 H113 M17 58 H27 M101 58 H111" stroke="${accent}" stroke-width="3" opacity=".78"/>
  ${rivet(22, 42)}${rivet(106, 42)}${rivet(22, 106)}${rivet(106, 106)}`;

const door = (_phase: number, frame: number): string => {
  const progress = frame / 7;
  const panelWidth = 39 * (1 - progress) + 8;
  const gap = 2 + 39 * progress;
  return `<g filter="url(#shadow)">
    <path d="M24 111 V36 Q24 27 34 27 H94 Q104 27 104 36 V111Z" fill="#040807"/>
    <rect x="${fixed(64 - gap - panelWidth)}" y="30" width="${fixed(panelWidth)}" height="81" rx="3" fill="url(#body)" ${outline}/>
    <rect x="${fixed(64 + gap)}" y="30" width="${fixed(panelWidth)}" height="81" rx="3" fill="url(#body)" ${outline}/>
    <path d="M${fixed(64 - gap - 5)} 35 V106 M${fixed(64 + gap + 5)} 35 V106" stroke="#d78562" stroke-width="2.5" opacity=".88"/>
    <path d="M${fixed(64 - gap - panelWidth + 5)} 39 H${fixed(64 - gap - 7)} M${fixed(64 + gap + 7)} 39 H${fixed(64 + gap + panelWidth - 5)}" stroke="#d7e4dd" stroke-width="1.6" opacity=".38"/>
    ${doorFrame("#d78562")}
    <circle cx="19" cy="29" r="4" fill="${progress > 0.5 ? "#caff83" : "#ff9a68"}" stroke="#17221f" stroke-width="1.4"/>
  </g>`;
};

const coreDoor = (_phase: number, frame: number): string => {
  const progress = frame / 7;
  const panelWidth = 41 * (1 - progress) + 6;
  const gap = 1 + 41 * progress;
  return `<g filter="url(#shadow)">
    <path d="M16 113 V30 L31 10 H97 L112 30 V113Z" fill="#171b14" stroke="#746a3f" stroke-width="4"/>
    <path d="M26 108 V37 L39 23 H89 L102 37 V108Z" fill="#030605" stroke="#a99a61" stroke-width="2"/>
    <path d="M${fixed(64 - gap - panelWidth)} 31 H${fixed(64 - gap)} V108 H${fixed(64 - gap - panelWidth)}Z" fill="url(#shell)" ${outline}/>
    <path d="M${fixed(64 + gap)} 31 H${fixed(64 + gap + panelWidth)} V108 H${fixed(64 + gap)}Z" fill="url(#shell)" ${outline}/>
    <path d="M${fixed(64 - gap - 5)} 36 V103 M${fixed(64 + gap + 5)} 36 V103" stroke="#e4c86a" stroke-width="3" opacity=".9"/>
    <path d="M20 94 H34 M94 94 H108 M22 51 H32 M96 51 H106" stroke="#b89b56" stroke-width="4"/>
    ${rivet(23, 35, "#e4c86a")}${rivet(105, 35, "#e4c86a")}${rivet(23, 105, "#e4c86a")}${rivet(105, 105, "#e4c86a")}
    <circle cx="64" cy="18" r="6" fill="${progress > 0.5 ? "#d9f47b" : "#db6f4f"}" stroke="#28271a" stroke-width="2"/>
  </g>`;
};

const trapdoor = (_phase: number, frame: number): string => {
  const progress = frame / 7;
  const width = 42 * (1 - progress) + 5;
  const leftEnd = 18 + width;
  const rightStart = 110 - width;
  return `<g filter="url(#shadow)">
    <ellipse cx="64" cy="76" rx="51" ry="18" fill="#020605" stroke="#15231f" stroke-width="3"/>
    <path d="M10 53 L20 43 H108 L118 53 L110 68 H18Z" fill="url(#shell)" ${outline}/>
    <path d="M18 55 H${fixed(leftEnd)} V70 H18Z M${fixed(rightStart)} 55 H110 V70 H${fixed(rightStart)}Z" fill="url(#body)" stroke="#d78562" stroke-width="2"/>
    <path d="M${fixed(leftEnd - 4)} 58 V67 M${fixed(rightStart + 4)} 58 V67" stroke="#ffd0a8" stroke-width="1.5"/>
    <path d="M16 51 L27 44 M31 53 L42 44 M86 53 L97 44 M101 53 L112 48" stroke="#d6af61" stroke-width="3" opacity=".8"/>
    ${rivet(20, 61)}${rivet(108, 61)}
  </g>`;
};

export const ARCHITECTURE_SPRITE_DESIGNS = {
  walkway: {
    label: "Refined walkway",
    palette,
    render: walkway,
    frameCount: 1,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  ladder: {
    label: "Refined ladder",
    palette,
    render: ladder,
    frameCount: 1,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  passage: {
    label: "Open passage",
    palette,
    render: passage,
    frameCount: 1,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  ladder_shaft: {
    label: "Ladder shaft",
    palette,
    render: ladderShaft,
    frameCount: 1,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  floor_hole: {
    label: "Floor opening",
    palette,
    render: floorHole,
    frameCount: 1,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  door: {
    label: "Sliding pressure door",
    palette,
    render: door,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  core_door: {
    label: "Core bulkhead door",
    palette,
    render: coreDoor,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
  trapdoor: {
    label: "Sliding trapdoor",
    palette,
    render: trapdoor,
    frameSize: ARCHITECTURE_FRAME_SIZE,
  },
} satisfies Record<string, SpriteSheetDesign>;
