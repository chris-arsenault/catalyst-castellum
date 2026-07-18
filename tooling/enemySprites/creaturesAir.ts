import { fixed, point, type SpriteFrame } from "./svg";
import type { SpriteDesign } from "./creaturesGround";

const stroke = `stroke="#17221f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const shearJelly: SpriteFrame = (phase) => {
  const float = Math.sin(phase) * 2.6;
  const flap = Math.sin(phase) * 5;
  const pulse = 0.9 + Math.sin(phase) * 0.08;
  const tendrils = [-12, -4, 5, 13]
    .map((offset, index) => {
      const wave = Math.sin(phase + index * 0.9) * 5;
      return `<path d="M${48 + offset} 57 Q${fixed(45 + offset + wave)} 68 ${fixed(48 + offset - wave)} 82" fill="none" stroke="${index % 2 ? "#b99ae8" : "#7653b4"}" stroke-width="${index % 2 ? 1.4 : 2}" stroke-linecap="round" opacity=".88"/>`;
    })
    .join("");
  return `<g transform="translate(0 ${fixed(float)})" filter="url(#shadow)">
    ${tendrils}
    <path d="M45 49 Q26 ${fixed(27 - flap)} 12 43 Q25 52 43 55Z" fill="#8664ca" fill-opacity=".72" ${stroke}/>
    <path d="M51 49 Q69 ${fixed(27 + flap)} 85 43 Q72 53 52 55Z" fill="#9f7ce0" fill-opacity=".72" ${stroke}/>
    <g transform="translate(48 43) scale(${fixed(1 / pulse)} ${fixed(pulse)}) translate(-48 -43)">
      <path d="M27 50 Q27 22 48 18 Q69 22 70 50 Q60 61 48 61 Q35 60 27 50Z" fill="url(#body)" fill-opacity=".88" ${stroke}/>
      <path d="M32 41 Q37 23 49 22 Q59 25 64 38 Q49 31 32 41Z" fill="#e2d3ff" fill-opacity=".42"/>
      <ellipse cx="48" cy="43" rx="12" ry="9" fill="url(#glow)" opacity=".72" filter="url(#soft-glow)"/>
      <path d="M36 50 Q48 56 61 49" fill="none" stroke="#d9c9ff" stroke-width="1.4" opacity=".8"/>
      <circle cx="40" cy="38" r="2.4" fill="#f8ebff"/><circle cx="57" cy="38" r="2.4" fill="#f8ebff"/>
      <circle cx="40" cy="38" r="1" fill="#31214d"/><circle cx="57" cy="38" r="1" fill="#31214d"/>
    </g>
  </g>`;
};

const redlung: SpriteFrame = (phase) => {
  const breath = 1 + (Math.sin(phase - Math.PI / 2) + 1) * 0.075;
  const foot = Math.sin(phase) * 5;
  const vents = [-1, 1]
    .map((side) => {
      const x = 48 + side * 24;
      const puff = Math.max(0, Math.sin(phase + (side > 0 ? 0 : Math.PI)));
      return `<path d="M${x} 45 Q${48 + side * 34} 38 ${48 + side * 35} 28" fill="none" stroke="#a83348" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${48 + side * 36}" cy="${fixed(25 - puff * 4)}" r="${fixed(2 + puff * 2)}" fill="#f4a6a2" opacity="${fixed(0.25 + puff * 0.45)}"/>`;
    })
    .join("");
  return `<g filter="url(#shadow)">
    <path d="M35 61 Q${fixed(30 - foot)} 72 ${fixed(25 - foot)} 78 M58 62 Q${fixed(64 + foot)} 72 ${fixed(70 + foot)} 77" fill="none" stroke="#812f3f" stroke-width="3" stroke-linecap="round"/>
    ${vents}
    <g transform="translate(48 49) scale(${fixed(breath)} ${fixed(breath)}) translate(-48 -49)">
      <path d="M22 48 Q23 23 46 20 Q72 22 75 48 Q72 68 49 70 Q25 68 22 48Z" fill="url(#body)" ${stroke}/>
      <path d="M28 43 Q33 27 48 25 Q60 27 67 39 Q48 33 28 43Z" fill="#ffc0b8" opacity=".33"/>
      <path d="M48 25 C43 36 43 54 49 67 M36 28 C31 42 33 56 39 65 M60 29 C67 42 65 56 59 65" fill="none" stroke="#9f3248" stroke-width="1.5" opacity=".68"/>
      <path d="M39 49 Q48 43 58 49 Q52 59 48 60 Q43 58 39 49Z" fill="#5b2633" stroke="#f0a89c" stroke-width="1.3"/>
      <circle cx="38" cy="41" r="2.2" fill="#ffd78d"/><circle cx="59" cy="41" r="2.2" fill="#ffd78d"/>
    </g>
  </g>`;
};

const anchor: SpriteFrame = (phase) => {
  const pulse = (Math.sin(phase) + 1) / 2;
  const rotate = (phase / (Math.PI * 2)) * 8;
  const limbs = Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2 + phase * 0.04;
    const inner = point(48 + Math.cos(angle) * 16, 48 + Math.sin(angle) * 13);
    const outer = point(48 + Math.cos(angle) * 28, 48 + Math.sin(angle) * 25);
    return `<path d="M${inner} L${outer}" stroke="#3c8f8b" stroke-width="5" stroke-linecap="round"/><circle cx="${fixed(48 + Math.cos(angle) * 29)}" cy="${fixed(48 + Math.sin(angle) * 26)}" r="4" fill="#7be1d6" stroke="#173a38" stroke-width="1.5"/>`;
  }).join("");
  return `<g filter="url(#shadow)">
    <circle cx="48" cy="48" r="${fixed(31 + pulse * 3)}" fill="none" stroke="#8fffea" stroke-width="1.2" opacity="${fixed(0.12 + pulse * 0.26)}" filter="url(#soft-glow)"/>
    <g transform="rotate(${fixed(rotate)} 48 48)">${limbs}</g>
    <path d="M48 24 L65 34 L68 53 L56 69 L37 67 L27 52 L31 33Z" fill="url(#body)" ${stroke}/>
    <path d="M48 28 L60 37 L61 51 L52 61 L39 59 L34 49 L36 36Z" fill="#173f3e" stroke="#90e7de" stroke-width="1.5"/>
    <path d="M48 33 L56 45 L48 58 L40 45Z" fill="url(#glow)" stroke="#bffef5" stroke-width="1.3" filter="url(#soft-glow)"/>
    <path d="M38 32 L48 27 L57 33" fill="none" stroke="#d7fff8" stroke-width="1.5" opacity=".65"/>
    <circle cx="48" cy="45" r="2.2" fill="#f7ffff"/>
  </g>`;
};

const glowbag: SpriteFrame = (phase, frame) => {
  const float = Math.sin(phase) * 3;
  const inflate = 1 + Math.sin(phase) * 0.06;
  const bubbles = Array.from({ length: 3 }, (_, index) => {
    const age = ((frame + index * 3) % 8) / 8;
    const x = 64 + index * 5 + Math.sin(phase + index) * 2;
    const y = 54 - age * 34;
    return `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(1.5 + age * 2)}" fill="#ffe87a" opacity="${fixed(0.72 - age * 0.48)}" filter="url(#soft-glow)"/>`;
  }).join("");
  const tendrils = [-8, 0, 8]
    .map((offset, index) => {
      const sway = Math.sin(phase + index * 1.2) * 5;
      return `<path d="M${48 + offset} 64 Q${fixed(48 + offset + sway)} 73 ${fixed(45 + offset - sway)} 84" fill="none" stroke="#c5a83d" stroke-width="${index === 1 ? 2 : 1.4}" stroke-linecap="round"/>`;
    })
    .join("");
  return `<g transform="translate(0 ${fixed(float)})" filter="url(#shadow)">
    ${bubbles}${tendrils}
    <g transform="translate(48 46) scale(${fixed(1 / inflate)} ${fixed(inflate)}) translate(-48 -46)">
      <path d="M30 58 Q21 43 29 26 Q38 14 52 18 Q70 21 73 41 Q71 59 59 67 Q42 72 30 58Z" fill="url(#body)" fill-opacity=".92" ${stroke}/>
      <path d="M33 39 Q36 22 50 21 Q61 24 67 37 Q49 29 33 39Z" fill="#fff4a8" opacity=".43"/>
      <path d="M35 54 Q47 62 62 53" fill="none" stroke="#7e6a25" stroke-width="1.5" opacity=".7"/>
      <circle cx="43" cy="36" r="10" fill="url(#glow)" opacity=".75" filter="url(#soft-glow)"/>
      <circle cx="39" cy="43" r="2.1" fill="#fff7b7"/><circle cx="58" cy="43" r="2.1" fill="#fff7b7"/>
      <circle cx="39" cy="43" r=".9" fill="#463d16"/><circle cx="58" cy="43" r=".9" fill="#463d16"/>
    </g>
  </g>`;
};

export const AIR_SPRITE_DESIGNS = {
  shear_jelly: {
    label: "Shear Jelly",
    palette: {
      dark: "#593c94",
      body: "#8d6bd0",
      light: "#d0b9fb",
      accent: "#b18ae8",
      glow: "#d8c5ff",
    },
    render: shearJelly,
  },
  redlung: {
    label: "Redlung",
    palette: {
      dark: "#7b2c3d",
      body: "#d94c61",
      light: "#ff9c9f",
      accent: "#e16a70",
      glow: "#ffb69d",
    },
    render: redlung,
  },
  anchor: {
    label: "Anchor",
    palette: {
      dark: "#2d7472",
      body: "#55bbb4",
      light: "#a9eee5",
      accent: "#58d4ca",
      glow: "#a9fff4",
    },
    render: anchor,
  },
  glowbag: {
    label: "Glowbag",
    palette: {
      dark: "#76621e",
      body: "#d4bb3f",
      light: "#fff092",
      accent: "#ddc845",
      glow: "#fff18b",
    },
    render: glowbag,
  },
} satisfies Record<string, SpriteDesign>;
