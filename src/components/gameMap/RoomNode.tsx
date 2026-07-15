import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { enemyRoomId } from "../../game/queries";
import type { GameState, RoomId } from "../../game/types";
import { roomMapRect } from "./mapGeometry";
import { drawRoom } from "./roomGraphics";
import { roomHitArea } from "./roomHitArea";
import { roomRenderModel } from "./roomRenderModel";

interface RoomNodeProps {
  game: GameState;
  roomId: RoomId;
  selected: boolean;
  onHover: (roomId: RoomId | null) => void;
  onSelect: (roomId: RoomId) => void;
  onPipeDragStart: (roomId: RoomId) => void;
  onPipeDragEnd: (roomId: RoomId) => void;
  pipeMode: boolean;
}

export const RoomNode = ({
  game,
  roomId,
  selected,
  onHover,
  onSelect,
  onPipeDragStart,
  onPipeDragEnd,
  pipeMode,
}: RoomNodeProps) => {
  const geometry = roomMapRect(roomId);
  const occupied = game.enemies.filter((enemy) => enemyRoomId(enemy) === roomId).length;
  const model = roomRenderModel(game, roomId, selected, occupied);
  const hitArea = roomHitArea(model);
  const draw = useCallback((graphics: Graphics) => drawRoom(graphics, model), [model]);
  return (
    <pixiContainer x={geometry.center.x} y={geometry.center.y} eventMode="passive">
      <pixiGraphics
        draw={draw}
        hitArea={hitArea}
        eventMode="static"
        cursor={pipeMode ? "crosshair" : "pointer"}
        onPointerOver={() => onHover(roomId)}
        onPointerOut={() => onHover(null)}
        onPointerTap={() => onSelect(roomId)}
        onPointerDown={() => {
          if (pipeMode) onPipeDragStart(roomId);
        }}
        onPointerUp={() => {
          if (pipeMode) onPipeDragEnd(roomId);
        }}
      />
      {model.structure === "core" && (
        <pixiText
          text={`${Math.round(game.coreIntegrity)}%`}
          eventMode="none"
          anchor={{ x: 0.5, y: 0.5 }}
          y={10}
          style={{ fontFamily: "IBM Plex Sans", fontSize: 16, fontWeight: "600", fill: "#eef3c2" }}
        />
      )}
      {occupied > 0 && (
        <pixiText
          text={`×${occupied}`}
          eventMode="none"
          anchor={{ x: 1, y: 0 }}
          x={model.width / 2 - 10}
          y={-model.height / 2 + 8}
          style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: "700", fill: "#fff3dc" }}
        />
      )}
    </pixiContainer>
  );
};
