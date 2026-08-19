/* eslint-disable max-lines-per-function -- The map surface binds camera, hover, construction, and Pixi interaction state. */
import { architecturalConnections } from "../game/world/map";
import { useCallback, useEffect, useMemo, useState, type PointerEvent } from "react";
import type { CameraTransform } from "./gameMap/mapGeometry";
import type { GameState, RoomId, SpeciesId, WorldPoint } from "../game/types";
import { cellOutletAssemblyModel } from "./gameMap/cellOutletRenderModel";
import { MapChrome } from "./gameMap/MapChrome";
import { MapScene } from "./gameMap/MapScene";
import { PipePreviewPopup } from "./gameMap/PipePreviewPopup";
import { useGameStore } from "../application/store";
import { useMapCamera, useMapInteractions } from "./gameMap/useMapCamera";
import { useMapHover, usePointerProbe } from "./gameMap/useMapHover";
import { usePipeRoomEffectHover } from "./gameMap/usePipeRoomEffectHover";
import { mapViewFor } from "./gameMap/mapGeometry";
import type { TowerPlacementPreview } from "../presentation/towerPlanning";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { useGamePresentation } from "../application/presentationContext";

interface GameMapProps {
  game: GameState;
  selectedRoomId: RoomId;
  onSelectRoom: (roomId: RoomId) => void;
  onConnectRooms: (from: RoomId, to: RoomId, anchor: { x: number; y: number }) => void;
  onTogglePipeMode: () => void;
  pipeMode: boolean;
}

const mapTelemetry = (
  game: GameState,
  camera: CameraTransform,
  pipeMode: boolean,
  towerPreview: TowerPlacementPreview | null
) => ({
  "data-world-model": "cell-platform-v1",
  "data-grid": `${game.map.width}x${game.map.height}`,
  "data-portal-count": architecturalConnections(game.map).length,
  "data-enemy-modes": [...new Set(game.enemies.map((enemy) => enemy.mode))].join(","),
  "data-camera-x": camera.x,
  "data-camera-y": camera.y,
  "data-camera-zoom": camera.zoom,
  "data-pipe-mode": pipeMode,
  "data-tower-preview-face": towerPreview?.mountFace ?? "",
  "data-tower-preview-orientation": towerPreview?.orientation ?? "",
  "data-tower-preview-allowed": towerPreview?.allowed ?? false,
  "data-installed-equipment-count": Object.values(game.rooms).reduce(
    (total, room) => total + Object.values(room.equipment).filter(Boolean).length,
    0
  ),
  "data-cell-outlet-room": cellOutletAssemblyModel(game)?.roomId ?? "",
});

export const GameMap = ({
  game,
  selectedRoomId,
  onSelectRoom,
  onConnectRooms,
  onTogglePipeMode,
  pipeMode,
}: GameMapProps) => {
  const { towerPlanning, translator } = useGamePresentation();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId | null>(null);
  const [pipeDragSourceRoomId, setPipeDragSourceRoomId] = useState<RoomId | null>(null);
  const pipePreview = useGameStore((state) => state.pipePreview);
  const roomEffectPreview = useGameStore((state) => state.roomEffectPreview);
  const towerBuildSelection = useGameStore((state) => state.towerBuildSelection);
  const setTowerBuildSelection = useGameStore((state) => state.setTowerBuildSelection);
  const selectedTowerId = useGameStore((state) => state.selectedTowerId);
  const selectTower = useGameStore((state) => state.selectTower);
  const dispatch = useGameStore((state) => state.dispatch);
  const movingTowerId = useGameStore((state) => state.movingTowerId);
  const [towerPointer, setTowerPointer] = useState<WorldPoint | null>(null);
  const { wrapperRef, trackPointer, probePointer } = usePointerProbe();
  const hover = useMapHover(pipeMode, probePointer);
  const onHoverRun = usePipeRoomEffectHover(game, hover.onHoverRun);
  const camera = useMapCamera(game.map);
  const completePipeDrag = useCallback(
    (roomId: RoomId) =>
      setPipeDragSourceRoomId((source) => {
        const anchor = probePointer();
        if (source && source !== roomId) onConnectRooms(source, roomId, anchor ?? { x: 0, y: 0 });
        return null;
      }),
    [onConnectRooms, probePointer]
  );
  const clearPipeDrag = useCallback(() => setPipeDragSourceRoomId(null), []);
  const towerMode = towerBuildSelection !== null;
  const towerPreview = useMemo(
    () =>
      towerBuildSelection && towerPointer
        ? towerPlanning.planPlacement(
            game,
            towerPointer,
            towerBuildSelection.chassisId,
            towerBuildSelection.orientation,
            movingTowerId
          )
        : null,
    [game, movingTowerId, towerBuildSelection, towerPlanning, towerPointer]
  );
  useEffect(() => {
    if (!towerBuildSelection) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTowerBuildSelection(null);
        setTowerPointer(null);
        return;
      }
      if (event.key.toLowerCase() !== "r") return;
      const orientations =
        DEFAULT_GAME_RUNTIME.definition.towers[towerBuildSelection.chassisId].orientations;
      const current = orientations.indexOf(towerBuildSelection.orientation);
      const orientation = orientations[(current + 1) % orientations.length];
      if (orientation) setTowerBuildSelection({ ...towerBuildSelection, orientation });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setTowerBuildSelection, towerBuildSelection]);
  const mapInteractions = useMapInteractions(
    pipeMode || towerMode,
    camera,
    (event) => {
      trackPointer(event);
      if (!towerBuildSelection) return;
      const canvas = event.currentTarget.querySelector("canvas");
      const bounds = canvas?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
      const worldPoint = mapViewFor(game.map).clientToWorldPoint(
        { x: event.clientX, y: event.clientY },
        camera.camera,
        { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height }
      );
      setTowerPointer(worldPoint);
    },
    clearPipeDrag
  );
  const placeTower = useCallback(() => {
    if (!towerBuildSelection || !towerPreview) return;
    if (!towerPreview.allowed) return;
    const accepted = movingTowerId
      ? dispatch({
          type: "move_tower",
          towerId: movingTowerId,
          mountFace: towerPreview.mountFace,
          orientation: towerPreview.orientation,
          anchor: towerPreview.anchor,
        })
      : dispatch({
          type: "place_tower",
          chassisId: towerBuildSelection.chassisId,
          mountFace: towerPreview.mountFace,
          orientation: towerPreview.orientation,
          anchor: towerPreview.anchor,
        });
    if (accepted) {
      const placedId = Object.keys(useGameStore.getState().game.towers).at(-1) ?? null;
      selectTower(movingTowerId ?? placedId);
      setTowerPointer(null);
    }
  }, [dispatch, movingTowerId, selectTower, towerBuildSelection, towerPreview]);

  return (
    <div
      ref={wrapperRef}
      className={`game-map-canvas ${pipeMode ? "pipe-mode" : ""} ${towerMode ? "tower-mode" : ""}`}
      data-testid="game-map"
      data-tutorial-anchor="game-map"
      role="button"
      tabIndex={0}
      aria-label={translator.text("ui.map.interactionSurface")}
      {...mapTelemetry(game, camera.camera, pipeMode, towerPreview)}
      {...mapInteractions}
      onClick={placeTower}
      onKeyDown={(event) => {
        if (!towerMode || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        placeTower();
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        mapInteractions.onPointerCancel?.(event);
      }}
    >
      <MapScene
        camera={camera.camera}
        game={game}
        hoveredRunId={hover.glowRunId}
        onHoverCellOutlet={hover.onHoverCellOutlet}
        onHoverEquipment={hover.onHoverEquipment}
        onHoverEnemy={hover.onHoverEnemy}
        onHoverRoom={hover.onHoverRoom}
        onHoverRun={onHoverRun}
        onPipeDragEnd={completePipeDrag}
        onPipeDragStart={setPipeDragSourceRoomId}
        onSelectRoom={onSelectRoom}
        pipeDragSourceRoomId={pipeDragSourceRoomId}
        pipeMode={pipeMode}
        pipePreview={pipePreview}
        selectedRoomId={selectedRoomId}
        selectedSpecies={selectedSpecies}
        roomEffectPreview={roomEffectPreview}
        placementPreview={towerPreview}
        selectedTowerId={selectedTowerId}
        onSelectTower={selectTower}
      />
      <PipePreviewPopup />
      <MapChrome
        game={game}
        hoveredCellOutletId={hover.hoveredCellOutletId}
        hoveredEquipment={hover.hoveredEquipment}
        hoveredEnemyId={hover.hoveredEnemyId}
        hoveredRunId={hover.hoveredRunId}
        hoveredRoomId={hover.hoveredRoomId}
        onResetCamera={camera.resetCamera}
        onSelectSpecies={setSelectedSpecies}
        onTogglePipeMode={onTogglePipeMode}
        onZoom={camera.zoomBy}
        pipeMode={pipeMode}
        selectedSpecies={selectedSpecies}
        tooltipAnchor={hover.tooltipAnchor}
        zoom={camera.camera.zoom}
      />
    </div>
  );
};
