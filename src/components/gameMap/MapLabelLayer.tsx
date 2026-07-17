import { useCallback, useMemo } from "react";
import type { Graphics } from "pixi.js";
import { facilityModelForMap } from "../../game/world/derivedModel";
import type { WorldMap } from "../../game/world/map";
import type { GameState, RoomId } from "../../game/types";
import { layoutMapLabels, type MapLabelPlacement } from "./labelLayout";
import { roomDefinition } from "../../presentation/defaultGame";

const labelAccent = (map: WorldMap, roomId: RoomId): number => {
  if (roomDefinition({ map }, roomId).structure === "core") return 0xd2b85f;
  const ring = facilityModelForMap(map).ringForRoom(roomId);
  if (ring === "inner") return 0xc49d64;
  if (ring === "middle") return 0x629db3;
  return 0x54a891;
};

const labelTextColor = (map: WorldMap, roomId: RoomId, selected: boolean): string => {
  if (selected) return "#f4f5d1";
  return `#${labelAccent(map, roomId).toString(16).padStart(6, "0")}`;
};

const drawLabels = (
  graphics: Graphics,
  map: WorldMap,
  labels: readonly MapLabelPlacement[]
): void => {
  graphics.clear();
  for (const label of labels) {
    const accent = labelAccent(map, label.roomId);
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
  const labels = useMemo(
    () => layoutMapLabels(game.map, selectedRoomId, game),
    [game, selectedRoomId]
  );
  const draw = useCallback(
    (graphics: Graphics) => drawLabels(graphics, game.map, labels),
    [game.map, labels]
  );
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
            fill: labelTextColor(game.map, label.roomId, label.selected),
            letterSpacing: 0.1,
          }}
        />
      ))}
    </pixiContainer>
  );
};
