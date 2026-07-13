import { useCallback, useMemo } from "react";
import type { Graphics } from "pixi.js";
import type { RoomId } from "../../game/types";
import { layoutMapLabels, type MapLabelPlacement } from "./labelLayout";

const drawLabels = (graphics: Graphics, labels: readonly MapLabelPlacement[]): void => {
  graphics.clear();
  for (const label of labels) {
    graphics
      .roundRect(label.left, label.top, label.width, label.height, 4)
      .fill({ color: 0x07100d, alpha: label.selected ? 0.96 : 0.88 })
      .stroke({
        color: label.selected ? 0xe7f76f : 0x4d7969,
        width: label.selected ? 2.5 : 1.5,
        alpha: 0.96,
      });
  }
};

export const MapLabelLayer = ({ selectedRoomId }: { selectedRoomId: RoomId }) => {
  const labels = useMemo(() => layoutMapLabels(selectedRoomId), [selectedRoomId]);
  const draw = useCallback((graphics: Graphics) => drawLabels(graphics, labels), [labels]);
  return (
    <pixiContainer eventMode="none">
      <pixiGraphics draw={draw} eventMode="none" />
      {labels.map((label) => (
        <pixiText
          key={label.roomId}
          text={label.text.toUpperCase()}
          x={label.left + 8}
          y={label.top + label.height / 2}
          anchor={{ x: 0, y: 0.5 }}
          eventMode="none"
          style={{
            fontFamily: "IBM Plex Mono, ui-monospace, monospace",
            fontSize: label.fontSize,
            fontWeight: "800",
            fill: label.selected ? "#effb9e" : "#c8ded1",
            letterSpacing: 0.35,
          }}
        />
      ))}
    </pixiContainer>
  );
};
