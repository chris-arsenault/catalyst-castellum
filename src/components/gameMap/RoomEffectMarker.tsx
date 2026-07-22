import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import type { RoomEffectTone } from "../../application/storeTypes";

const TONE_STYLE: Record<RoomEffectTone, { color: number; glyph: string }> = {
  increase: { color: 0xc9e967, glyph: "↑" },
  decrease: { color: 0xf07c64, glyph: "↓" },
  steady: { color: 0x8caaa0, glyph: "→" },
};

export const RoomEffectMarker = ({
  x,
  y,
  tone,
}: {
  x: number;
  y: number;
  tone: RoomEffectTone;
}) => {
  const style = TONE_STYLE[tone];
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.circle(0, 0, 12).fill({ color: 0x07100d, alpha: 0.94 });
      graphics
        .poly([0, -9, 8, -5, 7, 4, 0, 10, -7, 4, -8, -5], true)
        .fill({ color: style.color, alpha: 0.16 })
        .stroke({ color: style.color, width: 1.5, alpha: 0.96 });
    },
    [style.color]
  );
  return (
    <pixiContainer x={x} y={y} eventMode="none">
      <pixiGraphics draw={draw} />
      <pixiText
        text={style.glyph}
        anchor={{ x: 0.5, y: 0.5 }}
        y={-1}
        style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 12,
          fontWeight: "700",
          fill: style.color,
        }}
      />
    </pixiContainer>
  );
};
