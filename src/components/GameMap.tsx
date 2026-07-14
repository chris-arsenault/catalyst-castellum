import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import { useState } from "react";
import { FACILITY_MAP, ROOM_ORDER } from "../presentation/defaultGame";
import type { GameState, RoomId, SpeciesId, TransportRunId } from "../game/types";
import { EnemyNode } from "./gameMap/EnemyNode";
import { DamageNumberLayer } from "./gameMap/DamageNumberLayer";
import { EquipmentLayer, type EquipmentHover } from "./gameMap/EquipmentLayer";
import { CellOutletLayer } from "./gameMap/CellOutletLayer";
import { cellOutletAssemblyModel, type CellOutletId } from "./gameMap/cellOutletRenderModel";
import {
  MapBackdrop,
  FacilityCorridors,
  FacilityDoors,
  IncidentLayer,
  ProcessNodes,
  TransportNetwork,
} from "./gameMap/MapLayers";
import { MapChrome } from "./gameMap/MapChrome";
import { MapLabelLayer } from "./gameMap/MapLabelLayer";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, type CameraTransform } from "./gameMap/mapGeometry";
import { RoomNode } from "./gameMap/RoomNode";
import { useMapCamera } from "./gameMap/useMapCamera";

extend({ Container, Graphics, Text });

interface GameMapProps {
  game: GameState;
  selectedRoomId: RoomId;
  onSelectRoom: (roomId: RoomId) => void;
}

interface MapSceneProps extends GameMapProps {
  camera: CameraTransform;
  hoveredRunId: TransportRunId | null;
  onHoverCellOutlet: (bufferId: CellOutletId | null) => void;
  onHoverEquipment: (equipment: EquipmentHover | null) => void;
  onHoverEnemy: (enemyId: number | null) => void;
  onHoverRoom: (roomId: RoomId | null) => void;
  onHoverRun: (runId: TransportRunId | null) => void;
  selectedSpecies: SpeciesId | null;
}

const MapScene = ({
  camera,
  game,
  hoveredRunId,
  onHoverCellOutlet,
  onHoverEquipment,
  onHoverEnemy,
  onHoverRoom,
  onHoverRun,
  onSelectRoom,
  selectedRoomId,
  selectedSpecies,
}: MapSceneProps) => (
  <Application
    width={VIEWPORT_WIDTH}
    height={VIEWPORT_HEIGHT}
    backgroundAlpha={0}
    antialias
    autoDensity
    resolution={1}
    preference="webgl"
  >
    <pixiContainer x={camera.x} y={camera.y} scale={camera.zoom}>
      <MapBackdrop />
      {ROOM_ORDER.map((roomId) => (
        <RoomNode
          key={roomId}
          game={game}
          roomId={roomId}
          selected={selectedRoomId === roomId}
          onHover={onHoverRoom}
          onSelect={onSelectRoom}
        />
      ))}
      <FacilityCorridors />
      <FacilityDoors game={game} />
      <TransportNetwork
        game={game}
        hoveredRunId={hoveredRunId}
        onHover={onHoverRun}
        selectedSpecies={selectedSpecies}
      />
      <ProcessNodes game={game} />
      <CellOutletLayer game={game} onHover={onHoverCellOutlet} onSelectRoom={onSelectRoom} />
      <EquipmentLayer game={game} onHover={onHoverEquipment} onSelectRoom={onSelectRoom} />
      <MapLabelLayer game={game} selectedRoomId={selectedRoomId} />
      <IncidentLayer game={game} />
      {game.enemies.map((enemy) => (
        <EnemyNode key={enemy.id} enemy={enemy} onHover={onHoverEnemy} />
      ))}
      <DamageNumberLayer game={game} />
    </pixiContainer>
  </Application>
);

export const GameMap = ({ game, selectedRoomId, onSelectRoom }: GameMapProps) => {
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId | null>(null);
  const [hoveredRunId, setHoveredRunId] = useState<TransportRunId | null>(null);
  const [hoveredCellOutletId, setHoveredCellOutletId] = useState<CellOutletId | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<RoomId | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<EquipmentHover | null>(null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<number | null>(null);
  const {
    camera,
    handlePointerDown,
    handleLostPointerCapture,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    resetCamera,
    zoomBy,
  } = useMapCamera();
  const mapTelemetry = {
    "data-world-model": "cell-platform-v1",
    "data-grid": `${FACILITY_MAP.width}x${FACILITY_MAP.height}`,
    "data-portal-count": FACILITY_MAP.portals.length,
    "data-enemy-modes": [...new Set(game.enemies.map((enemy) => enemy.mode))].join(","),
    "data-camera-x": camera.x,
    "data-camera-y": camera.y,
    "data-camera-zoom": camera.zoom,
    "data-installed-equipment-count": Object.values(game.rooms).reduce(
      (total, room) => total + Object.values(room.equipment).filter(Boolean).length,
      0
    ),
    "data-cell-outlet-room": cellOutletAssemblyModel(game)?.roomId ?? "",
  };
  const mapInteractions = {
    onWheel: handleWheel,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onLostPointerCapture: handleLostPointerCapture,
  };

  return (
    <div className="game-map-canvas" data-testid="game-map" {...mapTelemetry} {...mapInteractions}>
      <MapScene
        camera={camera}
        game={game}
        hoveredRunId={hoveredRunId}
        onHoverCellOutlet={setHoveredCellOutletId}
        onHoverEquipment={setHoveredEquipment}
        onHoverEnemy={setHoveredEnemyId}
        onHoverRoom={setHoveredRoomId}
        onHoverRun={setHoveredRunId}
        onSelectRoom={onSelectRoom}
        selectedRoomId={selectedRoomId}
        selectedSpecies={selectedSpecies}
      />
      <MapChrome
        game={game}
        hoveredCellOutletId={hoveredCellOutletId}
        hoveredEquipment={hoveredEquipment}
        hoveredEnemyId={hoveredEnemyId}
        hoveredRunId={hoveredRunId}
        hoveredRoomId={hoveredRoomId}
        onResetCamera={resetCamera}
        onSelectSpecies={setSelectedSpecies}
        onZoom={zoomBy}
        selectedSpecies={selectedSpecies}
        zoom={camera.zoom}
      />
    </div>
  );
};
