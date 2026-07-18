import { fixed, point } from "../spriteSheets/svg";
import type { SpriteSheetDesign } from "../spriteSheets/render";

export const MACHINE_FRAME_SIZE = 128;

const outline = `stroke="#14201d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
const steel = "#253b35";

const machineBase = (accent: string): string => `
  <ellipse cx="64" cy="111" rx="46" ry="8" fill="#020706" opacity=".62"/>
  <path d="M27 101 L23 113 H37 L40 101 M88 101 L92 113 H106 L101 101" fill="${steel}" ${outline}/>
  <path d="M19 103 H109 L103 112 H25Z" fill="#1c2d28" ${outline}/>
  <path d="M27 105 H101" stroke="${accent}" stroke-width="1.4" opacity=".58"/>`;

const gasAgitator = (phase: number): string => {
  const rotor = (phase / (Math.PI * 2)) * 360;
  const wave = Math.sin(phase) * 2.4;
  const blades = Array.from({ length: 4 }, (_, index) => {
    const angle = phase + index * (Math.PI / 2);
    const inner = point(64 + Math.cos(angle) * 5, 72 + Math.sin(angle) * 5);
    const outer = point(64 + Math.cos(angle + 0.28) * 19, 72 + Math.sin(angle + 0.28) * 19);
    const wing = point(64 + Math.cos(angle + 0.75) * 11, 72 + Math.sin(angle + 0.75) * 11);
    return `<path d="M${inner} L${outer} L${wing}Z" fill="#76ded2" opacity=".82"/>`;
  }).join("");
  return `<g filter="url(#shadow)">
    ${machineBase("#65cfc4")}
    <path d="M31 46 Q31 38 40 37 H88 Q97 38 97 46 V96 Q94 103 85 105 H43 Q34 103 31 96Z" fill="url(#body)" ${outline}/>
    <path d="M36 51 H92 V92 Q89 98 82 99 H46 Q39 98 36 92Z" fill="#102a27" stroke="#6ecfc4" stroke-width="1.7"/>
    <path d="M39 ${fixed(80 + wave)} Q51 ${fixed(75 - wave)} 64 ${fixed(80 + wave)} T89 ${fixed(80 + wave)} V94 H39Z" fill="#398f89" opacity=".5"/>
    <circle cx="64" cy="72" r="22" fill="#0a1816" stroke="#a5eee4" stroke-width="1.4" opacity=".95"/>
    ${blades}<circle cx="64" cy="72" r="4.5" fill="#d7f8f3" stroke="#213c37" stroke-width="2"/>
    <path d="M64 49 V35" stroke="#a9bbb2" stroke-width="5"/><path d="M64 49 V35" stroke="#263c36" stroke-width="2.2"/>
    <rect x="46" y="18" width="36" height="20" rx="5" fill="#344c45" ${outline}/>
    <path d="M51 22 H77 M51 27 H77 M51 32 H77" stroke="#8ba89c" stroke-width="1.3" opacity=".72"/>
    <circle cx="64" cy="28" r="7" fill="#172722" stroke="#65cfc4" stroke-width="1.4"/>
    <path d="M64 23 L68 29 L63 34 L59 28Z" fill="#9ef5eb" transform="rotate(${fixed(rotor)} 64 28)"/>
    <path d="M97 57 H108 V84 H98" fill="none" stroke="#5d7c70" stroke-width="6"/><path d="M97 57 H108 V84 H98" fill="none" stroke="#a6bdb3" stroke-width="1.3"/>
    <circle cx="39" cy="44" r="3" fill="#caff85" stroke="#1b2824" stroke-width="1.4"/>
    <path d="M36 48 Q53 40 78 43" fill="none" stroke="#ddfff8" stroke-width="2" opacity=".34"/>
  </g>`;
};

const wetContactor = (phase: number, frame: number): string => {
  const pumpRotation = (phase / (Math.PI * 2)) * 360;
  const bubbles = Array.from({ length: 6 }, (_, index) => {
    const age = ((frame + index * 2) % 8) / 8;
    const x = 56 + (index % 3) * 8 + Math.sin(phase + index) * 1.8;
    const y = 88 - age * 52;
    return `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(1.4 + age * 1.4)}" fill="#a9ddff" opacity="${fixed(0.82 - age * 0.38)}"/>`;
  }).join("");
  return `<g filter="url(#shadow)">
    ${machineBase("#5e92e3")}
    <path d="M40 26 Q40 17 50 15 H79 Q88 17 88 26 V99 Q85 105 78 106 H50 Q42 104 40 98Z" fill="url(#body)" ${outline}/>
    <path d="M44 31 H84 V94 H44Z" fill="#13293b" stroke="#76a9ee" stroke-width="1.6"/>
    <path d="M49 35 H79 V91 H49Z" fill="#245a7b" opacity=".65"/>
    <path d="M49 68 Q64 ${fixed(63 + Math.sin(phase) * 3)} 79 68 V91 H49Z" fill="#4c9bc8" opacity=".46"/>
    ${bubbles}
    <path d="M44 42 H84 M44 57 H84 M44 73 H84 M44 88 H84" stroke="#b5c9d2" stroke-width="1.2" opacity=".43"/>
    <path d="M39 22 H89 M39 99 H89" stroke="#a4b8ae" stroke-width="7"/><path d="M39 22 H89 M39 99 H89" stroke="#d2e0da" stroke-width="1.5" opacity=".65"/>
    <path d="M39 42 H25 V87 H39 M88 33 H104 V75 H89" fill="none" stroke="#3c5e6a" stroke-width="7"/><path d="M39 42 H25 V87 H39 M88 33 H104 V75 H89" fill="none" stroke="#8eb6c7" stroke-width="1.4"/>
    <circle cx="104" cy="82" r="13" fill="#243f46" ${outline}/>
    <g transform="rotate(${fixed(pumpRotation)} 104 82)"><path d="M104 72 L108 80 L104 92 L100 81Z M94 82 L102 78 L114 82 L103 86Z" fill="#75afe8"/></g>
    <circle cx="104" cy="82" r="3" fill="#d4f1ff"/>
    <rect x="52" y="9" width="24" height="9" rx="3" fill="#314b45" ${outline}/>
    <circle cx="47" cy="29" r="3" fill="#d8ff81" stroke="#17221f" stroke-width="1.4"/>
    <path d="M45 32 Q55 20 72 21" fill="none" stroke="#efffff" stroke-width="2" opacity=".3"/>
  </g>`;
};

const thermalCoil = (phase: number): string => {
  const glow = 0.62 + (Math.sin(phase) + 1) * 0.14;
  const fanRotation = (phase / (Math.PI * 2)) * 360;
  const shimmer = [0, 1, 2]
    .map((index) => {
      const x = 47 + index * 13;
      const sway = Math.sin(phase + index * 0.8) * 3;
      return `<path d="M${x} 35 Q${fixed(x + sway)} 27 ${fixed(x - sway)} 19" fill="none" stroke="#ffc070" stroke-width="1.7" opacity="${fixed(0.24 + index * 0.08)}"/>`;
    })
    .join("");
  return `<g filter="url(#shadow)">
    ${machineBase("#f58844")}${shimmer}
    <path d="M22 37 L31 27 H97 L106 37 V99 Q101 106 94 106 H34 Q26 105 22 99Z" fill="url(#body)" ${outline}/>
    <rect x="31" y="42" width="66" height="51" rx="4" fill="#211711" stroke="#c86d35" stroke-width="2"/>
    <rect x="37" y="48" width="54" height="39" rx="3" fill="#120d0a" stroke="#7e4d31" stroke-width="1.3"/>
    <path d="M42 54 H84 L45 63 L84 72 L45 82 H86" fill="none" stroke="#f58844" stroke-width="5" opacity="${fixed(glow)}" filter="url(#soft-glow)"/>
    <path d="M42 54 H84 L45 63 L84 72 L45 82 H86" fill="none" stroke="#ffd18c" stroke-width="1.6" opacity=".94"/>
    <circle cx="97" cy="67" r="16" fill="#293b35" ${outline}/>
    <g transform="rotate(${fixed(fanRotation)} 97 67)"><path d="M97 52 Q105 58 101 66 Q94 62 97 52Z M112 67 Q106 75 98 71 Q102 64 112 67Z M97 82 Q89 76 93 68 Q100 72 97 82Z M82 67 Q88 59 96 63 Q92 70 82 67Z" fill="#c46d3c"/></g>
    <circle cx="97" cy="67" r="3.5" fill="#ffcf8b"/>
    <circle cx="43" cy="35" r="9" fill="#1c2d28" stroke="#8aa094" stroke-width="1.5"/>
    <path d="M43 35 L${fixed(43 + Math.cos(phase - 2.2) * 6)} ${fixed(35 + Math.sin(phase - 2.2) * 6)}" stroke="#ff9a4d" stroke-width="1.8"/>
    <path d="M59 30 H92" stroke="#c7d6cf" stroke-width="2" opacity=".35"/>
    <circle cx="29" cy="42" r="3" fill="#d8ff81" stroke="#17221f" stroke-width="1.4"/>
  </g>`;
};

const membraneCell = (phase: number, frame: number): string => {
  const current = 0.58 + (Math.sin(phase) + 1) * 0.12;
  const bubbles = (x: number, offset: number, color: string): string =>
    Array.from({ length: 4 }, (_, index) => {
      const age = ((frame + index * 2 + offset) % 8) / 8;
      return `<circle cx="${fixed(x + Math.sin(phase + index) * 4)}" cy="${fixed(88 - age * 42)}" r="${fixed(1.4 + age)}" fill="${color}" opacity="${fixed(0.82 - age * 0.35)}"/>`;
    }).join("");
  return `<g filter="url(#shadow)">
    ${machineBase("#c5f540")}
    <path d="M15 38 L24 28 H104 L113 38 V100 Q108 106 99 106 H29 Q20 106 15 100Z" fill="url(#body)" ${outline}/>
    <rect x="22" y="43" width="84" height="51" rx="4" fill="#111d19" stroke="#9ac437" stroke-width="1.8"/>
    <rect x="27" y="48" width="33" height="41" rx="3" fill="#173e54" stroke="#62b9db" stroke-width="1.2"/>
    <rect x="68" y="48" width="33" height="41" rx="3" fill="#354919" stroke="#c5f540" stroke-width="1.2"/>
    <rect x="61" y="45" width="6" height="47" rx="2" fill="#dce8b6" stroke="#688044" stroke-width="1.2" opacity=".92"/>
    ${bubbles(44, 0, "#8ee2ff")}${bubbles(85, 3, "#e4ff79")}
    <path d="M33 52 V85 M54 52 V85 M74 52 V85 M95 52 V85" stroke="#cbd8d0" stroke-width="2.2" opacity=".42"/>
    <path d="M36 28 V17 H55 V28 M73 28 V17 H93 V28" fill="none" stroke="#83988e" stroke-width="7"/>
    <path d="M36 17 H55 M73 17 H93" stroke="#d7e2dc" stroke-width="2" opacity=".65"/>
    <path d="M55 17 H73" stroke="#e8ff93" stroke-width="2.5" opacity="${fixed(current)}" filter="url(#soft-glow)"/>
    <circle cx="26" cy="39" r="3" fill="#d8ff81" stroke="#17221f" stroke-width="1.4"/>
    <path d="M21 41 Q40 30 61 34" fill="none" stroke="#efffe0" stroke-width="2" opacity=".28"/>
    <path d="M48 97 V105 M80 97 V105" stroke="#8ca095" stroke-width="4"/>
  </g>`;
};

export const MACHINE_SPRITE_DESIGNS = {
  gas_agitator: {
    label: "Gas agitator",
    palette: {
      dark: "#294c45",
      body: "#527c71",
      light: "#a6c9bc",
      accent: "#65cfc4",
      glow: "#9efff3",
    },
    render: gasAgitator,
    frameSize: MACHINE_FRAME_SIZE,
  },
  wet_contactor: {
    label: "Wet contactor",
    palette: {
      dark: "#29495d",
      body: "#4e7894",
      light: "#a4c8dc",
      accent: "#5e92e3",
      glow: "#a9ddff",
    },
    render: wetContactor,
    frameSize: MACHINE_FRAME_SIZE,
  },
  thermal_coil: {
    label: "Thermal coil",
    palette: {
      dark: "#67402b",
      body: "#a56338",
      light: "#d9a16f",
      accent: "#f58844",
      glow: "#ffc070",
    },
    render: thermalCoil,
    frameSize: MACHINE_FRAME_SIZE,
  },
  membrane_cell: {
    label: "Membrane cell",
    palette: {
      dark: "#40532c",
      body: "#6c8244",
      light: "#bacd83",
      accent: "#c5f540",
      glow: "#e8ff93",
    },
    render: membraneCell,
    frameSize: MACHINE_FRAME_SIZE,
  },
} satisfies Record<string, SpriteSheetDesign>;
