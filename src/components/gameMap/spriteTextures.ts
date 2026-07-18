import { Assets, Rectangle, Texture } from "pixi.js";

const textureCache = new Map<string, Promise<Texture[]>>();

export const loadSpriteTextures = (
  url: string,
  frameCount: number,
  sourceFrameSize: number,
  autoGenerateMipmaps = false
): Promise<Texture[]> => {
  const cacheKey = `${url}:${frameCount}:${sourceFrameSize}:${autoGenerateMipmaps}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;
  const loading = Assets.load<Texture>({
    src: url,
    data: { autoGenerateMipmaps },
  }).then((sheet) => {
    sheet.source.scaleMode = "linear";
    return Array.from(
      { length: frameCount },
      (_, frame) =>
        new Texture({
          source: sheet.source,
          frame: new Rectangle(frame * sourceFrameSize, 0, sourceFrameSize, sourceFrameSize),
        })
    );
  });
  textureCache.set(cacheKey, loading);
  return loading;
};
