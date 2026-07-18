import type { GridCell, Point, RoomId, WorldPoint } from "../../game/types";
import { gridCellToWorldPoint } from "../../game/spatial";
import { facilityModelForMap } from "../../game/world/derivedModel";
import type { WorldMap } from "../../game/world/map";
import { instance } from "../../game/world/instances";

export const VIEWPORT_WIDTH = 1120;
export const VIEWPORT_HEIGHT = 560;
export const WORLD_MARGIN_X = 34;
export const WORLD_MARGIN_Y = 32;
export const MAX_RENDER_RESOLUTION = 2;

export const mapRenderResolution = (devicePixelRatio: number | undefined): number =>
  Math.min(MAX_RENDER_RESOLUTION, Math.max(1, devicePixelRatio ?? 1));

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

export interface MapRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface RoomMapRect extends MapRect {
  center: Point;
}

export const colorNumber = (color: string): number => Number.parseInt(color.replace("#", ""), 16);

export interface MapView {
  pixelsPerUnit: number;
  mapWidth: number;
  mapHeight: number;
  groundY: number;
  fitZoom: number;
  initialCamera(): CameraTransform;
  worldToMapPoint(point: WorldPoint): Point;
  mapToWorldPoint(point: Point): WorldPoint;
  worldPathToMap(points: readonly WorldPoint[]): Point[];
  worldToViewportPoint(point: WorldPoint, camera: CameraTransform): Point;
  viewportToWorldPoint(point: Point, camera: CameraTransform): WorldPoint;
  worldToClientPoint(point: WorldPoint, camera: CameraTransform, bounds: ClientBounds): Point;
  clientToWorldPoint(point: Point, camera: CameraTransform, bounds: ClientBounds): WorldPoint;
  gridCellMapRect(gridCell: GridCell): MapRect;
  roomMapRect(roomId: RoomId): RoomMapRect;
}

const rectHelpers = (
  map: WorldMap,
  pixelsPerUnit: number,
  worldToMapPoint: (point: WorldPoint) => Point
): Pick<MapView, "gridCellMapRect" | "roomMapRect"> => ({
  gridCellMapRect: (gridCell) => {
    const center = worldToMapPoint(gridCellToWorldPoint(gridCell));
    return {
      left: center.x - pixelsPerUnit / 2,
      top: center.y - pixelsPerUnit / 2,
      width: pixelsPerUnit,
      height: pixelsPerUnit,
    };
  },
  roomMapRect: (roomId) => {
    const bounds = instance(map.rooms, roomId, "map room").bounds;
    const topLeft = worldToMapPoint({
      x: bounds.column,
      elevation: bounds.elevation + bounds.height,
    });
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bounds.width * pixelsPerUnit,
      height: bounds.height * pixelsPerUnit,
      center: worldToMapPoint(facilityModelForMap(map).roomCenterWorld(roomId)),
    };
  },
});

const createMapView = (map: WorldMap): MapView => {
  const pixelsPerUnit = map.cellSize;
  const mapWidth = map.width * pixelsPerUnit + WORLD_MARGIN_X * 2;
  const mapHeight = map.height * pixelsPerUnit + WORLD_MARGIN_Y * 2;
  const groundY = mapHeight - WORLD_MARGIN_Y;
  const fitZoom = Math.min(VIEWPORT_WIDTH / mapWidth, VIEWPORT_HEIGHT / mapHeight);

  const worldToMapPoint = (point: WorldPoint): Point => ({
    x: WORLD_MARGIN_X + point.x * pixelsPerUnit,
    y: groundY - point.elevation * pixelsPerUnit,
  });
  const mapToWorldPoint = (point: Point): WorldPoint => ({
    x: (point.x - WORLD_MARGIN_X) / pixelsPerUnit,
    elevation: (groundY - point.y) / pixelsPerUnit,
  });
  const worldToViewportPoint = (point: WorldPoint, camera: CameraTransform): Point => {
    const mapPoint = worldToMapPoint(point);
    return { x: camera.x + mapPoint.x * camera.zoom, y: camera.y + mapPoint.y * camera.zoom };
  };
  const viewportToWorldPoint = (point: Point, camera: CameraTransform): WorldPoint =>
    mapToWorldPoint({
      x: (point.x - camera.x) / camera.zoom,
      y: (point.y - camera.y) / camera.zoom,
    });

  return {
    pixelsPerUnit,
    mapWidth,
    mapHeight,
    groundY,
    fitZoom,
    initialCamera: () => ({
      zoom: fitZoom,
      x: (VIEWPORT_WIDTH - mapWidth * fitZoom) / 2,
      y: (VIEWPORT_HEIGHT - mapHeight * fitZoom) / 2,
    }),
    worldToMapPoint,
    mapToWorldPoint,
    worldPathToMap: (points) => points.map(worldToMapPoint),
    worldToViewportPoint,
    viewportToWorldPoint,
    worldToClientPoint: (point, camera, bounds) => {
      const viewport = worldToViewportPoint(point, camera);
      return {
        x: bounds.x + (viewport.x / VIEWPORT_WIDTH) * bounds.width,
        y: bounds.y + (viewport.y / VIEWPORT_HEIGHT) * bounds.height,
      };
    },
    clientToWorldPoint: (point, camera, bounds) =>
      viewportToWorldPoint(
        {
          x: ((point.x - bounds.x) / bounds.width) * VIEWPORT_WIDTH,
          y: ((point.y - bounds.y) / bounds.height) * VIEWPORT_HEIGHT,
        },
        camera
      ),
    ...rectHelpers(map, pixelsPerUnit, worldToMapPoint),
  };
};

const viewCache = new WeakMap<WorldMap, MapView>();

/** Map-derived render geometry (plan M2): the UI reads world size and transforms from the runtime Map. */
export const mapViewFor = (map: WorldMap): MapView => {
  const cached = viewCache.get(map);
  if (cached) return cached;
  const view = createMapView(map);
  viewCache.set(map, view);
  return view;
};
