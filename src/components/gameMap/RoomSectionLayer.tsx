import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimatedSprite, Texture } from "pixi.js";
import type { FacilityPortalState } from "../../game/types";
import type { WorldMap } from "../../game/world/map";
import {
  roomClosureModels,
  roomSectionAssembly,
  type RoomClosureSpriteModel,
  type RoomSectionSpriteModel,
} from "./roomSectionRenderModel";
import {
  loadRoomSectionTextures,
  ROOM_SECTION_TRANSITION_FRAMES,
  type RoomSectionSpriteId,
} from "./roomSectionSprites";

const EMPTY_TEXTURES: ReadonlyMap<RoomSectionSpriteId, Texture[]> = new Map();

const useSectionTextures = (
  models: readonly RoomSectionSpriteModel[]
): ReadonlyMap<RoomSectionSpriteId, Texture[]> => {
  const assetKey = [...new Set(models.map(({ assetId }) => assetId))].sort().join("|");
  const assetIds = useMemo(
    () => (assetKey ? (assetKey.split("|") as RoomSectionSpriteId[]) : []),
    [assetKey]
  );
  const [loaded, setLoaded] = useState<ReadonlyMap<RoomSectionSpriteId, Texture[]>>(EMPTY_TEXTURES);
  useEffect(() => {
    let mounted = true;
    Promise.all(
      assetIds.map(async (assetId) => [assetId, await loadRoomSectionTextures(assetId)] as const)
    ).then((entries) => {
      if (mounted) setLoaded(new Map(entries));
    });
    return () => {
      mounted = false;
    };
  }, [assetIds]);
  return loaded;
};

const StaticSections = ({ models }: { models: readonly RoomSectionSpriteModel[] }) => {
  const textures = useSectionTextures(models);
  return (
    <>
      {models.map((model) => {
        const texture = textures.get(model.assetId)?.[0];
        return texture ? (
          <pixiSprite
            key={model.id}
            texture={texture}
            anchor={0.5}
            x={model.x}
            y={model.y}
            width={model.width}
            height={model.height}
            eventMode="none"
          />
        ) : null;
      })}
    </>
  );
};

export const RoomBackgroundLayer = memo(function RoomBackgroundLayer({ map }: { map: WorldMap }) {
  const models = useMemo(() => roomSectionAssembly(map).background, [map]);
  return <StaticSections models={models} />;
});

export const RoomBoundaryLayer = memo(function RoomBoundaryLayer({ map }: { map: WorldMap }) {
  const models = useMemo(() => roomSectionAssembly(map).foreground, [map]);
  return <StaticSections models={models} />;
});

const ClosureSprite = ({ frames, model }: { frames: Texture[]; model: RoomClosureSpriteModel }) => {
  const spriteRef = useRef<AnimatedSprite | null>(null);
  const openRef = useRef(model.open);
  const previousOpen = useRef(model.open);
  useEffect(() => {
    openRef.current = model.open;
  }, [model.open]);
  const setSprite = useCallback((sprite: AnimatedSprite | null) => {
    spriteRef.current = sprite;
    sprite?.gotoAndStop(openRef.current ? ROOM_SECTION_TRANSITION_FRAMES - 1 : 0);
  }, []);
  useEffect(() => {
    if (previousOpen.current === model.open) return;
    const sprite = spriteRef.current;
    const wasOpen = previousOpen.current;
    previousOpen.current = model.open;
    if (!sprite) return;
    sprite.loop = false;
    sprite.animationSpeed = model.open ? 0.3 : -0.3;
    sprite.gotoAndPlay(wasOpen ? ROOM_SECTION_TRANSITION_FRAMES - 1 : 0);
  }, [model.open]);
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
      eventMode="none"
    />
  );
};

export const RoomClosureLayer = ({
  map,
  portalStates,
}: {
  map: WorldMap;
  portalStates: Readonly<Record<string, FacilityPortalState>>;
}) => {
  const models = useMemo(() => roomClosureModels(map, portalStates), [map, portalStates]);
  const textures = useSectionTextures(models);
  return (
    <>
      {models.map((model) => {
        const frames = textures.get(model.assetId);
        return frames ? <ClosureSprite key={model.id} frames={frames} model={model} /> : null;
      })}
    </>
  );
};
