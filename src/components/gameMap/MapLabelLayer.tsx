import { useCallback, useMemo } from "react";
import type { Graphics } from "pixi.js";
import { ROOM_DEFINITIONS, facilityRingForRoom } from "../../presentation/defaultGame";
import type { GameState, RoomId } from "../../game/types";
import { layoutMapLabels, type MapLabelPlacement } from "./labelLayout";

const labelAccent = (roomId: RoomId): number => {
  if (ROOM_DEFINITIONS[roomId].structure === "core") return 0xd2b85f;
  if (facilityRingForRoom(roomId) === "inner") return 0xc49d64;
  if (facilityRingForRoom(roomId) === "middle") return 0x629db3;
  return 0x54a891;
};

const labelTextColor = (roomId: RoomId, selected: boolean): string => {
  if (selected) return "#f4f5d1";
  return `#${labelAccent(roomId).toString(16).padStart(6, "0")}`;
};

const drawLabels = (graphics: Graphics, labels: readonly MapLabelPlacement[]): void => {
  graphics.clear();
  for (const label of labels) {
    const accent = labelAccent(label.roomId);
    const cut = 6;
    graphics
      .poly([
        label.left,
        label.top,
        label.left + label.width - cut,
        label.top,
        label.left + label.width,
        label.top + cut,
        label.left + label.width,
        label.top + label.height,
        label.left,
        label.top + label.height,
      ])
      .fill({ color: 0x060c0a, alpha: label.selected ? 0.95 : 0.88 })
      .stroke({
        color: label.selected ? 0xedfaa5 : accent,
        width: label.selected ? 1.5 : 1,
        alpha: label.selected ? 0.96 : 0.7,
      });
    graphics
      .rect(label.left, label.top + 3, label.selected ? 4 : 2, label.height - 6)
      .fill({ color: label.selected ? 0xe7f76f : accent, alpha: 0.95 });
  }
};

export const MapLabelLayer = ({
  game,
  selectedRoomId,
}: {
  game: GameState;
  selectedRoomId: RoomId;
}) => {
  const labels = useMemo(() => layoutMapLabels(selectedRoomId, game), [game, selectedRoomId]);
  const draw = useCallback((graphics: Graphics) => drawLabels(graphics, labels), [labels]);
  return (
    <pixiContainer eventMode="none">
      <pixiGraphics draw={draw} eventMode="none" />
      {labels.map((label) => (
        <pixiText
          key={label.roomId}
          text={label.text}
          x={label.left + 9}
          y={label.top + label.height / 2}
          anchor={{ x: 0, y: 0.5 }}
          eventMode="none"
          style={{
            fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif",
            fontSize: label.fontSize,
            fontWeight: label.selected ? "600" : "500",
            fill: labelTextColor(label.roomId, label.selected),
            letterSpacing: 0.1,
          }}
        />
      ))}
    </pixiContainer>
  );
};
