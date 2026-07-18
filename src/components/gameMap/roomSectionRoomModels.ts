import type { RoomId } from "../../game/types";
import type { MapRoom, WorldMap } from "../../game/world/map";
import { mapViewFor, type MapRect, type MapView } from "./mapGeometry";
import type { RoomSectionSpriteModel } from "./roomSectionRenderModel";
import { ROOM_SECTION_DISPLAY_SIZE, type RoomSectionSpriteId } from "./roomSectionSprites";

export type BoundarySide = "ceiling" | "floor" | "left" | "right";

type BasicBoundaryAsset =
  | "ceiling"
  | "corner_ceiling_left"
  | "corner_ceiling_right"
  | "corner_floor_left"
  | "corner_floor_right"
  | "floor"
  | "wall_left"
  | "wall_right";

const HULL_BOUNDARY_ASSETS: Record<BasicBoundaryAsset, RoomSectionSpriteId> = {
  ceiling: "ceiling_hull",
  corner_ceiling_left: "corner_ceiling_left_hull",
  corner_ceiling_right: "corner_ceiling_right_hull",
  corner_floor_left: "corner_floor_left_hull",
  corner_floor_right: "corner_floor_right_hull",
  floor: "floor_hull",
  wall_left: "wall_left_hull",
  wall_right: "wall_right_hull",
};

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

const boundaryAsset = (room: MapRoom, assetId: BasicBoundaryAsset): RoomSectionSpriteId =>
  room.provenance === "hull" ? HULL_BOUNDARY_ASSETS[assetId] : assetId;

const backWallAsset = (room: MapRoom, column: number, elevation: number): RoomSectionSpriteId => {
  const variant = (column + elevation) % 2 === 0 ? "a" : "b";
  return room.provenance === "hull" ? `back_wall_hull_${variant}` : `back_wall_${variant}`;
};

export const boundarySlotKey = (roomId: RoomId, side: BoundarySide, coordinate: number): string =>
  `${roomId}:${side}:${coordinate}`;

export const backWallModels = (map: WorldMap): RoomSectionSpriteModel[] => {
  const view = mapViewFor(map);
  return Object.values(map.rooms).flatMap((room) => {
    if (room.structure === "core") return [];
    const models: RoomSectionSpriteModel[] = [];
    for (
      let elevation = room.bounds.elevation;
      elevation < room.bounds.elevation + room.bounds.height;
      elevation += 1
    ) {
      for (
        let column = room.bounds.column;
        column < room.bounds.column + room.bounds.width;
        column += 1
      ) {
        const rect = view.gridCellMapRect({ column, elevation });
        models.push(
          section(
            `back:${room.id}:${column}:${elevation}`,
            backWallAsset(room, column, elevation),
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          )
        );
      }
    }
    return models;
  });
};

export const hullDetailModels = (map: WorldMap): RoomSectionSpriteModel[] => {
  const view = mapViewFor(map);
  return Object.values(map.rooms).flatMap((room) => {
    if (room.provenance !== "hull" || room.structure === "core") return [];
    const gauge = view.gridCellMapRect({
      column: room.bounds.column + Math.min(2, room.bounds.width - 1),
      elevation: room.bounds.elevation + room.bounds.height - 2,
    });
    const models = [
      section(
        `hull-detail:${room.id}:gauges`,
        "hull_gauges",
        gauge.left + gauge.width / 2,
        gauge.top + gauge.height / 2
      ),
    ];
    if (room.bounds.width < 8) return models;
    const wiring = view.gridCellMapRect({
      column: room.bounds.column + room.bounds.width - 3,
      elevation: room.bounds.elevation + room.bounds.height - 2,
    });
    models.push(
      section(
        `hull-detail:${room.id}:wiring`,
        "hull_wiring",
        wiring.left + wiring.width / 2,
        wiring.top + wiring.height / 2
      )
    );
    return models;
  });
};

const horizontalBoundaryModels = (
  room: MapRoom,
  view: MapView,
  rect: MapRect,
  consumed: ReadonlySet<string>
): RoomSectionSpriteModel[] => {
  const models: RoomSectionSpriteModel[] = [];
  for (
    let column = room.bounds.column;
    column < room.bounds.column + room.bounds.width;
    column += 1
  ) {
    const cellRect = view.gridCellMapRect({ column, elevation: room.bounds.elevation });
    const x = cellRect.left + cellRect.width / 2;
    if (!consumed.has(boundarySlotKey(room.id, "floor", column)))
      models.push(
        section(
          `boundary:${room.id}:floor:${column}`,
          boundaryAsset(room, "floor"),
          x,
          rect.top + rect.height
        )
      );
    if (!consumed.has(boundarySlotKey(room.id, "ceiling", column)))
      models.push(
        section(
          `boundary:${room.id}:ceiling:${column}`,
          boundaryAsset(room, "ceiling"),
          x,
          rect.top
        )
      );
  }
  return models;
};

const verticalBoundaryModels = (
  room: MapRoom,
  view: MapView,
  rect: MapRect,
  consumed: ReadonlySet<string>
): RoomSectionSpriteModel[] => {
  const models: RoomSectionSpriteModel[] = [];
  for (
    let elevation = room.bounds.elevation;
    elevation < room.bounds.elevation + room.bounds.height;
    elevation += 1
  ) {
    const cellRect = view.gridCellMapRect({ column: room.bounds.column, elevation });
    const y = cellRect.top + cellRect.height / 2;
    if (!consumed.has(boundarySlotKey(room.id, "left", elevation)))
      models.push(
        section(
          `boundary:${room.id}:left:${elevation}`,
          boundaryAsset(room, "wall_left"),
          rect.left,
          y
        )
      );
    if (!consumed.has(boundarySlotKey(room.id, "right", elevation)))
      models.push(
        section(
          `boundary:${room.id}:right:${elevation}`,
          boundaryAsset(room, "wall_right"),
          rect.left + rect.width,
          y
        )
      );
  }
  return models;
};

const cornerModels = (room: MapRoom, rect: MapRect): RoomSectionSpriteModel[] => [
  section(
    `corner:${room.id}:floor:left`,
    boundaryAsset(room, "corner_floor_left"),
    rect.left,
    rect.top + rect.height
  ),
  section(
    `corner:${room.id}:floor:right`,
    boundaryAsset(room, "corner_floor_right"),
    rect.left + rect.width,
    rect.top + rect.height
  ),
  section(
    `corner:${room.id}:ceiling:left`,
    boundaryAsset(room, "corner_ceiling_left"),
    rect.left,
    rect.top
  ),
  section(
    `corner:${room.id}:ceiling:right`,
    boundaryAsset(room, "corner_ceiling_right"),
    rect.left + rect.width,
    rect.top
  ),
];

export const regularBoundaryModels = (
  map: WorldMap,
  consumed: ReadonlySet<string>
): RoomSectionSpriteModel[] => {
  const view = mapViewFor(map);
  return Object.values(map.rooms).flatMap((room) => {
    if (room.structure === "core") return [];
    const rect = view.roomMapRect(room.id);
    return [
      ...horizontalBoundaryModels(room, view, rect, consumed),
      ...verticalBoundaryModels(room, view, rect, consumed),
      ...cornerModels(room, rect),
    ];
  });
};
