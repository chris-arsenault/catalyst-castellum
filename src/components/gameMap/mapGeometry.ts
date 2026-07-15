import {
  FACILITY_MAP,
  gridCellToWorldPoint,
  roomCenterWorld,
} from "../../presentation/defaultGame";
import type { GridCell, Point, RoomId, WorldPoint } from "../../game/types";
import { instance } from "../../game/world/instances";

export const VIEWPORT_WIDTH = 1120;
export const VIEWPORT_HEIGHT = 560;
export const WORLD_PIXELS_PER_UNIT = FACILITY_MAP.cellSize;
export const WORLD_MARGIN_X = 34;
export const WORLD_MARGIN_Y = 32;
export const WORLD_MAP_WIDTH = FACILITY_MAP.width * WORLD_PIXELS_PER_UNIT + WORLD_MARGIN_X * 2;
export const WORLD_MAP_HEIGHT = FACILITY_MAP.height * WORLD_PIXELS_PER_UNIT + WORLD_MARGIN_Y * 2;
export const WORLD_GROUND_Y = WORLD_MAP_HEIGHT - WORLD_MARGIN_Y;

export const FIT_ZOOM = Math.min(
  VIEWPORT_WIDTH / WORLD_MAP_WIDTH,
  VIEWPORT_HEIGHT / WORLD_MAP_HEIGHT
);

export interface CameraTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface ClientBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const colorNumber = (color: string): number => Number.parseInt(color.replace("#", ""), 16);

export const worldToMapPoint = (point: WorldPoint): Point => ({
  x: WORLD_MARGIN_X + point.x * WORLD_PIXELS_PER_UNIT,
  y: WORLD_GROUND_Y - point.elevation * WORLD_PIXELS_PER_UNIT,
});

export const mapToWorldPoint = (point: Point): WorldPoint => ({
  x: (point.x - WORLD_MARGIN_X) / WORLD_PIXELS_PER_UNIT,
  elevation: (WORLD_GROUND_Y - point.y) / WORLD_PIXELS_PER_UNIT,
});

export const worldPathToMap = (points: readonly WorldPoint[]): Point[] =>
  points.map(worldToMapPoint);

export const worldToViewportPoint = (point: WorldPoint, camera: CameraTransform): Point => {
  const map = worldToMapPoint(point);
  return { x: camera.x + map.x * camera.zoom, y: camera.y + map.y * camera.zoom };
};

export const viewportToWorldPoint = (point: Point, camera: CameraTransform): WorldPoint =>
  mapToWorldPoint({
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  });

export const worldToClientPoint = (
  point: WorldPoint,
  camera: CameraTransform,
  bounds: ClientBounds
): Point => {
  const viewport = worldToViewportPoint(point, camera);
  return {
    x: bounds.x + (viewport.x / VIEWPORT_WIDTH) * bounds.width,
    y: bounds.y + (viewport.y / VIEWPORT_HEIGHT) * bounds.height,
  };
};

export const clientToWorldPoint = (
  point: Point,
  camera: CameraTransform,
  bounds: ClientBounds
): WorldPoint =>
  viewportToWorldPoint(
    {
      x: ((point.x - bounds.x) / bounds.width) * VIEWPORT_WIDTH,
      y: ((point.y - bounds.y) / bounds.height) * VIEWPORT_HEIGHT,
    },
    camera
  );

export interface MapRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface RoomMapRect extends MapRect {
  center: Point;
}

export const gridCellMapRect = (gridCell: GridCell): MapRect => {
  const center = worldToMapPoint(gridCellToWorldPoint(gridCell));
  return {
    left: center.x - WORLD_PIXELS_PER_UNIT / 2,
    top: center.y - WORLD_PIXELS_PER_UNIT / 2,
    width: WORLD_PIXELS_PER_UNIT,
    height: WORLD_PIXELS_PER_UNIT,
  };
};

export const roomMapRect = (roomId: RoomId): RoomMapRect => {
  const bounds = instance(FACILITY_MAP.rooms, roomId, "map room").bounds;
  const topLeft = worldToMapPoint({
    x: bounds.column,
    elevation: bounds.elevation + bounds.height,
  });
  const width = bounds.width * WORLD_PIXELS_PER_UNIT;
  const height = bounds.height * WORLD_PIXELS_PER_UNIT;
  return {
    left: topLeft.x,
    top: topLeft.y,
    width,
    height,
    center: worldToMapPoint(roomCenterWorld(roomId)),
  };
};

export const initialCamera = (): CameraTransform => ({
  zoom: FIT_ZOOM,
  x: (VIEWPORT_WIDTH - WORLD_MAP_WIDTH * FIT_ZOOM) / 2,
  y: (VIEWPORT_HEIGHT - WORLD_MAP_HEIGHT * FIT_ZOOM) / 2,
});
