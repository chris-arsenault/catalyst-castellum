import { fixed } from "../spriteSheets/svg";
import type { SpriteSheetDesign } from "../spriteSheets/render";

export const CORE_FRAME_SIZE = 352;

type CoreSpriteState = "stable" | "worn" | "critical" | "failing";

const outline = `stroke="#13201c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
const brass = "#d6af61";

const rivet = (x: number, y: number): string =>
  `<circle cx="${x}" cy="${y}" r="2.4" fill="#d9c58d" stroke="#15201c" stroke-width="1.2"/>`;

const tank = (x: number, y: number, width: number, height: number, gas = false): string => `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${gas ? 13 : 7}" fill="url(#shell)" ${outline}/>
  <rect x="${x + 5}" y="${y + 6}" width="${width - 10}" height="${height - 12}" rx="${gas ? 8 : 4}" fill="#07120f" stroke="#365449" stroke-width="1.5"/>
  <path d="M${x + 8} ${y + 10} Q${x + width * 0.48} ${y + 3} ${x + width - 9} ${y + 11}" fill="none" stroke="#e3f0e9" stroke-width="2" opacity=".24"/>
  <rect x="${x + width * 0.27}" y="${y - 3}" width="${width * 0.46}" height="5" rx="2" fill="#1a2b25" stroke="${brass}" stroke-width="1"/>
  ${rivet(x + 4, y + 4)}${rivet(x + width - 4, y + 4)}`;

const pipe = (path: string, color: string): string => `
  <path d="${path}" fill="none" stroke="#111d19" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".88"/>`;

const exterior = (indicator: string): string => `
  <ellipse cx="176" cy="322" rx="147" ry="13" fill="#020706" opacity=".7"/>
  <path d="M60 301 L50 323 H94 M292 301 L302 323 H258" fill="none" stroke="#111d19" stroke-width="10"/>
  <path d="M60 300 L52 320 H92 M292 300 L300 320 H260" fill="none" stroke="#718f82" stroke-width="4"/>
  <g filter="url(#shadow)">
    <rect x="10" y="137" width="18" height="72" rx="6" fill="url(#shell)" ${outline}/>
    <rect x="14" y="149" width="10" height="37" rx="4" fill="#101d19" stroke="${brass}" stroke-width="1"/>
    <rect x="324" y="137" width="18" height="72" rx="6" fill="url(#shell)" ${outline}/>
    <rect x="328" y="149" width="10" height="37" rx="4" fill="#101d19" stroke="${brass}" stroke-width="1"/>
  </g>
  <path d="M28 154 H39 M28 193 H39 M313 154 H324 M313 193 H324" stroke="#a6bdb3" stroke-width="6"/>
  <circle cx="19" cy="199" r="3" fill="${indicator}"/><circle cx="333" cy="199" r="3" fill="${indicator}"/>
  <rect x="74" y="29" width="11" height="29" rx="3" fill="url(#shell)" ${outline}/>
  <rect x="93" y="29" width="11" height="29" rx="3" fill="url(#shell)" ${outline}/>
  <path d="M72 30 H87 M91 30 H106" stroke="#172720" stroke-width="5"/>
  <path d="M265 52 V21" stroke="#91aa9e" stroke-width="4"/>
  <path d="M253 21 Q265 32 277 21" fill="none" stroke="#c2d6cc" stroke-width="4"/>
  <circle cx="265" cy="22" r="3.5" fill="${indicator}" stroke="#17221f" stroke-width="1"/>`;

const hull = (): string => `
  <path d="M24 83 L50 47 H278 L329 76 V273 L302 315 H58 L24 283Z" fill="#020605" opacity=".62"/>
  <path d="M24 79 L50 43 H278 L329 72 V269 L302 311 H58 L24 279Z" fill="url(#body)" ${outline}/>
  <path d="M25 226 L58 302 H300 L327 263 V284 L303 315 H57 L23 283Z" fill="#182a24" opacity=".52"/>
  <path d="M50 45 H276 L315 68" fill="none" stroke="#e1eee8" stroke-width="3" opacity=".48"/>
  <path d="M29 83 V272 M323 78 V264" stroke="${brass}" stroke-width="3" opacity=".76"/>
  <path d="M65 45 L60 62 M118 45 L113 62 M208 45 L203 62 M269 46 L264 63" stroke="#233a31" stroke-width="3"/>
  ${rivet(34, 87)}${rivet(317, 84)}${rivet(35, 270)}${rivet(312, 266)}`;

const cutaway = (): string => `
  <path d="M38 75 L52 63 H289 L306 77 V273 L290 288 H62 L46 275Z" fill="#06100d" stroke="#8aa69a" stroke-width="2.5"/>
  <path d="M47 85 H297 V167 H47Z" fill="#0b1713" opacity=".7"/>
  <path d="M47 168 H297 V278 H47Z" fill="#08120f" opacity=".88"/>
  <path d="M50 168 H302" stroke="#1b2d26" stroke-width="7"/><path d="M51 167 H301" stroke="#9bb2a7" stroke-width="1.4" opacity=".55"/>
  <path d="M52 70 V281 M146 64 V285 M227 64 V285 M298 74 V278" stroke="#3c574b" stroke-width="2" opacity=".62"/>
  <path d="M55 278 H289" stroke="#9db3a8" stroke-width="2" opacity=".38"/>
  <path d="M53 72 H286" stroke="#dceae3" stroke-width="2" opacity=".22"/>`;

const interior = (phase: number): string => {
  const pulse = 0.66 + (Math.sin(phase) + 1) * 0.12;
  const rotation = (phase / (Math.PI * 2)) * 16;
  return `
    ${pipe("M135 115 H148 V152", "#ed9a48")}
    ${pipe("M121 237 H152 V211", "#41baf5")}
    ${pipe("M162 237 H164 V219", "#60cce4")}
    ${tank(59, 83, 76, 61, true)}
    ${tank(59, 191, 35, 74)}
    ${tank(100, 191, 35, 74)}
    <circle cx="182" cy="196" r="50" fill="#07110e" stroke="#213a31" stroke-width="5"/>
    <circle cx="182" cy="196" r="47" fill="#0d1a16" stroke="#708f82" stroke-width="3"/>
    <circle cx="182" cy="196" r="38" fill="#111d19" stroke="${brass}" stroke-width="4"/>
    <g transform="rotate(${fixed(rotation)} 182 196)">
      <path d="M212 187 A31 31 0 0 1 173 226" fill="none" stroke="#a1ddc6" stroke-width="6" opacity=".76"/>
      <path d="M165 174 A25 25 0 0 1 205 204" fill="none" stroke="#e0c771" stroke-width="5" opacity=".8"/>
      <path d="M182 163 V184 M215 196 H194 M182 229 V208 M149 196 H170" stroke="#58796b" stroke-width="3"/>
    </g>
    <circle cx="182" cy="196" r="15" fill="url(#shell)" stroke="#c4ddd1" stroke-width="2"/>
    <circle cx="182" cy="196" r="${fixed(6 + pulse * 2)}" fill="#f3e39c" opacity="${fixed(pulse)}" filter="url(#soft-glow)"/>
    <rect x="237" y="134" width="56" height="103" rx="8" fill="url(#shell)" ${outline}/>
    <rect x="242" y="140" width="46" height="91" rx="5" fill="#0b1612" stroke="#668477" stroke-width="1.4"/>
    ${Array.from({ length: 4 }, (_, index) => {
      const y = 146 + index * 22;
      return `<rect x="248" y="${y}" width="34" height="12" rx="5" fill="${index % 2 === 0 ? "#405f53" : "#324d43"}" stroke="#8ca69a" stroke-width="1"/><circle cx="254" cy="${y + 6}" r="2" fill="${index < 3 ? "#c7df80" : brass}"/>`;
    }).join("")}
    ${pipe("M228 196 H239 V225 H255", brass)}
    <path d="M285 145 V225" stroke="#d7e4dd" stroke-width="1.5" opacity=".42"/>
    <path d="M244 139 Q263 130 283 141" fill="none" stroke="#f0fff8" stroke-width="2" opacity=".22"/>
    <rect x="229" y="72" width="72" height="34" rx="5" fill="#08110e" stroke="#608276" stroke-width="2"/>
    <path d="M233 76 H296" stroke="#d9e7e0" stroke-width="1.5" opacity=".22"/>
    <circle cx="67" cy="270" r="3" fill="#d8ff81" stroke="#17221f" stroke-width="1.4"/>
    <circle cx="78" cy="270" r="3" fill="#d6af61" stroke="#17221f" stroke-width="1.4"/>
  `;
};

const damage = (state: CoreSpriteState, phase: number, frame: number): string => {
  if (state === "stable") return "";
  const scratches = `<path d="M286 52 L273 66 L280 74 M293 57 L284 68" fill="none" stroke="#171b16" stroke-width="2.5"/>`;
  if (state === "worn") return scratches;
  const breach = `${scratches}
    <path d="M31 252 L43 239 L55 248 L49 269" fill="#060b09" stroke="#b66c4c" stroke-width="2.5"/>
    <path d="M41 244 C48 253 35 259 48 269" fill="none" stroke="#e5a85f" stroke-width="2.5"/>
    <path d="M315 221 L300 229 L309 242 L294 254" fill="none" stroke="#171d19" stroke-width="3"/>`;
  if (state === "critical") return breach;
  const flash = fixed(0.48 + Math.sin(phase * 2) * 0.3);
  const smoke = Array.from({ length: 4 }, (_, index) => {
    const age = ((frame + index * 2) % 8) / 8;
    return `<circle cx="${fixed(292 + Math.sin(phase + index) * 6)}" cy="${fixed(42 - age * 28)}" r="${fixed(5 + age * 7)}" fill="#9ba49b" opacity="${fixed(0.2 - age * 0.1)}"/>`;
  }).join("");
  return `${breach}${smoke}
    <path d="M278 48 L296 41 L305 58 L286 73" fill="#050907" stroke="#d45d49" stroke-width="2.5"/>
    <circle cx="291" cy="57" r="6" fill="#ff9a55" opacity="${flash}" filter="url(#soft-glow)"/>
    <path d="M265 52 L265 30" stroke="#4e6158" stroke-width="4"/><path d="M253 21 L269 30" stroke="#a2b4ab" stroke-width="3"/>`;
};

const renderCore =
  (state: CoreSpriteState) =>
  (phase: number, frame: number): string => {
    const indicator: Record<CoreSpriteState, string> = {
      stable: "#caff83",
      worn: "#f1ca68",
      critical: "#f29a55",
      failing: "#f05d50",
    };
    return `<g filter="url(#shadow)">${exterior(indicator[state])}${hull()}${cutaway()}${interior(phase)}${damage(state, phase, frame)}</g>`;
  };

const design = (
  state: CoreSpriteState,
  palette: SpriteSheetDesign["palette"]
): SpriteSheetDesign => ({
  label: `Mobile castellum Core — ${state}`,
  palette,
  render: renderCore(state),
  frameSize: CORE_FRAME_SIZE,
});

export const CORE_SPRITE_DESIGNS = {
  stable: design("stable", {
    dark: "#294c42",
    body: "#527a6b",
    light: "#aac7ba",
    accent: "#d6af61",
    glow: "#f3e39c",
  }),
  worn: design("worn", {
    dark: "#344c41",
    body: "#667361",
    light: "#b9c3ac",
    accent: "#d1aa5b",
    glow: "#f1ca68",
  }),
  critical: design("critical", {
    dark: "#4c4033",
    body: "#74694f",
    light: "#c4b58d",
    accent: "#d28d50",
    glow: "#f29a55",
  }),
  failing: design("failing", {
    dark: "#49332e",
    body: "#6a4c42",
    light: "#b98a76",
    accent: "#d96a4e",
    glow: "#f05d50",
  }),
} satisfies Record<CoreSpriteState, SpriteSheetDesign>;
