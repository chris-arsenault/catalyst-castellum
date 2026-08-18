import type { GameDefinition } from "../definitionTypes";
import { gridCellToWorldPoint } from "../spatial";
import type {
  GameState,
  GridCell,
  TowerChassisId,
  TowerMountFace,
  TowerOrientation,
  TowerPlacement,
} from "../types";
import { facilityModelForMap } from "../world/derivedModel";

const cellKey = ({ column, elevation }: GridCell): string => `${column}:${elevation}`;

const footprintCells = (
  anchor: GridCell,
  mountFace: TowerMountFace,
  width: number,
  height: number
): GridCell[] => {
  const vertical = mountFace === "left_wall" || mountFace === "right_wall";
  return Array.from({ length: vertical ? height : width }, (_, index) => ({
    column: anchor.column + (vertical ? 0 : index),
    elevation: anchor.elevation + (vertical ? index : 0),
  }));
};

const supportCells = (occupied: readonly GridCell[], mountFace: TowerMountFace): GridCell[] =>
  occupied.map((cell) => {
    if (mountFace === "floor") return { column: cell.column, elevation: cell.elevation - 1 };
    if (mountFace === "ceiling") return { column: cell.column, elevation: cell.elevation + 1 };
    if (mountFace === "left_wall") return { column: cell.column - 1, elevation: cell.elevation };
    return { column: cell.column + 1, elevation: cell.elevation };
  });

export const roomForTowerCell = (state: GameState, cell: GridCell) =>
  Object.values(state.map.rooms).find(
    ({ bounds }) =>
      cell.column >= bounds.column &&
      cell.column < bounds.column + bounds.width &&
      cell.elevation >= bounds.elevation &&
      cell.elevation < bounds.elevation + bounds.height
  ) ?? null;

const onCompatibleBoundary = (state: GameState, cell: GridCell, face: TowerMountFace): boolean => {
  const room = roomForTowerCell(state, cell);
  if (!room) return false;
  if (face === "floor")
    return (
      cell.elevation === room.bounds.elevation ||
      room.platformCells.some(
        (platform) => platform.column === cell.column && platform.elevation === cell.elevation
      )
    );
  if (face === "ceiling") return cell.elevation === room.bounds.elevation + room.bounds.height - 1;
  if (face === "left_wall") return cell.column === room.bounds.column;
  return cell.column === room.bounds.column + room.bounds.width - 1;
};

const firingOrigin = (
  anchor: GridCell,
  mountFace: TowerMountFace
): TowerPlacement["firingOrigin"] => {
  const point = gridCellToWorldPoint(anchor);
  if (mountFace === "floor") return { x: point.x, elevation: point.elevation + 0.45 };
  if (mountFace === "ceiling") return { x: point.x, elevation: point.elevation - 0.45 };
  if (mountFace === "left_wall") return { x: point.x + 0.45, elevation: point.elevation };
  return { x: point.x - 0.45, elevation: point.elevation };
};

export const resolveTowerPlacement = (
  chassisId: TowerChassisId,
  anchor: GridCell,
  mountFace: TowerMountFace,
  orientation: TowerOrientation,
  definition: GameDefinition
): TowerPlacement => {
  const tower = definition.towers[chassisId];
  const occupiedCells = footprintCells(
    anchor,
    mountFace,
    tower.footprint.width,
    tower.footprint.height
  );
  return {
    anchor: { ...anchor },
    mountFace,
    orientation,
    occupiedCells,
    supportCells: supportCells(occupiedCells, mountFace),
    firingOrigin: firingOrigin(anchor, mountFace),
  };
};

export type TowerPlacementIssue =
  | "unsupported_chassis"
  | "unsupported_face"
  | "unsupported_orientation"
  | "outside_map"
  | "missing_support"
  | "occupied"
  | "clearance"
  | "route_obstruction";

const routeCells = (state: GameState): Set<string> =>
  new Set(
    Object.values(state.map.routeGraph.edges).flatMap((edge) =>
      edge.cells.map((cell) => cellKey(cell))
    )
  );

const occupiedTowerCells = (state: GameState, ignoredTowerId: string | null): Set<string> =>
  new Set(
    Object.values(state.towers)
      .filter((candidate) => candidate.id !== ignoredTowerId)
      .flatMap((candidate) => candidate.placement.occupiedCells.map((cell) => cellKey(cell)))
  );

const placementClearanceCells = (state: GameState): Set<string> =>
  new Set([
    ...Object.values(state.map.rooms).flatMap((room) => [
      ...Object.values(room.socketCells).flatMap((cell) => (cell ? [cellKey(cell)] : [])),
      ...room.ladderCells.map((cell) => cellKey(cell)),
      ...room.graftSlots.map((graftSlot) => cellKey(graftSlot.cell)),
    ]),
    ...Object.values(state.map.connections).flatMap((connection) =>
      "connectorCells" in connection ? connection.connectorCells.map((cell) => cellKey(cell)) : []
    ),
  ]);

const placementBlocksRoute = (state: GameState, placement: TowerPlacement): boolean => {
  if (placement.mountFace !== "floor") return false;
  const routes = routeCells(state);
  return placement.occupiedCells.some((cell) => routes.has(cellKey(cell)));
};

export const towerPlacementIssue = (
  state: GameState,
  chassisId: TowerChassisId,
  placement: TowerPlacement,
  definition: GameDefinition,
  ignoredTowerId: string | null = null
): TowerPlacementIssue | null => {
  const tower = definition.towers[chassisId];
  if (!tower) return "unsupported_chassis";
  if (!tower.mountFaces.includes(placement.mountFace)) return "unsupported_face";
  if (!tower.orientations.includes(placement.orientation)) return "unsupported_orientation";
  const model = facilityModelForMap(state.map);
  if (placement.occupiedCells.some((cell) => !model.inBounds(cell))) return "outside_map";
  if (
    placement.occupiedCells.some((cell) => !onCompatibleBoundary(state, cell, placement.mountFace))
  )
    return "missing_support";
  const occupied = occupiedTowerCells(state, ignoredTowerId);
  if (placement.occupiedCells.some((cell) => occupied.has(cellKey(cell)))) return "occupied";
  const clearance = placementClearanceCells(state);
  if (placement.occupiedCells.some((cell) => clearance.has(cellKey(cell)))) return "clearance";
  if (placementBlocksRoute(state, placement)) return "route_obstruction";
  return null;
};

export const towerPlacementProvenance = (
  state: GameState,
  placement: TowerPlacement
): "site" | "hull" => roomForTowerCell(state, placement.anchor)?.provenance ?? "site";

export const towerRoomId = (
  state: GameState,
  tower: { placement: TowerPlacement }
): string | null => roomForTowerCell(state, tower.placement.anchor)?.id ?? null;
