import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { drawBackdrop, drawPipeNetwork } from "./mapGraphics";

export const MapBackdrop = () => {
  const draw = useCallback((graphics: Graphics) => drawBackdrop(graphics), []);
  return <pixiGraphics draw={draw} />;
};

export const PipeNetwork = () => {
  const draw = useCallback((graphics: Graphics) => drawPipeNetwork(graphics), []);
  return <pixiGraphics draw={draw} />;
};
