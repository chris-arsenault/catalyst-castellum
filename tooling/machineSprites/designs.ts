import { fixed, point } from "../spriteSheets/svg";
import type { SpriteSheetDesign } from "../spriteSheets/render";

export const MACHINE_FRAME_SIZE = 128;

const outline = `stroke="#14201d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
const steel = "#253b35";

const machineBase = (
  accent: string
): string => `<ellipse cx="64" cy="111" rx="46" ry="8" fill="#020706" opacity=".62"/>
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

const fluorineCell = (phase: number, frame: number): string => {
  const current = 0.55 + (Math.sin(phase) + 1) * 0.18;
  const bubbles = (x: number, offset: number, color: string): string =>
    Array.from({ length: 3 }, (_, index) => {
      const age = ((frame + index * 3 + offset) % 8) / 8;
      return `<circle cx="${fixed(x + Math.sin(phase + index) * 3)}" cy="${fixed(87 - age * 32)}" r="${fixed(1.3 + age)}" fill="${color}" opacity="${fixed(0.84 - age * 0.32)}"/>`;
    }).join("");
  const arc = 0.35 + current * 0.45;
  return `<g filter="url(#shadow)">
    ${machineBase("#e5ef62")}
    <path d="M18 42 L27 25 H98 L110 42 V99 Q105 106 97 106 H31 Q22 105 18 99Z" fill="url(#body)" ${outline}/>
    <path d="M26 46 H101 V94 H26Z" fill="#101c1b" stroke="#c8d45b" stroke-width="1.8"/>
    <path d="M31 51 H57 V89 H31Z" fill="#163d4d" stroke="#79c9dd" stroke-width="1.3"/>
    <path d="M68 51 H95 V89 H68Z" fill="#41451a" stroke="#e5ef62" stroke-width="1.3"/>
    ${bubbles(44, 0, "#9ee9ff")}${bubbles(82, 2, "#f3ff84")}
    <path d="M61 47 V92" stroke="#e0e8c7" stroke-width="7"/><path d="M61 48 V91" stroke="#68715b" stroke-width="2"/>
    <path d="M38 54 V86 M50 54 V86 M75 54 V86 M88 54 V86" stroke="#d8e4dc" stroke-width="2" opacity=".48"/>
    <path d="M42 25 V14 H55 V25 M75 25 V14 H90 V25" fill="none" stroke="#687f76" stroke-width="7"/>
    <path d="M42 14 H55 M75 14 H90" stroke="#d4e1db" stroke-width="1.8" opacity=".7"/>
    <path d="M55 14 Q64 ${fixed(9 + Math.sin(phase) * 2)} 75 14" fill="none" stroke="#f4ff9a" stroke-width="2.5" opacity="${fixed(arc)}" filter="url(#soft-glow)"/>
    <path d="M18 58 H9 V88 H19" fill="none" stroke="#5e776e" stroke-width="7"/><path d="M18 58 H9 V88 H19" fill="none" stroke="#b3c7bd" stroke-width="1.3"/>
    <path d="M104 52 H118 V82 H106" fill="none" stroke="#6d7441" stroke-width="7"/><path d="M104 52 H118 V82 H106" fill="none" stroke="#e6ec9b" stroke-width="1.3"/>
    <path d="M108 88 l7 12 h-14Z" fill="#e5ef62" stroke="#1d2722" stroke-width="1.5"/><path d="M108 92 v4" stroke="#1d2722" stroke-width="1.5"/><circle cx="108" cy="98" r="1" fill="#1d2722"/>
    <circle cx="28" cy="42" r="3" fill="#f1ff7c" stroke="#17221f" stroke-width="1.4"/>
    <path d="M23 45 Q43 31 69 35" fill="none" stroke="#fbffe5" stroke-width="2" opacity=".28"/>
  </g>`;
};

const catalyticReactor = (phase: number): string => {
  const glow = 0.5 + (Math.sin(phase) + 1) * 0.2;
  const gaugeAngle = Math.sin(phase * 0.5) * 40;
  const shimmer = [0, 1, 2]
    .map((index) => {
      const sway = Math.sin(phase + index * 1.1) * 2.5;
      const x = 52 + index * 12;
      return `<path d="M${x} 30 Q${fixed(x + sway)} 23 ${fixed(x - sway)} 16" fill="none" stroke="#ffb98c" stroke-width="1.5" opacity="${fixed(0.2 + index * 0.08)}"/>`;
    })
    .join("");
  return `<g filter="url(#shadow)">
    ${machineBase("#e0824f")}${shimmer}
    <path d="M40 34 Q40 18 64 17 Q88 18 88 34 V95 Q85 104 76 105 H52 Q43 104 40 95Z" fill="url(#body)" ${outline}/>
    <path d="M45 38 H83 V90 Q80 97 73 98 H55 Q48 97 45 90Z" fill="#241510" stroke="#e0824f" stroke-width="1.7"/>
    <path d="M49 44 H79 M49 53 H79 M49 62 H79 M49 71 H79 M49 80 H79" stroke="#8a4f2e" stroke-width="2.2"/>
    <path d="M52 44 V83 M60 44 V83 M68 44 V83 M76 44 V83" stroke="#5c331d" stroke-width="1.4" opacity=".8"/>
    <path d="M49 48 H79 L49 58 H79 L49 68 H79 L49 78 H79" fill="none" stroke="#ff9a5c" stroke-width="2.6" opacity="${fixed(glow)}" filter="url(#soft-glow)"/>
    <path d="M40 52 H26 V84 H40 M88 45 H104 V76 H89" fill="none" stroke="#6b5142" stroke-width="7"/>
    <path d="M40 52 H26 V84 H40 M88 45 H104 V76 H89" fill="none" stroke="#c4a68f" stroke-width="1.4"/>
    <path d="M64 17 V8" stroke="#a08a76" stroke-width="6"/><path d="M64 17 V8" stroke="#3a2a1e" stroke-width="2"/>
    <circle cx="64" cy="27" r="7.5" fill="#1e1410" stroke="#e0824f" stroke-width="1.5"/>
    <path d="M64 27 L${fixed(64 + Math.cos((gaugeAngle - 90) * 0.01745) * 5)} ${fixed(27 + Math.sin((gaugeAngle - 90) * 0.01745) * 5)}" stroke="#ffd0a8" stroke-width="1.8"/>
    <rect x="92" y="86" width="14" height="18" rx="3" fill="#33241b" ${outline}/>
    <path d="M95 90 H103 M95 94 H103 M95 98 H103" stroke="#c99b76" stroke-width="1.2" opacity=".7"/>
    <circle cx="45" cy="33" r="3" fill="#ffd27f" stroke="#241811" stroke-width="1.4"/>
    <path d="M44 40 Q56 30 76 32" fill="none" stroke="#fff1e0" stroke-width="2" opacity=".3"/>
  </g>`;
};

const packedBed = (phase: number, frame: number): string => {
  const drift = [0, 1, 2, 3]
    .map((index) => {
      const age = ((frame + index * 2) % 8) / 8;
      const x = 40 + index * 14 + Math.sin(phase + index) * 1.6;
      return `<path d="M${fixed(x)} ${fixed(92 - age * 48)} v-5" stroke="#e8d3a8" stroke-width="1.6" opacity="${fixed(0.55 - age * 0.4)}"/>`;
    })
    .join("");
  const pellets = Array.from({ length: 18 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const x = 39 + column * 10 + (row % 2) * 5;
    const y = 55 + row * 12;
    return `<circle cx="${x}" cy="${y}" r="4.2" fill="#7a5a33" stroke="#3f2d18" stroke-width="1.3"/><circle cx="${x - 1.4}" cy="${y - 1.4}" r="1.3" fill="#b0854a" opacity=".8"/>`;
  }).join("");
  return `<g filter="url(#shadow)">
    ${machineBase("#b0854a")}
    <path d="M27 40 L36 30 H92 L101 40 V97 Q97 105 89 105 H39 Q30 104 27 97Z" fill="url(#body)" ${outline}/>
    <path d="M33 45 H95 V92 Q92 98 86 99 H42 Q36 98 33 92Z" fill="#1c1710" stroke="#b0854a" stroke-width="1.7"/>
    <path d="M33 50 H95 M33 87 H95" stroke="#6d5430" stroke-width="2.4"/>
    ${pellets}${drift}
    <path d="M27 58 H15 V86 H28 M101 52 H113 V80 H100" fill="none" stroke="#5f5138" stroke-width="7"/>
    <path d="M27 58 H15 V86 H28 M101 52 H113 V80 H100" fill="none" stroke="#bda887" stroke-width="1.3"/>
    <rect x="48" y="20" width="32" height="10" rx="3" fill="#33291a" ${outline}/>
    <path d="M52 25 H76" stroke="#c8ad82" stroke-width="1.4" opacity=".75"/>
    <circle cx="38" cy="37" r="3" fill="#e9d27f" stroke="#231b10" stroke-width="1.4"/>
    <path d="M36 42 Q54 33 78 35" fill="none" stroke="#f6ecd8" stroke-width="2" opacity=".3"/>
  </g>`;
};

const catalyticBurner = (phase: number, frame: number): string => {
  const flicker = 0.55 + (Math.sin(phase * 2) + 1) * 0.2;
  const flames = [0, 1, 2, 3]
    .map((index) => {
      const x = 50 + index * 9;
      const lick = Math.sin(phase * 2 + index * 1.6) * 4;
      return `<path d="M${x} 78 Q${fixed(x + lick)} ${fixed(66 - Math.abs(lick))} ${x} ${fixed(58 - Math.abs(lick) * 1.4)}" fill="none" stroke="#ffb168" stroke-width="2.6" opacity="${fixed(0.5 + (index % 2) * 0.24)}"/>`;
    })
    .join("");
  const spark = ((frame + 3) % 8) / 8;
  return `<g filter="url(#shadow)">
    ${machineBase("#f56262")}
    <path d="M34 96 L46 33 H82 L94 96 Q90 104 82 105 H46 Q38 104 34 96Z" fill="url(#body)" ${outline}/>
    <path d="M46 40 H82 L88 90 H40Z" fill="#200d0d" stroke="#f56262" stroke-width="1.7"/>
    <path d="M44 52 H84 M43 62 H85" stroke="#95403c" stroke-width="1.6" opacity=".85"/>
    <path d="M42 47 H86" stroke="#ffd9a1" stroke-width="3.4" opacity="${fixed(flicker)}" filter="url(#soft-glow)"/>
    <path d="M44 47 l4 -3 M52 47 l4 -3 M60 47 l4 -3 M68 47 l4 -3 M76 47 l4 -3 M84 47 l-2 -3" stroke="#f2b98a" stroke-width="1.2" opacity=".8"/>
    ${flames}
    <circle cx="${fixed(64 + Math.sin(phase) * 3)}" cy="${fixed(84 - spark * 30)}" r="${fixed(1.2 + spark)}" fill="#ffd9a1" opacity="${fixed(0.8 - spark * 0.5)}"/>
    <path d="M46 33 H82 V21 Q73 15 64 15 Q55 15 46 21Z" fill="#3a2020" ${outline}/>
    <path d="M52 21 H76" stroke="#e59a9a" stroke-width="1.4" opacity=".7"/>
    <path d="M34 68 H21 V90 H36 M94 68 H107 V90 H92" fill="none" stroke="#6b4444" stroke-width="7"/>
    <path d="M34 68 H21 V90 H36 M94 68 H107 V90 H92" fill="none" stroke="#c99a9a" stroke-width="1.3"/>
    <circle cx="64" cy="26" r="3" fill="#ffd27f" stroke="#2a1616" stroke-width="1.4"/>
    <path d="M50 28 Q64 20 80 26" fill="none" stroke="#ffe9e0" stroke-width="2" opacity=".3"/>
  </g>`;
};

const absorberColumn = (phase: number, frame: number): string => {
  const droplets = [0, 1, 2, 3, 4]
    .map((index) => {
      const age = ((frame + index * 2) % 8) / 8;
      const x = 52 + (index % 3) * 10 + Math.sin(phase + index) * 1.5;
      return `<circle cx="${fixed(x)}" cy="${fixed(32 + age * 52)}" r="${fixed(1.1 + age * 0.7)}" fill="#a9d9ff" opacity="${fixed(0.85 - age * 0.4)}"/>`;
    })
    .join("");
  const pool = Math.sin(phase) * 1.6;
  return `<g filter="url(#shadow)">
    ${machineBase("#62aef5")}
    <path d="M44 22 Q44 12 64 11 Q84 12 84 22 V96 Q81 104 73 105 H55 Q47 104 44 96Z" fill="url(#body)" ${outline}/>
    <path d="M49 26 H79 V92 Q76 98 70 99 H58 Q52 98 49 92Z" fill="#0e1c2b" stroke="#62aef5" stroke-width="1.7"/>
    <path d="M49 38 H79 M49 50 H79 M49 62 H79 M49 74 H79" stroke="#33608c" stroke-width="2.4"/>
    <path d="M52 38 l3 3 M62 38 l3 3 M72 38 l3 3 M52 50 l3 3 M62 50 l3 3 M72 50 l3 3 M52 62 l3 3 M62 62 l3 3 M72 62 l3 3" stroke="#5b87b0" stroke-width="1.2" opacity=".7"/>
    ${droplets}
    <path d="M49 ${fixed(84 + pool)} Q64 ${fixed(80 - pool)} 79 ${fixed(84 + pool)} V92 Q76 98 70 99 H58 Q52 98 49 92Z" fill="#2c6ea8" opacity=".65"/>
    <path d="M44 30 H30 V58 H45 M84 78 H100 V96 H85" fill="none" stroke="#41586b" stroke-width="7"/>
    <path d="M44 30 H30 V58 H45 M84 78 H100 V96 H85" fill="none" stroke="#9dbdd4" stroke-width="1.3"/>
    <path d="M64 11 V4" stroke="#8fa4b5" stroke-width="5"/><path d="M64 11 V4" stroke="#2a3a48" stroke-width="1.8"/>
    <circle cx="49" cy="21" r="3" fill="#a5e1ff" stroke="#152331" stroke-width="1.4"/>
    <path d="M50 24 Q62 16 76 20" fill="none" stroke="#e2f3ff" stroke-width="2" opacity=".3"/>
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
  fluorine_cell: {
    label: "Fluorine recovery cell",
    palette: {
      dark: "#4a4e25",
      body: "#777b3e",
      light: "#c9cc87",
      accent: "#e5ef62",
      glow: "#f4ff9a",
    },
    render: fluorineCell,
    frameSize: MACHINE_FRAME_SIZE,
  },
  catalytic_reactor: {
    label: "Catalytic reactor",
    palette: {
      dark: "#5a3620",
      body: "#8f5a36",
      light: "#d8a678",
      accent: "#e0824f",
      glow: "#ffbd8a",
    },
    render: catalyticReactor,
    frameSize: MACHINE_FRAME_SIZE,
  },
  packed_bed: {
    label: "Packed bed",
    palette: {
      dark: "#4c3a1f",
      body: "#7c6136",
      light: "#cbb282",
      accent: "#b0854a",
      glow: "#e8d3a8",
    },
    render: packedBed,
    frameSize: MACHINE_FRAME_SIZE,
  },
  catalytic_burner: {
    label: "Catalytic burner",
    palette: {
      dark: "#5c2626",
      body: "#94413d",
      light: "#dc9a91",
      accent: "#f56262",
      glow: "#ffb168",
    },
    render: catalyticBurner,
    frameSize: MACHINE_FRAME_SIZE,
  },
  absorber_column: {
    label: "Absorber column",
    palette: {
      dark: "#24435e",
      body: "#3f6c96",
      light: "#9cc3e0",
      accent: "#62aef5",
      glow: "#a9d9ff",
    },
    render: absorberColumn,
    frameSize: MACHINE_FRAME_SIZE,
  },
} satisfies Record<string, SpriteSheetDesign>;
