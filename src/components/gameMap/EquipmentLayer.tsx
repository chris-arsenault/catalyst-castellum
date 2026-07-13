import { useCallback, useMemo } from "react";
import type { Graphics } from "pixi.js";
import type { EquipmentSocketId, GameState, RoomId } from "../../game/types";
import { drawEquipmentMarker } from "./equipmentGraphics";
import { equipmentRenderModels, type EquipmentRenderModel } from "./equipmentRenderModel";

export interface EquipmentHover {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}

interface EquipmentMarkerProps {
  model: EquipmentRenderModel;
  onHover: (equipment: EquipmentHover | null) => void;
  onSelectRoom: (roomId: RoomId) => void;
}

const EquipmentMarker = ({ model, onHover, onSelectRoom }: EquipmentMarkerProps) => {
  const draw = useCallback((graphics: Graphics) => drawEquipmentMarker(graphics, model), [model]);
  return (
    <pixiContainer x={model.x} y={model.y}>
      <pixiGraphics
        draw={draw}
        eventMode="static"
        cursor="help"
        onPointerOver={() => onHover({ roomId: model.roomId, socketId: model.socketId })}
        onPointerOut={() => onHover(null)}
        onPointerTap={() => onSelectRoom(model.roomId)}
      />
      <pixiText
        text={model.code}
        x={0}
        y={-10}
        anchor={{ x: 0.5, y: 0.5 }}
        eventMode="none"
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 8,
          fontWeight: "900",
          fill: "#dcebe1",
          letterSpacing: 0.5,
        }}
      />
    </pixiContainer>
  );
};

interface EquipmentLayerProps {
  game: GameState;
  onHover: (equipment: EquipmentHover | null) => void;
  onSelectRoom: (roomId: RoomId) => void;
}

export const EquipmentLayer = ({ game, onHover, onSelectRoom }: EquipmentLayerProps) => {
  const models = useMemo(() => equipmentRenderModels(game), [game]);
  return (
    <>
      {models.map((model) => (
        <EquipmentMarker
          key={`${model.roomId}:${model.socketId}`}
          model={model}
          onHover={onHover}
          onSelectRoom={onSelectRoom}
        />
      ))}
    </>
  );
};
