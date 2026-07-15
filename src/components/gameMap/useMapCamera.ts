import { useCallback, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, mapViewFor } from "./mapGeometry";

import type { CameraTransform, MapView } from "./mapGeometry";
import type { WorldMap } from "../../game/world/map";

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

const clampCamera = (view: MapView, camera: CameraTransform): CameraTransform => ({
  ...camera,
  x: clampAxis(camera.x, VIEWPORT_WIDTH, view.mapWidth * camera.zoom),
  y: clampAxis(camera.y, VIEWPORT_HEIGHT, view.mapHeight * camera.zoom),
});

const panDelta = (
  currentGesture: PointerGesture | null,
  event: PointerEvent<HTMLDivElement>
): { dx: number; dy: number } | null => {
  if (!currentGesture || currentGesture.pointerId !== event.pointerId) return null;
  if (!currentGesture.dragging) {
    const distance = Math.hypot(
      event.clientX - currentGesture.originX,
      event.clientY - currentGesture.originY
    );
    if (distance < MAP_DRAG_THRESHOLD_CSS_PIXELS) return null;
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
  return { dx, dy };
};

type MapCamera = ReturnType<typeof useMapCamera>;

/**
 * Pointer wiring for the map wrapper. Pipe routing owns pointer drags while the
 * board is open, so panning is suspended there; the cursor tracker always runs.
 */
export const useMapInteractions = (
  pipeMode: boolean,
  camera: MapCamera,
  trackPointer: (event: PointerEvent<HTMLDivElement>) => void,
  clearPipeDrag: () => void
) => {
  const panAndTrack = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      trackPointer(event);
      camera.handlePointerMove(event);
    },
    [camera, trackPointer]
  );
  if (pipeMode) {
    return {
      onWheel: camera.handleWheel,
      onPointerMove: trackPointer,
      onPointerUp: clearPipeDrag,
      onPointerCancel: clearPipeDrag,
    };
  }
  return {
    onWheel: camera.handleWheel,
    onPointerDown: camera.handlePointerDown,
    onPointerMove: panAndTrack,
    onPointerUp: camera.handlePointerUp,
    onPointerCancel: camera.handlePointerUp,
    onLostPointerCapture: camera.handleLostPointerCapture,
  };
};

export const useMapCamera = (map: WorldMap) => {
  const view = mapViewFor(map);
  const [camera, setCamera] = useState<CameraTransform>(view.initialCamera);
  const gesture = useRef<PointerGesture | null>(null);

  const zoomBy = useCallback(
    (factor: number) => {
      setCamera((current) => {
        const zoom = Math.min(1.35, Math.max(view.fitZoom, current.zoom * factor));
        const worldCenterX = (VIEWPORT_WIDTH / 2 - current.x) / current.zoom;
        const worldCenterY = (VIEWPORT_HEIGHT / 2 - current.y) / current.zoom;
        return clampCamera(view, {
          zoom,
          x: VIEWPORT_WIDTH / 2 - worldCenterX * zoom,
          y: VIEWPORT_HEIGHT / 2 - worldCenterY * zoom,
        });
      });
    },
    [view]
  );

  const resetCamera = useCallback(() => setCamera(view.initialCamera()), [view]);
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
  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const pan = panDelta(gesture.current, event);
      if (!pan) return;
      setCamera((current) =>
        clampCamera(view, { ...current, x: current.x + pan.dx, y: current.y + pan.dy })
      );
    },
    [view]
  );
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
