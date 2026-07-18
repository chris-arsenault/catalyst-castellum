import { fixed, type SpriteFrame, type SpritePalette } from "./svg";

export interface SpriteDesign {
  label: string;
  palette: SpritePalette;
  render: SpriteFrame;
}

const stroke = `stroke="#17221f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const deckmouth: SpriteFrame = (phase) => {
  const bob = Math.sin(phase * 2) * 1.15;
  const stride = Math.sin(phase) * 7;
  const jaw = 1 + Math.max(0, Math.sin(phase - 0.7)) * 0.16;
  return `<g transform="translate(0 ${fixed(bob)})" filter="url(#shadow)">
    <g fill="none" ${stroke}>
      <path d="M31 57 Q${fixed(22 - stride)} 67 ${fixed(18 - stride)} 76"/>
      <path d="M39 60 Q${fixed(34 + stride)} 71 ${fixed(30 + stride)} 80"/>
      <path d="M50 59 Q${fixed(48 - stride)} 72 ${fixed(52 - stride)} 79"/>
      <path d="M57 55 Q${fixed(63 + stride)} 67 ${fixed(68 + stride)} 73"/>
    </g>
    <path d="M20 53 C20 36 32 27 50 29 C62 30 70 38 69 51 C68 63 56 70 39 67 C27 66 20 61 20 53Z" fill="url(#body)" ${stroke}/>
    <path d="M25 43 C31 32 46 30 57 35 C50 37 45 42 42 49 C35 47 30 46 25 43Z" fill="#f2dda0" opacity=".38"/>
    <path d="M29 35 Q38 27 47 31 L44 44 Q36 42 27 47Z" fill="#c5a855" ${stroke}/>
    <path d="M45 31 Q57 30 64 39 L55 48 Q50 42 42 42Z" fill="#a98a42" ${stroke}/>
    <path d="M31 36 Q38 32 43 34" fill="none" stroke="#fff2bd" stroke-width="1.4" opacity=".7"/>
    <g transform="translate(66 48) scale(1 ${fixed(jaw)})">
      <path d="M-5 -12 C8 -16 18 -8 18 2 C18 13 7 18 -4 13 C-12 9 -13 -5 -5 -12Z" fill="#d5b261" ${stroke}/>
      <ellipse cx="6" cy="2" rx="8.8" ry="10.5" fill="#251816" stroke="#6f4b32" stroke-width="2"/>
      <ellipse cx="6" cy="2" rx="4.4" ry="5.8" fill="#080b09" stroke="#e9d292" stroke-width="1.2" stroke-dasharray="2.4 2.2"/>
      <path d="M0 -9 L3 -5 M12 -8 L10 -4 M14 9 L11 6 M-1 10 L2 6" stroke="#fff0bc" stroke-width="1.5"/>
    </g>
    <path d="M62 38 Q72 28 79 31 M60 36 Q66 24 72 22" fill="none" stroke="#6f5a32" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="59" cy="40" r="2.5" fill="#ffb65c" stroke="#251816" stroke-width="1.2"/>
  </g>`;
};

const flintjack: SpriteFrame = (phase) => {
  const stride = Math.sin(phase) * 11;
  const counter = Math.sin(phase + Math.PI) * 9;
  const bob = Math.abs(Math.sin(phase)) * -2.8;
  return `<g transform="translate(0 ${fixed(bob)})" filter="url(#shadow)">
    <path d="M22 58 Q${fixed(16 + stride)} 68 ${fixed(10 + stride)} 78 M34 59 Q${fixed(31 + counter)} 72 ${fixed(25 + counter)} 82
      M55 57 Q${fixed(61 + counter)} 68 ${fixed(69 + counter)} 75 M64 52 Q${fixed(72 + stride)} 59 ${fixed(80 + stride)} 64"
      fill="none" ${stroke}/>
    <path d="M16 52 L27 34 Q42 25 63 35 L78 45 L67 61 L35 65 L18 59Z" fill="url(#body)" ${stroke}/>
    <path d="M24 45 Q43 29 65 38 L52 45 L31 51Z" fill="#ffcf9b" opacity=".42"/>
    <path d="M28 35 L40 22 L47 37 M48 32 L59 20 L63 38" fill="#c64f36" ${stroke}/>
    <path d="M63 38 L79 39 L87 47 L76 55 L63 52Z" fill="#e87a4f" ${stroke}/>
    <path d="M76 42 L87 39 L83 46 L89 50 L78 51Z" fill="#f8c37d" ${stroke}/>
    <circle cx="72" cy="44" r="2.3" fill="#fff2b4" stroke="#281815" stroke-width="1.2"/>
    <path d="M24 57 Q43 62 65 53" fill="none" stroke="#87352d" stroke-width="2" opacity=".8"/>
    <path d="M9 48 H2 M13 42 H7" stroke="#ffc0a0" stroke-width="1.4" opacity="${fixed(0.25 + Math.abs(Math.sin(phase)) * 0.5)}"/>
  </g>`;
};

const splitback: SpriteFrame = (phase) => {
  const bob = Math.sin(phase * 2) * 0.65;
  const stride = Math.sin(phase) * 4;
  const plates = [0, 1, 2, 3, 4]
    .map((plate) => {
      const x = 22 + plate * 10;
      const lift = Math.sin(phase + plate * 0.75) * 1.2;
      return `<path d="M${x} ${fixed(55 + lift)} Q${x - 3} ${fixed(33 + lift)} ${x + 7} ${fixed(28 + lift)} Q${x + 15} ${fixed(37 + lift)} ${x + 11} ${fixed(57 + lift)}Z" fill="url(#shell)" ${stroke}/>`;
    })
    .join("");
  return `<g transform="translate(0 ${fixed(bob)})" filter="url(#shadow)">
    <path d="M22 58 Q${fixed(16 - stride)} 69 ${fixed(13 - stride)} 77 M37 62 Q${fixed(34 + stride)} 72 ${fixed(30 + stride)} 80
      M57 60 Q${fixed(62 - stride)} 70 ${fixed(67 - stride)} 77 M69 55 Q${fixed(75 + stride)} 65 ${fixed(81 + stride)} 68" fill="none" ${stroke}/>
    <path d="M15 55 Q17 38 29 31 Q51 18 73 37 Q82 45 78 58 Q54 70 26 64Z" fill="#344b4d" ${stroke}/>
    ${plates}
    <path d="M20 49 Q43 25 70 39" fill="none" stroke="#d5edef" stroke-width="2" opacity=".42"/>
    <path d="M72 39 L84 44 L81 57 L70 59Z" fill="#668689" ${stroke}/>
    <circle cx="77" cy="46" r="2.2" fill="#f3d5a2" stroke="#15201f" stroke-width="1"/>
  </g>`;
};

const splitbackExposed: SpriteFrame = (phase) => {
  const stride = Math.sin(phase) * 10;
  const bob = Math.abs(Math.sin(phase)) * -2;
  const segments = [0, 1, 2, 3]
    .map((segment) => {
      const x = 28 + segment * 10;
      const y = 46 + Math.sin(phase + segment * 0.8) * 2;
      return `<ellipse cx="${x}" cy="${fixed(y)}" rx="9" ry="12" fill="${segment % 2 ? "#b47f72" : "#d4a18e"}" stroke="#3c2928" stroke-width="1.5"/>`;
    })
    .join("");
  return `<g transform="translate(0 ${fixed(bob)})" filter="url(#shadow)">
    <path d="M23 55 Q${fixed(17 - stride)} 67 ${fixed(12 - stride)} 76 M36 57 Q${fixed(33 + stride)} 71 ${fixed(28 + stride)} 80
      M58 56 Q${fixed(63 - stride)} 69 ${fixed(70 - stride)} 77 M68 52 Q${fixed(76 + stride)} 62 ${fixed(83 + stride)} 66" fill="none" stroke="#69463e" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 51 Q25 33 44 32 Q65 31 77 46 Q72 62 51 65 Q29 65 18 51Z" fill="#9a665f" ${stroke}/>
    ${segments}
    <path d="M27 39 Q47 28 68 41" fill="none" stroke="#f7d1bd" stroke-width="2.2" opacity=".7"/>
    <path d="M69 39 L82 44 L79 55 L68 57Z" fill="#b27668" ${stroke}/>
    <circle cx="76" cy="46" r="2.4" fill="#ffe08a" stroke="#2a1c1b" stroke-width="1"/>
    <path d="M35 27 L29 19 M48 27 L50 17 M61 30 L68 22" stroke="#93abad" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
  </g>`;
};

const clatter: SpriteFrame = (phase) => {
  const reach = Math.sin(phase) * 10;
  const bodyTilt = Math.sin(phase) * 3;
  const legAnchors: ReadonlyArray<readonly [number, number, number, number]> = [
    [30, 45, -1, reach],
    [37, 51, -1, -reach],
    [55, 51, 1, reach],
    [62, 44, 1, -reach],
  ];
  const legs = legAnchors
    .map(([x, y, side, delta], index) => {
      const kneeX = x + side * (13 + delta * 0.35);
      const footX = x + side * (24 + delta);
      const footY = index % 2 ? 77 : 23;
      const hookY = footY + (index % 2 ? -5 : 5);
      return `<path d="M${x} ${y} L${fixed(kneeX)} ${index % 2 ? 64 : 34} L${fixed(footX)} ${footY} L${fixed(footX - side * 5)} ${hookY}" fill="none" stroke="#4f793a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${x} ${y} L${fixed(kneeX)} ${index % 2 ? 64 : 34}" stroke="#d6f194" stroke-width="1" opacity=".55"/>`;
    })
    .join("");
  return `<g transform="rotate(${fixed(bodyTilt)} 48 49)" filter="url(#shadow)">
    ${legs}
    <path d="M26 47 Q29 31 45 28 Q64 29 70 46 L62 62 Q45 69 29 58Z" fill="url(#body)" ${stroke}/>
    <path d="M31 42 Q45 28 63 39 L55 45 L36 48Z" fill="#def6a5" opacity=".38"/>
    <path d="M31 37 L28 25 L38 33 M58 34 L65 23 L64 39" fill="#789f48" ${stroke}/>
    <path d="M61 38 L77 43 L72 55 L60 57Z" fill="#89b656" ${stroke}/>
    <circle cx="69" cy="44" r="2.2" fill="#ffe780" stroke="#1d291a" stroke-width="1"/>
    <path d="M70 48 L83 42 M70 51 L83 55" stroke="#99c568" stroke-width="1.4" stroke-linecap="round"/>
  </g>`;
};

export const GROUND_SPRITE_DESIGNS = {
  deckmouth: {
    label: "Deckmouth",
    palette: {
      dark: "#715a2f",
      body: "#c3a351",
      light: "#f3df9b",
      accent: "#b85f37",
      glow: "#ffc76c",
    },
    render: deckmouth,
  },
  flintjack: {
    label: "Flintjack",
    palette: {
      dark: "#71312b",
      body: "#dc6547",
      light: "#ffc29b",
      accent: "#ff6a44",
      glow: "#ffd18b",
    },
    render: flintjack,
  },
  splitback: {
    label: "Splitback armored phase",
    palette: {
      dark: "#3f5b5e",
      body: "#789da0",
      light: "#c2d9d9",
      accent: "#cf9d70",
      glow: "#e6d4a9",
    },
    render: splitback,
  },
  splitback_exposed: {
    label: "Splitback exposed phase",
    palette: {
      dark: "#714a46",
      body: "#b2786c",
      light: "#efc2aa",
      accent: "#c58c72",
      glow: "#ffe2a0",
    },
    render: splitbackExposed,
  },
  clatter: {
    label: "Clatter",
    palette: {
      dark: "#456531",
      body: "#82ad4f",
      light: "#d2ef93",
      accent: "#9abd59",
      glow: "#efffa0",
    },
    render: clatter,
  },
} satisfies Record<string, SpriteDesign>;
