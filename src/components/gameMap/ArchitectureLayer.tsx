import { useEffect, useMemo, useState } from "react";
import type { Texture } from "pixi.js";
import type { GameState } from "../../game/types";
import { loadArchitectureSpriteTextures, type ArchitectureSpriteId } from "./architectureSprites";
import { staticArchitectureModels, type ArchitectureSpriteModel } from "./architectureRenderModel";

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
