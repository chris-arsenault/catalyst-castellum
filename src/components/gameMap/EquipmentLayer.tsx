import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimatedSprite, Graphics, Texture } from "pixi.js";
import type { EquipmentSocketId, GameState, RoomId } from "../../game/types";
import { drawEquipmentOverlay } from "./equipmentGraphics";
import { equipmentRenderModels, type EquipmentRenderModel } from "./equipmentRenderModel";
import {
  MACHINE_SPRITE_DISPLAY_SIZE,
  loadMachineSpriteTextures,
  machineAnimationSpeed,
} from "./machineSprites";

const MACHINE_ANCHOR = { x: 0.5, y: 0.875 };

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
  const [loaded, setLoaded] = useState<{
    equipmentId: typeof model.equipmentId;
    frames: Texture[];
  } | null>(null);
  useEffect(() => {
    let mounted = true;
    loadMachineSpriteTextures(model.equipmentId).then((frames) => {
      if (mounted) setLoaded({ equipmentId: model.equipmentId, frames });
    });
    return () => {
      mounted = false;
    };
  }, [model.equipmentId]);
  const spriteRef = useRef<AnimatedSprite | null>(null);
  const enabledRef = useRef(model.enabled);
  const startFrame = useRef((model.roomId.length + model.socketId.length) % 8);
  const configureSprite = useCallback((sprite: AnimatedSprite | null) => {
    spriteRef.current = sprite;
    if (!sprite) return;
    if (enabledRef.current) sprite.gotoAndPlay(startFrame.current);
    else sprite.gotoAndStop(0);
  }, []);
  useEffect(() => {
    enabledRef.current = model.enabled;
    const sprite = spriteRef.current;
    if (!sprite) return;
    if (model.enabled) sprite.gotoAndPlay(startFrame.current);
    else sprite.gotoAndStop(0);
  }, [model.enabled]);
  const draw = useCallback((graphics: Graphics) => drawEquipmentOverlay(graphics, model), [model]);
  const frames = loaded?.equipmentId === model.equipmentId ? loaded.frames : null;
  return (
    <pixiContainer x={model.x} y={model.y}>
      {frames ? (
        <pixiAnimatedSprite
          ref={configureSprite}
          textures={frames}
          autoPlay={false}
          loop
          animationSpeed={machineAnimationSpeed(model.equipmentId)}
          anchor={MACHINE_ANCHOR}
          width={MACHINE_SPRITE_DISPLAY_SIZE}
          height={MACHINE_SPRITE_DISPLAY_SIZE}
          eventMode="none"
        />
      ) : null}
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
        y={-101}
        anchor={{ x: 0.5, y: 0.5 }}
        eventMode="none"
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 7,
          fontWeight: "700",
          fill: "#c8d8cf",
          letterSpacing: 0.35,
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
