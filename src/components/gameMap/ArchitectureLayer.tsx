import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimatedSprite, Texture } from "pixi.js";
import type { GameState } from "../../game/types";
import {
  ARCHITECTURE_TRANSITION_FRAME_COUNT,
  loadArchitectureSpriteTextures,
  type ArchitectureSpriteId,
} from "./architectureSprites";
import {
  doorArchitectureModels,
  staticArchitectureModels,
  type ArchitectureSpriteModel,
  type DoorSpriteModel,
} from "./architectureRenderModel";

const useArchitectureFrames = (assetId: ArchitectureSpriteId): Texture[] | null => {
  const [loaded, setLoaded] = useState<{ assetId: ArchitectureSpriteId; frames: Texture[] } | null>(
    null
  );
  useEffect(() => {
    let mounted = true;
    loadArchitectureSpriteTextures(assetId).then((frames) => {
      if (mounted) setLoaded({ assetId, frames });
    });
    return () => {
      mounted = false;
    };
  }, [assetId]);
  return loaded?.assetId === assetId ? loaded.frames : null;
};

const StaticArchitectureSprite = ({ model }: { model: ArchitectureSpriteModel }) => {
  const frames = useArchitectureFrames(model.assetId);
  const texture = frames?.[0];
  if (!texture) return null;
  return (
    <pixiSprite
      texture={texture}
      anchor={0.5}
      x={model.x}
      y={model.y}
      width={model.width}
      height={model.height}
      rotation={model.rotation}
      eventMode="none"
    />
  );
};

const DoorArchitectureSprite = ({ model }: { model: DoorSpriteModel }) => {
  const frames = useArchitectureFrames(model.assetId);
  const spriteRef = useRef<AnimatedSprite | null>(null);
  const openRef = useRef(model.open);
  const previousOpen = useRef(model.open);
  useEffect(() => {
    openRef.current = model.open;
  }, [model.open]);
  const setSprite = useCallback((sprite: AnimatedSprite | null) => {
    spriteRef.current = sprite;
    sprite?.gotoAndStop(openRef.current ? ARCHITECTURE_TRANSITION_FRAME_COUNT - 1 : 0);
  }, []);
  useEffect(() => {
    if (previousOpen.current === model.open) return;
    const sprite = spriteRef.current;
    const wasOpen = previousOpen.current;
    previousOpen.current = model.open;
    if (!sprite) return;
    sprite.loop = false;
    sprite.animationSpeed = model.open ? 0.28 : -0.28;
    sprite.gotoAndPlay(wasOpen ? ARCHITECTURE_TRANSITION_FRAME_COUNT - 1 : 0);
  }, [model.open]);
  if (!frames) return null;
  return (
    <pixiAnimatedSprite
      ref={setSprite}
      textures={frames}
      autoPlay={false}
      loop={false}
      anchor={0.5}
      x={model.x}
      y={model.y}
      width={model.width}
      height={model.height}
      rotation={model.rotation}
      eventMode="none"
    />
  );
};

export const FacilityStructureLayer = ({ game }: { game: GameState }) => {
  const models = useMemo(() => staticArchitectureModels(game.map), [game.map]);
  return (
    <>
      {models.map((model) => (
        <StaticArchitectureSprite key={model.id} model={model} />
      ))}
    </>
  );
};

export const FacilityDoorLayer = ({ game }: { game: GameState }) => {
  const models = useMemo(
    () => doorArchitectureModels(game.map, game.portalStates),
    [game.map, game.portalStates]
  );
  return (
    <>
      {models.map((model) => (
        <DoorArchitectureSprite key={model.id} model={model} />
      ))}
    </>
  );
};
