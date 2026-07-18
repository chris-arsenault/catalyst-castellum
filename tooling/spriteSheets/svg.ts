export const FRAME_SIZE = 96;
export const FRAME_COUNT = 8;
export const RENDER_SCALE = 2;

export interface SpritePalette {
  dark: string;
  body: string;
  light: string;
  accent: string;
  glow: string;
}

export type SpriteFrame = (phase: number, frame: number) => string;

export interface SpriteSheetOptions {
  frameCount?: number;
  frameSize?: number;
}

const paintDefinitions = (palette: SpritePalette, frameSize: number): string => `
  <linearGradient id="body" x1="0" y1="0" x2="0.9" y2="1">
    <stop offset="0" stop-color="${palette.light}"/>
    <stop offset="0.48" stop-color="${palette.body}"/>
    <stop offset="1" stop-color="${palette.dark}"/>
  </linearGradient>
  <linearGradient id="shell" x1="0.12" y1="0" x2="0.84" y2="1">
    <stop offset="0" stop-color="${palette.light}"/>
    <stop offset="0.22" stop-color="${palette.body}"/>
    <stop offset="0.7" stop-color="${palette.dark}"/>
    <stop offset="1" stop-color="#111c1a"/>
  </linearGradient>
  <radialGradient id="glow">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
    <stop offset="0.28" stop-color="${palette.glow}" stop-opacity="0.9"/>
    <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="shadow" x="-40%" y="-40%" width="180%" height="190%">
    <feDropShadow dx="0" dy="2.5" stdDeviation="2.4" flood-color="#020908" flood-opacity="0.76"/>
  </filter>
  <filter id="soft-glow" x="-70%" y="-70%" width="240%" height="240%">
    <feGaussianBlur stdDeviation="2.2" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <clipPath id="frame-clip"><rect width="${frameSize}" height="${frameSize}"/></clipPath>`;

export const renderSpriteSheetSvg = (
  label: string,
  palette: SpritePalette,
  renderFrame: SpriteFrame,
  options: SpriteSheetOptions = {}
): string => {
  const frameCount = options.frameCount ?? FRAME_COUNT;
  const frameSize = options.frameSize ?? FRAME_SIZE;
  const frames = Array.from({ length: frameCount }, (_, frame) => {
    const phase = (frame / frameCount) * Math.PI * 2;
    return `<g transform="translate(${frame * frameSize} 0)" clip-path="url(#frame-clip)">
      ${renderFrame(phase, frame)}
    </g>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${frameSize * frameCount}" height="${frameSize}"
    viewBox="0 0 ${frameSize * frameCount} ${frameSize}"
    role="img" aria-label="${label} sprite sheet">
    <defs>${paintDefinitions(palette, frameSize)}</defs>
    ${frames}
  </svg>\n`;
};

export const fixed = (value: number): string => value.toFixed(2);

export const point = (x: number, y: number): string => `${fixed(x)},${fixed(y)}`;
