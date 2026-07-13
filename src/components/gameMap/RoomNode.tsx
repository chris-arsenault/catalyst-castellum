import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { enemyRoomId } from "../../game/queries";
import type { GameState, RoomId } from "../../game/types";
import { roomMapRect } from "./mapGeometry";
import { drawRoom } from "./roomGraphics";
import { roomRenderModel } from "./roomRenderModel";

interface RoomNodeProps {
  game: GameState;
  roomId: RoomId;
  selected: boolean;
  onHover: (roomId: RoomId | null) => void;
  onSelect: (roomId: RoomId) => void;
}

export const RoomNode = ({ game, roomId, selected, onHover, onSelect }: RoomNodeProps) => {
  const geometry = roomMapRect(roomId);
  const occupied = game.enemies.filter((enemy) => enemyRoomId(enemy) === roomId).length;
  const model = roomRenderModel(game, roomId, selected, occupied);
  const draw = useCallback((graphics: Graphics) => drawRoom(graphics, model), [model]);
  return (
    <pixiContainer x={geometry.center.x} y={geometry.center.y} eventMode="passive">
      <pixiGraphics
        draw={draw}
        eventMode="static"
        cursor="pointer"
        onPointerOver={() => onHover(roomId)}
        onPointerOut={() => onHover(null)}
        onPointerTap={() => onSelect(roomId)}
      />
      {model.structure === "core" && (
        <pixiText
          text={`${Math.round(game.coreIntegrity)}%`}
          eventMode="none"
          anchor={{ x: 0.5, y: 0.5 }}
          y={10}
          style={{ fontFamily: "IBM Plex Mono", fontSize: 20, fontWeight: "800", fill: "#f3fbba" }}
        />
      )}
      {occupied > 0 && (
        <pixiText
          text={`×${occupied}`}
          eventMode="none"
          anchor={{ x: 1, y: 0 }}
          x={model.width / 2 - 10}
          y={-model.height / 2 + 8}
          style={{ fontFamily: "IBM Plex Mono", fontSize: 18, fontWeight: "800", fill: "#fff3dc" }}
        />
      )}
    </pixiContainer>
  );
};
