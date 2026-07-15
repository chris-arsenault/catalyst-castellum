import { useCallback, useState } from "react";
import { FACILITY_MAP } from "../presentation/defaultGame";
import type { CameraTransform } from "./gameMap/mapGeometry";
import type { GameState, RoomId, SpeciesId } from "../game/types";
import { cellOutletAssemblyModel } from "./gameMap/cellOutletRenderModel";
import { MapChrome } from "./gameMap/MapChrome";
import { MapScene } from "./gameMap/MapScene";
import { useMapCamera } from "./gameMap/useMapCamera";
import { useMapHover } from "./gameMap/useMapHover";

interface GameMapProps {
  game: GameState;
  selectedRoomId: RoomId;
  onSelectRoom: (roomId: RoomId) => void;
  onConnectRooms: (from: RoomId, to: RoomId) => void;
  onTogglePipeMode: () => void;
  pipeMode: boolean;
}

const mapTelemetry = (game: GameState, camera: CameraTransform, pipeMode: boolean) => ({
  "data-world-model": "cell-platform-v1",
  "data-grid": `${FACILITY_MAP.width}x${FACILITY_MAP.height}`,
  "data-portal-count": FACILITY_MAP.portals.length,
  "data-enemy-modes": [...new Set(game.enemies.map((enemy) => enemy.mode))].join(","),
  "data-camera-x": camera.x,
  "data-camera-y": camera.y,
  "data-camera-zoom": camera.zoom,
  "data-pipe-mode": pipeMode,
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
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId | null>(null);
  const [pipeDragSourceRoomId, setPipeDragSourceRoomId] = useState<RoomId | null>(null);
  const hover = useMapHover(pipeMode);
  const camera = useMapCamera();
  const completePipeDrag = useCallback(
    (roomId: RoomId) => {
      setPipeDragSourceRoomId((source) => {
        if (source && source !== roomId) onConnectRooms(source, roomId);
        return null;
      });
    },
    [onConnectRooms]
  );
  const clearPipeDrag = useCallback(() => setPipeDragSourceRoomId(null), []);
  // Pipe routing owns pointer drags while the board is open; panning would fight it.
  const mapInteractions = pipeMode
    ? { onWheel: camera.handleWheel, onPointerUp: clearPipeDrag, onPointerCancel: clearPipeDrag }
    : {
        onWheel: camera.handleWheel,
        onPointerDown: camera.handlePointerDown,
        onPointerMove: camera.handlePointerMove,
        onPointerUp: camera.handlePointerUp,
        onPointerCancel: camera.handlePointerUp,
        onLostPointerCapture: camera.handleLostPointerCapture,
      };

  return (
    <div
      className={`game-map-canvas ${pipeMode ? "pipe-mode" : ""}`}
      data-testid="game-map"
      data-tutorial-anchor="game-map"
      {...mapTelemetry(game, camera.camera, pipeMode)}
      {...mapInteractions}
    >
      <MapScene
        camera={camera.camera}
        game={game}
        hoveredRunId={hover.hoveredRunId}
        onHoverCellOutlet={hover.onHoverCellOutlet}
        onHoverEquipment={hover.onHoverEquipment}
        onHoverEnemy={hover.onHoverEnemy}
        onHoverRoom={hover.onHoverRoom}
        onHoverRun={hover.onHoverRun}
        onPipeDragEnd={completePipeDrag}
        onPipeDragStart={setPipeDragSourceRoomId}
        onSelectRoom={onSelectRoom}
        pipeDragSourceRoomId={pipeDragSourceRoomId}
        pipeMode={pipeMode}
        selectedRoomId={selectedRoomId}
        selectedSpecies={selectedSpecies}
      />
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
        zoom={camera.camera.zoom}
      />
    </div>
  );
};
