import { useCallback, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  FIT_ZOOM,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
  initialCamera,
} from "./mapGeometry";

import type { CameraTransform } from "./mapGeometry";

export const MAP_DRAG_THRESHOLD_CSS_PIXELS = 6;

interface PointerGesture {
  pointerId: number;
  originX: number;
  originY: number;
  lastX: number;
  lastY: number;
  dragging: boolean;
}

const clampAxis = (offset: number, viewport: number, world: number): number => {
  if (world <= viewport) return (viewport - world) / 2;
  return Math.min(0, Math.max(viewport - world, offset));
};

const clampCamera = (camera: CameraTransform): CameraTransform => ({
  ...camera,
  x: clampAxis(camera.x, VIEWPORT_WIDTH, WORLD_MAP_WIDTH * camera.zoom),
  y: clampAxis(camera.y, VIEWPORT_HEIGHT, WORLD_MAP_HEIGHT * camera.zoom),
});

export const useMapCamera = () => {
  const [camera, setCamera] = useState<CameraTransform>(initialCamera);
  const gesture = useRef<PointerGesture | null>(null);

  const zoomBy = useCallback((factor: number) => {
    setCamera((current) => {
      const zoom = Math.min(1.35, Math.max(FIT_ZOOM, current.zoom * factor));
      const worldCenterX = (VIEWPORT_WIDTH / 2 - current.x) / current.zoom;
      const worldCenterY = (VIEWPORT_HEIGHT / 2 - current.y) / current.zoom;
      return clampCamera({
        zoom,
        x: VIEWPORT_WIDTH / 2 - worldCenterX * zoom,
        y: VIEWPORT_HEIGHT / 2 - worldCenterY * zoom,
      });
    });
  }, []);

  const resetCamera = useCallback(() => setCamera(initialCamera()), []);
  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    },
    [zoomBy]
  );
  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    gesture.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      dragging: false,
    };
  }, []);
  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const currentGesture = gesture.current;
    if (!currentGesture || currentGesture.pointerId !== event.pointerId) return;
    if (!currentGesture.dragging) {
      const distance = Math.hypot(
        event.clientX - currentGesture.originX,
        event.clientY - currentGesture.originY
      );
      if (distance < MAP_DRAG_THRESHOLD_CSS_PIXELS) return;
      currentGesture.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const scale = VIEWPORT_WIDTH / bounds.width;
    const dx = (event.clientX - currentGesture.lastX) * scale;
    const dy = (event.clientY - currentGesture.lastY) * scale;
    currentGesture.lastX = event.clientX;
    currentGesture.lastY = event.clientY;
    setCamera((current) => clampCamera({ ...current, x: current.x + dx, y: current.y + dy }));
  }, []);
  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);
  const handleLostPointerCapture = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
  }, []);

  return {
    camera,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleLostPointerCapture,
    handleWheel,
    resetCamera,
    zoomBy,
  };
};
