import { useCallback, useEffect, useState } from "react";
import type { AnimatedSprite, Texture } from "pixi.js";
import { useOptionalEncounterSurface } from "../../application/encounterSurface";
import { coreDamageProfile, type CoreDamageState } from "./coreDamageModel";
import { CORE_SPRITE_DISPLAY_SIZE, loadCoreSpriteTextures } from "./coreSprites";

export const CoreSprite = ({ integrity }: { integrity: number }) => {
  const state = coreDamageProfile(integrity).state;
  const reducedMotion = useOptionalEncounterSurface()?.reducedMotion ?? false;
  const animate = useCallback(
    (sprite: AnimatedSprite | null) => {
      if (!sprite) return;
      if (reducedMotion) sprite.stop();
      else sprite.play();
    },
    [reducedMotion]
  );
  const [loaded, setLoaded] = useState<{ frames: Texture[]; state: CoreDamageState } | null>(null);
  useEffect(() => {
    let mounted = true;
    loadCoreSpriteTextures(state).then((frames) => {
      if (mounted) setLoaded({ frames, state });
    });
    return () => {
      mounted = false;
    };
  }, [state]);
  const frames = loaded?.state === state ? loaded.frames : null;
  if (!frames) return null;
  return (
    <pixiAnimatedSprite
      textures={frames}
      ref={animate}
      autoPlay={!reducedMotion}
      loop
      animationSpeed={0.055}
      anchor={0.5}
      width={CORE_SPRITE_DISPLAY_SIZE}
      height={CORE_SPRITE_DISPLAY_SIZE}
      eventMode="none"
    />
  );
};
