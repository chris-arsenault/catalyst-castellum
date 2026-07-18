import type { FacilityPortalState, GridCell, RoomId } from "../../game/types";
import {
  architecturalConnections,
  type ArchitecturalConnection,
  type MapRoom,
  type WorldMap,
} from "../../game/world/map";
import { instance } from "../../game/world/instances";
import { mapViewFor, type MapRect } from "./mapGeometry";
import {
  backWallModels,
  boundarySlotKey,
  hullDetailModels,
  regularBoundaryModels,
  type BoundarySide,
} from "./roomSectionRoomModels";
import { ROOM_SECTION_DISPLAY_SIZE, type RoomSectionSpriteId } from "./roomSectionSprites";

export interface RoomSectionSpriteModel {
  assetId: RoomSectionSpriteId;
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
}

export interface RoomClosureSpriteModel extends RoomSectionSpriteModel {
  open: boolean;
}

export interface RoomSectionAssembly {
  background: readonly RoomSectionSpriteModel[];
  foreground: readonly RoomSectionSpriteModel[];
}

interface PortalBoundary {
  endpoint: GridCell;
  room: MapRoom;
  roomId: RoomId;
  side: BoundarySide;
}

const section = (
  id: string,
  assetId: RoomSectionSpriteId,
  x: number,
  y: number
): RoomSectionSpriteModel => ({
  assetId,
  height: ROOM_SECTION_DISPLAY_SIZE,
  id,
  width: ROOM_SECTION_DISPLAY_SIZE,
  x,
  y,
});

const connectorBounds = (map: WorldMap, portal: ArchitecturalConnection): MapRect => {
  const view = mapViewFor(map);
  const rectangles = portal.connectorCells.map(view.gridCellMapRect);
  const left = Math.min(...rectangles.map((rect) => rect.left));
  const top = Math.min(...rectangles.map((rect) => rect.top));
  const right = Math.max(...rectangles.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rectangles.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
};

const portalBoundary = (
  map: WorldMap,
  portal: ArchitecturalConnection,
  roomIndex: 0 | 1
): PortalBoundary => {
  const roomId = portal.rooms[roomIndex];
  const room = instance(map.rooms, roomId, "portal room");
  const endpoint = portal.endpoints[roomIndex];
  if (portal.orientation === "horizontal") {
    if (endpoint.column === room.bounds.column) return { endpoint, room, roomId, side: "left" };
    if (endpoint.column === room.bounds.column + room.bounds.width - 1)
      return { endpoint, room, roomId, side: "right" };
  } else {
    if (endpoint.elevation === room.bounds.elevation)
      return { endpoint, room, roomId, side: "floor" };
    if (endpoint.elevation === room.bounds.elevation + room.bounds.height - 1)
      return { endpoint, room, roomId, side: "ceiling" };
  }
  throw new Error(`Portal ${portal.id} endpoint does not touch the ${roomId} boundary.`);
};

const sideFrameAsset = (
  side: "left" | "right",
  kind: ArchitecturalConnection["kind"],
  hull: boolean
): RoomSectionSpriteId => {
  if (kind === "core_door") return `wall_${side}_core_door`;
  if (kind === "door") return hull ? `wall_${side}_door_hull` : `wall_${side}_door`;
  return hull ? `wall_${side}_passage_hull` : `wall_${side}_passage`;
};

const horizontalFrameAsset = (
  side: "floor" | "ceiling",
  kind: ArchitecturalConnection["kind"],
  hull: boolean
): RoomSectionSpriteId => {
  const suffix = hull ? "_hull" : "";
  if (kind === "ladder_shaft") return `${side}_shaft${suffix}`;
  if (kind === "trapdoor") return `${side}_trapdoor${suffix}`;
  return `${side}_hole${suffix}`;
};

type PortalSpanVariants = readonly [RoomSectionSpriteId, RoomSectionSpriteId];

const HORIZONTAL_SPAN_ASSETS: Partial<Record<ArchitecturalConnection["kind"], PortalSpanVariants>> =
  {
    passage: ["horizontal_passage_span", "horizontal_passage_span_hull"],
    door: ["horizontal_door_span", "horizontal_door_span_hull"],
    core_door: ["horizontal_core_span", "horizontal_core_span"],
  };

const VERTICAL_SPAN_ASSETS: Partial<Record<ArchitecturalConnection["kind"], PortalSpanVariants>> = {
  ladder_shaft: ["vertical_shaft_span", "vertical_shaft_span_hull"],
  trapdoor: ["vertical_trapdoor_span", "vertical_trapdoor_span_hull"],
  floor_hole: ["vertical_hole_span", "vertical_hole_span_hull"],
};

const portalSpanAsset = (portal: ArchitecturalConnection, hull = false): RoomSectionSpriteId => {
  const assets = (
    portal.orientation === "horizontal" ? HORIZONTAL_SPAN_ASSETS : VERTICAL_SPAN_ASSETS
  )[portal.kind];
  if (!assets) throw new Error(`Portal ${portal.id} has an invalid orientation and kind.`);
  return assets[hull ? 1 : 0];
};

const portalTouchesHull = (map: WorldMap, portal: ArchitecturalConnection): boolean =>
  portal.rooms.some((roomId) => instance(map.rooms, roomId, "portal room").provenance === "hull");

const portalFrame = (
  map: WorldMap,
  portal: ArchitecturalConnection,
  boundary: PortalBoundary
): RoomSectionSpriteModel | null => {
  if (boundary.room.structure === "core" && portal.kind !== "core_door") return null;
  const view = mapViewFor(map);
  const roomRect = view.roomMapRect(boundary.roomId);
  const endpointRect = view.gridCellMapRect(boundary.endpoint);
  const hull = boundary.room.provenance === "hull";
  if (boundary.side === "left" || boundary.side === "right") {
    const x = boundary.side === "left" ? roomRect.left : roomRect.left + roomRect.width;
    return section(
      `portal-frame:${portal.id}:${boundary.roomId}`,
      sideFrameAsset(boundary.side, portal.kind, hull),
      x,
      endpointRect.top + endpointRect.height - 24
    );
  }
  return section(
    `portal-frame:${portal.id}:${boundary.roomId}`,
    horizontalFrameAsset(boundary.side, portal.kind, hull),
    endpointRect.left + endpointRect.width / 2,
    boundary.side === "floor" ? roomRect.top + roomRect.height : roomRect.top
  );
};

const consumePortalSlots = (
  consumed: Set<string>,
  portal: ArchitecturalConnection,
  boundary: PortalBoundary
): void => {
  if (boundary.room.structure === "core") return;
  if (boundary.side === "left" || boundary.side === "right") {
    for (let offset = 0; offset < 3; offset += 1) {
      const elevation = boundary.endpoint.elevation + offset;
      if (
        elevation >= boundary.room.bounds.elevation &&
        elevation < boundary.room.bounds.elevation + boundary.room.bounds.height
      )
        consumed.add(boundarySlotKey(boundary.roomId, boundary.side, elevation));
    }
    return;
  }
  for (let offset = -1; offset <= 1; offset += 1) {
    const column = boundary.endpoint.column + offset;
    if (
      column >= boundary.room.bounds.column &&
      column < boundary.room.bounds.column + boundary.room.bounds.width
    )
      consumed.add(boundarySlotKey(boundary.roomId, boundary.side, column));
  }
};

const portalInteriorModel = (
  map: WorldMap,
  portal: ArchitecturalConnection,
  cell: GridCell,
  id: string,
  assetId = portalSpanAsset(portal)
): RoomSectionSpriteModel => {
  const view = mapViewFor(map);
  const rect = view.gridCellMapRect(cell);
  const y =
    portal.orientation === "horizontal"
      ? view.worldToMapPoint({ x: 0, elevation: portal.sillElevation }).y - 24
      : rect.top + rect.height / 2;
  return section(id, assetId, rect.left + rect.width / 2, y);
};

const portalSpanModels = (map: WorldMap): RoomSectionSpriteModel[] =>
  architecturalConnections(map).flatMap((portal) =>
    portal.connectorCells.map((connector) =>
      portalInteriorModel(
        map,
        portal,
        connector,
        `portal-span:${portal.id}:${connector.column}:${connector.elevation}`,
        portalSpanAsset(portal, portalTouchesHull(map, portal))
      )
    )
  );

const portalMouthModels = (map: WorldMap): RoomSectionSpriteModel[] =>
  architecturalConnections(map).flatMap((portal) =>
    ([0, 1] as const).flatMap((roomIndex) => {
      const roomId = portal.rooms[roomIndex];
      const room = instance(map.rooms, roomId, "portal room");
      if (room.structure === "core") return [];
      const endpoint = portal.endpoints[roomIndex];
      return [
        portalInteriorModel(
          map,
          portal,
          endpoint,
          `portal-mouth:${portal.id}:${roomId}`,
          portalSpanAsset(portal, room.provenance === "hull")
        ),
      ];
    })
  );

const corePortalMouthModels = (map: WorldMap): RoomSectionSpriteModel[] =>
  architecturalConnections(map).flatMap((portal) =>
    ([0, 1] as const).flatMap((roomIndex) => {
      const roomId = portal.rooms[roomIndex];
      if (instance(map.rooms, roomId, "portal room").structure !== "core") return [];
      const endpoint = portal.endpoints[roomIndex];
      return [
        portalInteriorModel(map, portal, endpoint, `portal-core-mouth:${portal.id}:${roomId}`),
      ];
    })
  );

const assemblyCache = new WeakMap<WorldMap, RoomSectionAssembly>();

export const roomSectionAssembly = (map: WorldMap): RoomSectionAssembly => {
  const cached = assemblyCache.get(map);
  if (cached) return cached;
  const consumed = new Set<string>();
  const frames: RoomSectionSpriteModel[] = [];
  for (const portal of architecturalConnections(map)) {
    for (const roomIndex of [0, 1] as const) {
      const boundary = portalBoundary(map, portal, roomIndex);
      consumePortalSlots(consumed, portal, boundary);
      const frame = portalFrame(map, portal, boundary);
      if (frame) frames.push(frame);
    }
  }
  const assembly = {
    background: [
      ...backWallModels(map),
      ...hullDetailModels(map),
      ...portalSpanModels(map),
      ...portalMouthModels(map),
    ],
    foreground: [...regularBoundaryModels(map, consumed), ...corePortalMouthModels(map), ...frames],
  } satisfies RoomSectionAssembly;
  assemblyCache.set(map, assembly);
  return assembly;
};

const closureAsset = (
  map: WorldMap,
  portal: ArchitecturalConnection
): RoomSectionSpriteId | null => {
  const hull = portalTouchesHull(map, portal);
  if (portal.kind === "door") return hull ? "door_leaf_hull" : "door_leaf";
  if (portal.kind === "core_door") return "core_door_leaf";
  if (portal.kind === "trapdoor") return hull ? "trapdoor_leaf_hull" : "trapdoor_leaf";
  return null;
};

export const roomClosureModels = (
  map: WorldMap,
  states: Readonly<Record<string, FacilityPortalState>>
): RoomClosureSpriteModel[] => {
  const view = mapViewFor(map);
  return architecturalConnections(map).flatMap((portal) => {
    const assetId = closureAsset(map, portal);
    if (!assetId) return [];
    const bounds = connectorBounds(map, portal);
    const state = states[portal.id];
    const open = state ? state.open && !state.sealed : portal.defaultOpen && !portal.defaultSealed;
    if (portal.kind === "trapdoor")
      return [
        {
          ...section(
            `closure:${portal.id}`,
            assetId,
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2
          ),
          open,
        },
      ];
    const floorY = view.worldToMapPoint({ x: 0, elevation: portal.sillElevation }).y;
    return [
      {
        ...section(`closure:${portal.id}`, assetId, bounds.left + bounds.width / 2, floorY - 24),
        height: ROOM_SECTION_DISPLAY_SIZE,
        open,
        width: bounds.width + 32,
      },
    ];
  });
};
