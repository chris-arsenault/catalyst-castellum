import { ROOM_ORDER } from "../../presentation/defaultGame";
import type { GameState, RoomId } from "../../game/types";
import { facilityModelForMap } from "../../game/world/derivedModel";
import type { WorldMap } from "../../game/world/map";
import { cellOutletAssemblyModel } from "./cellOutletRenderModel";
import { mapViewFor, type MapRect, type MapView } from "./mapGeometry";
import { roomCopy } from "../../presentation/entityCopy";
import { DEFAULT_TRANSLATOR, type Translator } from "../../localization/translator";
import { roomDefinition } from "../../presentation/defaultGame";

const EDGE_PADDING = 8;
const LABEL_PADDING_X = 8;
const LABEL_HEIGHT_SCALE = 1.55;

export interface MapLabelPlacement extends MapRect {
  fontSize: number;
  roomId: RoomId;
  selected: boolean;
  text: string;
}

interface TaggedObstacle extends MapRect {
  labelMayOverlapForRoomId: RoomId | null;
}

interface Candidate {
  allowOwnRoom: boolean;
  left: number;
  top: number;
}

const intersects = (left: MapRect, right: MapRect): boolean =>
  left.left < right.left + right.width &&
  left.left + left.width > right.left &&
  left.top < right.top + right.height &&
  left.top + left.height > right.top;

const withinMap = (view: MapView, rect: MapRect): boolean =>
  rect.left >= EDGE_PADDING &&
  rect.top >= EDGE_PADDING &&
  rect.left + rect.width <= view.mapWidth - EDGE_PADDING &&
  rect.top + rect.height <= view.mapHeight - EDGE_PADDING;

const estimateLabelSize = (text: string, fontSize: number): Pick<MapRect, "height" | "width"> => ({
  width: Math.ceil(text.length * fontSize * 0.61 + LABEL_PADDING_X * 2),
  height: Math.ceil(fontSize * LABEL_HEIGHT_SCALE),
});

const candidatesFor = (
  view: MapView,
  roomId: RoomId,
  width: number,
  height: number
): Candidate[] => {
  const room = view.roomMapRect(roomId);
  const centerX = room.left + room.width / 2;
  const centerY = room.top + room.height / 2;
  return [
    { left: centerX - width / 2, top: room.top - height - 7, allowOwnRoom: false },
    { left: centerX - width / 2, top: room.top + room.height + 7, allowOwnRoom: false },
    { left: room.left - width - 7, top: centerY - height / 2, allowOwnRoom: false },
    { left: room.left + room.width + 7, top: centerY - height / 2, allowOwnRoom: false },
    { left: room.left + 9, top: room.top + 9, allowOwnRoom: true },
    { left: room.left + room.width - width - 9, top: room.top + 9, allowOwnRoom: true },
    { left: room.left + 9, top: room.top + room.height - height - 9, allowOwnRoom: true },
    {
      left: room.left + room.width - width - 9,
      top: room.top + room.height - height - 9,
      allowOwnRoom: true,
    },
  ];
};

const structureObstacles = (map: WorldMap, view: MapView): TaggedObstacle[] =>
  facilityModelForMap(map)
    .cells()
    .filter(({ terrain }) => terrain === "platform" || terrain === "ladder")
    .map(({ cell }) => ({ ...view.gridCellMapRect(cell), labelMayOverlapForRoomId: null }));

const roomObstacles = (view: MapView): TaggedObstacle[] =>
  ROOM_ORDER.map((roomId) => ({
    ...view.roomMapRect(roomId),
    labelMayOverlapForRoomId: roomId,
  }));

const utilityNodeObstacles = (map: WorldMap, view: MapView): TaggedObstacle[] =>
  Object.values(map.utilityNodes).map(({ cell }) => {
    const rect = view.gridCellMapRect(cell);
    return {
      left: rect.left - 16,
      top: rect.top - 24,
      width: rect.width + 32,
      height: rect.height + 48,
      labelMayOverlapForRoomId: null,
    };
  });

const equipmentSocketObstacles = (map: WorldMap, view: MapView): TaggedObstacle[] =>
  Object.values(map.rooms).flatMap(({ socketCells }) =>
    Object.values(socketCells).flatMap((cell) => {
      if (!cell) return [];
      const rect = view.gridCellMapRect(cell);
      return [
        {
          left: rect.left - 15,
          top: rect.top - 39,
          width: rect.width + 30,
          height: rect.height + 34,
          labelMayOverlapForRoomId: null,
        },
      ];
    })
  );

const cellOutletObstacles = (game?: GameState): TaggedObstacle[] => {
  const assembly = game ? cellOutletAssemblyModel(game) : null;
  if (!assembly) return [];
  return assembly.outlets.map((outlet) => ({
    left: outlet.x - 18,
    top: outlet.y - 29,
    width: 36,
    height: 58,
    labelMayOverlapForRoomId: null,
  }));
};

const placementIsFree = (
  view: MapView,
  rect: MapRect,
  roomId: RoomId,
  allowOwnRoom: boolean,
  obstacles: readonly TaggedObstacle[],
  placed: readonly MapLabelPlacement[]
): boolean =>
  withinMap(view, rect) &&
  !placed.some((label) => intersects(rect, label)) &&
  !obstacles.some(
    (obstacle) =>
      intersects(rect, obstacle) && !(allowOwnRoom && obstacle.labelMayOverlapForRoomId === roomId)
  );

const labelPriority = (view: MapView, roomId: RoomId, selectedRoomId: RoomId): number => {
  if (roomId === selectedRoomId) return 100;
  if (roomId === "core") return 90;
  return 50 - view.roomMapRect(roomId).width / 100;
};

export const layoutMapLabels = (
  map: WorldMap,
  selectedRoomId: RoomId,
  game?: GameState,
  translator: Translator = DEFAULT_TRANSLATOR
): MapLabelPlacement[] => {
  const view = mapViewFor(map);
  const obstacles = [
    ...roomObstacles(view),
    ...structureObstacles(map, view),
    ...utilityNodeObstacles(map, view),
    ...equipmentSocketObstacles(map, view),
    ...cellOutletObstacles(game),
  ];
  const placed: MapLabelPlacement[] = [];
  const ordered = [...ROOM_ORDER].sort(
    (left, right) =>
      labelPriority(view, right, selectedRoomId) - labelPriority(view, left, selectedRoomId)
  );
  for (const roomId of ordered) {
    const definition = roomDefinition(roomId);
    const textOptions = [
      `${definition.code} · ${roomCopy(definition, translator).name}`,
      definition.code,
    ];
    let accepted: MapLabelPlacement | null = null;
    for (const text of textOptions) {
      for (const fontSize of [17, 14, 12]) {
        const size = estimateLabelSize(text, fontSize);
        const candidate = candidatesFor(view, roomId, size.width, size.height).find((position) =>
          placementIsFree(
            view,
            { left: position.left, top: position.top, ...size },
            roomId,
            position.allowOwnRoom,
            obstacles,
            placed
          )
        );
        if (!candidate) continue;
        accepted = {
          left: candidate.left,
          top: candidate.top,
          ...size,
          fontSize,
          roomId,
          selected: roomId === selectedRoomId,
          text,
        };
        break;
      }
      if (accepted) break;
    }
    if (accepted) placed.push(accepted);
  }
  return placed;
};

export const labelsOverlap = (labels: readonly MapLabelPlacement[]): boolean =>
  labels.some((label, index) => labels.slice(index + 1).some((other) => intersects(label, other)));
