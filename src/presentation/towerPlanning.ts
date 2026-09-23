import type { CombatDefinition, EncounterCommand, EncounterState } from "../game/tactical";
import type { CommandDecision } from "../game/types";
import type { GameRuntime } from "../game/runtime";
import { worldPointToGridCell } from "../game/spatial";
import type {
  CommandRejectionCode,
  GridCell,
  GameState,
  TowerChassisId,
  TowerMountFace,
  TowerOrientation,
  TowerPlacement,
  WorldPoint,
} from "../game/types";
import { preferredOrientationForMount } from "./towerCopy";

interface SurfacePlanningRuntime<State> {
  definition: Pick<CombatDefinition, "towers">;
  evaluate: (state: State, command: EncounterCommand) => CommandDecision;
  encounterOf: (state: State) => EncounterState;
  resolvePlacement: (
    id: TowerChassisId,
    anchor: GridCell,
    face: TowerMountFace,
    orientation: TowerOrientation
  ) => TowerPlacement;
}

const SURFACE_SNAP_DISTANCE = 2.5;

export const towerMountWorldPoint = (
  placement: Pick<TowerPlacement, "anchor" | "mountFace">
): WorldPoint => {
  const { anchor, mountFace } = placement;
  if (mountFace === "floor") return { x: anchor.column + 0.5, elevation: anchor.elevation };
  if (mountFace === "ceiling") return { x: anchor.column + 0.5, elevation: anchor.elevation + 1 };
  if (mountFace === "left_wall") return { x: anchor.column, elevation: anchor.elevation + 0.5 };
  return { x: anchor.column + 1, elevation: anchor.elevation + 0.5 };
};

const roomSurfaceAnchors = (
  room: GameState["encounter"]["map"]["rooms"][string],
  mountFace: TowerMountFace
): GridCell[] => {
  if (mountFace === "left_wall" || mountFace === "right_wall") {
    const column =
      mountFace === "left_wall" ? room.bounds.column : room.bounds.column + room.bounds.width - 1;
    return Array.from({ length: room.bounds.height }, (_, offset) => ({
      column,
      elevation: room.bounds.elevation + offset,
    }));
  }
  if (mountFace === "ceiling") {
    const elevation = room.bounds.elevation + room.bounds.height - 1;
    return Array.from({ length: room.bounds.width }, (_, offset) => ({
      column: room.bounds.column + offset,
      elevation,
    }));
  }
  return [
    ...Array.from({ length: room.bounds.width }, (_, offset) => ({
      column: room.bounds.column + offset,
      elevation: room.bounds.elevation,
    })),
    ...room.platformCells,
  ];
};

interface SurfaceCandidate {
  anchor: GridCell;
  mountFace: TowerMountFace;
  distance: number;
}

const pointsIntoMount = (mountFace: TowerMountFace, orientation: TowerOrientation): boolean => {
  if (mountFace === "left_wall") return orientation === "left";
  if (mountFace === "right_wall") return orientation === "right";
  if (mountFace === "floor") return orientation === "down";
  return orientation === "up";
};

const orientationForSurface = (
  chassisId: TowerChassisId,
  mountFace: TowerMountFace,
  orientation: TowerOrientation,
  runtime: Pick<SurfacePlanningRuntime<unknown>, "definition">
): TowerOrientation =>
  pointsIntoMount(mountFace, orientation)
    ? preferredOrientationForMount(runtime.definition.towers[chassisId]!.orientations, mountFace)
    : orientation;

const snapToMountSurface = <State>(
  game: State,
  worldPoint: WorldPoint,
  chassisId: TowerChassisId,
  runtime: SurfacePlanningRuntime<State>
): Pick<SurfaceCandidate, "anchor" | "mountFace"> | null => {
  const candidate = runtime.definition.towers[chassisId]!.mountFaces.flatMap((mountFace) =>
    Object.values(runtime.encounterOf(game).map.rooms).flatMap((room) =>
      roomSurfaceAnchors(room, mountFace).map((anchor): SurfaceCandidate => {
        const surface = towerMountWorldPoint({ anchor, mountFace });
        return {
          anchor,
          mountFace,
          distance: Math.hypot(surface.x - worldPoint.x, surface.elevation - worldPoint.elevation),
        };
      })
    )
  ).sort((left, right) => left.distance - right.distance)[0];
  if (candidate && candidate.distance <= SURFACE_SNAP_DISTANCE)
    return { anchor: candidate.anchor, mountFace: candidate.mountFace };
  return null;
};

export interface TowerPlacementPreview {
  chassisId: TowerChassisId;
  mountFace: TowerMountFace;
  orientation: TowerOrientation;
  anchor: ReturnType<typeof worldPointToGridCell>;
  placement: ReturnType<GameRuntime["queries"]["resolveTowerPlacement"]>;
  allowed: boolean;
  reason: CommandRejectionCode | null;
  cost: number;
  movingTowerId: string | null;
}

export const createSurfaceTowerPlanning = <State>(runtime: SurfacePlanningRuntime<State>) =>
  Object.freeze({
    planPlacement: (
      game: State,
      worldPoint: WorldPoint,
      chassisId: TowerChassisId,
      orientation: TowerOrientation,
      movingTowerId: string | null = null
    ): TowerPlacementPreview | null => {
      const snapped = snapToMountSurface(game, worldPoint, chassisId, runtime);
      if (!snapped) return null;
      const resolvedOrientation = orientationForSurface(
        chassisId,
        snapped.mountFace,
        orientation,
        runtime
      );
      const command = movingTowerId
        ? ({
            type: "move_tower",
            towerId: movingTowerId,
            mountFace: snapped.mountFace,
            orientation: resolvedOrientation,
            anchor: snapped.anchor,
          } as const)
        : ({
            type: "place_tower",
            chassisId,
            mountFace: snapped.mountFace,
            orientation: resolvedOrientation,
            anchor: snapped.anchor,
          } as const);
      const decision = runtime.evaluate(game, command);
      return {
        chassisId,
        mountFace: snapped.mountFace,
        orientation: resolvedOrientation,
        anchor: snapped.anchor,
        placement: runtime.resolvePlacement(
          chassisId,
          snapped.anchor,
          snapped.mountFace,
          resolvedOrientation
        ),
        allowed: decision.allowed,
        reason: decision.code,
        cost: decision.cost,
        movingTowerId,
      };
    },
  });

export const createTowerPlanning = (runtime: GameRuntime) =>
  createSurfaceTowerPlanning({
    definition: runtime.definition,
    evaluate: (game: GameState, command: EncounterCommand) => runtime.evaluate(game, command),
    encounterOf: (game: GameState) => game.encounter,
    resolvePlacement: runtime.queries.resolveTowerPlacement,
  });
