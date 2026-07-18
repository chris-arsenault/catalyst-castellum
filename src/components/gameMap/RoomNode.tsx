import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { enemyRoomId } from "../../game/queries";
import type { GameState, RoomId } from "../../game/types";
import { mapViewFor } from "./mapGeometry";
import { drawRoom } from "./roomGraphics";
import { roomHitArea } from "./roomHitArea";
import { roomRenderModel } from "./roomRenderModel";
import { coreIntegrityColor } from "./coreDamageModel";
import { CoreSprite } from "./CoreSprite";

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
  const geometry = mapViewFor(game.map).roomMapRect(roomId);
  const occupied = game.enemies.filter((enemy) => enemyRoomId(enemy, game) === roomId).length;
  const model = roomRenderModel(game, roomId, selected, occupied);
  const hitArea = roomHitArea(model);
  const draw = useCallback((graphics: Graphics) => drawRoom(graphics, model), [model]);
  return (
    <pixiContainer x={geometry.center.x} y={geometry.center.y} eventMode="passive">
      {model.structure === "core" && <CoreSprite integrity={game.coreIntegrity} />}
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
          x={model.width / 2 - 55}
          y={-model.height / 2 + 36}
          style={{
            fontFamily: "IBM Plex Mono",
            fontSize: 13,
            fontWeight: "700",
            fill: coreIntegrityColor(game.coreIntegrity),
          }}
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
