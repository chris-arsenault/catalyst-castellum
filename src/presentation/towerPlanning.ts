import type { GameRuntime } from "../game/runtime";
import { worldPointToGridCell } from "../game/spatial";
import type {
  GameState,
  TowerChassisId,
  TowerMountFace,
  TowerOrientation,
  WorldPoint,
} from "../game/types";

const snapToMountSurface = (
  game: GameState,
  raw: ReturnType<typeof worldPointToGridCell>,
  mountFace: TowerMountFace
): ReturnType<typeof worldPointToGridCell> => {
  const room = Object.values(game.map.rooms).find(
    ({ bounds }) =>
      raw.column >= bounds.column &&
      raw.column < bounds.column + bounds.width &&
      raw.elevation >= bounds.elevation &&
      raw.elevation < bounds.elevation + bounds.height
  );
  if (!room) return raw;
  if (mountFace === "left_wall") return { column: room.bounds.column, elevation: raw.elevation };
  if (mountFace === "right_wall")
    return { column: room.bounds.column + room.bounds.width - 1, elevation: raw.elevation };
  if (mountFace === "ceiling")
    return { column: raw.column, elevation: room.bounds.elevation + room.bounds.height - 1 };
  const floorCandidates = [
    { column: raw.column, elevation: room.bounds.elevation },
    ...room.platformCells.filter((cell) => cell.column === raw.column),
  ];
  return floorCandidates.reduce(
    (nearest, candidate) =>
      Math.abs(candidate.elevation - raw.elevation) < Math.abs(nearest.elevation - raw.elevation)
        ? candidate
        : nearest,
    floorCandidates[0]!
  );
};

export interface TowerPlacementPreview {
  chassisId: TowerChassisId;
  mountFace: TowerMountFace;
  orientation: TowerOrientation;
  anchor: ReturnType<typeof worldPointToGridCell>;
  placement: ReturnType<GameRuntime["queries"]["resolveTowerPlacement"]>;
  allowed: boolean;
  reason: string | null;
  cost: number;
  movingTowerId: string | null;
}

export const createTowerPlanning = (runtime: GameRuntime) =>
  Object.freeze({
    planPlacement: (
      game: GameState,
      worldPoint: WorldPoint,
      chassisId: TowerChassisId,
      mountFace: TowerMountFace,
      orientation: TowerOrientation,
      movingTowerId: string | null = null
    ): TowerPlacementPreview => {
      const anchor = snapToMountSurface(game, worldPointToGridCell(worldPoint), mountFace);
      const command = movingTowerId
        ? ({ type: "move_tower", towerId: movingTowerId, mountFace, orientation, anchor } as const)
        : ({ type: "place_tower", chassisId, mountFace, orientation, anchor } as const);
      const decision = runtime.evaluate(game, command);
      return {
        chassisId,
        mountFace,
        orientation,
        anchor,
        placement: runtime.queries.resolveTowerPlacement(
          chassisId,
          anchor,
          mountFace,
          orientation,
          game
        ),
        allowed: decision.allowed,
        reason: decision.code,
        cost: decision.cost,
        movingTowerId,
      };
    },
  });
