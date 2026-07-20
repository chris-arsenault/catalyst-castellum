import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import type { DefensivePostureRoomTone } from "../../application/storeTypes";

const TONE_STYLE: Record<DefensivePostureRoomTone, { color: number; glyph: string }> = {
  gain: { color: 0xc9e967, glyph: "+" },
  loss: { color: 0xf07c64, glyph: "−" },
  mixed: { color: 0xdfb65d, glyph: "±" },
  support: { color: 0xd0a85b, glyph: "~" },
};

export const DefensePostureMarker = ({
  x,
  y,
  tone,
}: {
  x: number;
  y: number;
  tone: DefensivePostureRoomTone;
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
