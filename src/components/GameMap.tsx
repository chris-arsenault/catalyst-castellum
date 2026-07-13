import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import { useState } from "react";
import { FACILITY_MAP, ROOM_ORDER } from "../game/config";
import type { GameState, RoomId, SpeciesId, TransportRunId } from "../game/types";
import { EnemyNode } from "./gameMap/EnemyNode";
import {
  MapBackdrop,
  FacilityCorridors,
  FacilityDoors,
  IncidentLayer,
  ProcessNodeLabels,
  ProcessNodes,
  TransportNetwork,
} from "./gameMap/MapLayers";
import { MapChrome } from "./gameMap/MapChrome";
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
  onHoverRun: (runId: TransportRunId | null) => void;
  selectedSpecies: SpeciesId | null;
}

const MapScene = ({
  camera,
  game,
  hoveredRunId,
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
      <ProcessNodeLabels />
      <IncidentLayer game={game} />
      {game.enemies.map((enemy) => (
        <EnemyNode key={enemy.id} enemy={enemy} />
      ))}
    </pixiContainer>
  </Application>
);

export const GameMap = ({ game, selectedRoomId, onSelectRoom }: GameMapProps) => {
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId | null>(null);
  const [hoveredRunId, setHoveredRunId] = useState<TransportRunId | null>(null);
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
        onHoverRun={setHoveredRunId}
        onSelectRoom={onSelectRoom}
        selectedRoomId={selectedRoomId}
        selectedSpecies={selectedSpecies}
      />
      <MapChrome
        game={game}
        hoveredRunId={hoveredRunId}
        onResetCamera={resetCamera}
        onSelectSpecies={setSelectedSpecies}
        onZoom={zoomBy}
        selectedSpecies={selectedSpecies}
        zoom={camera.zoom}
      />
    </div>
  );
};
