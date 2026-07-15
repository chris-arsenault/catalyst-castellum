import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import { ROOM_ORDER } from "../../presentation/defaultGame";
import type { GameState, RoomId, SpeciesId, TransportRunId } from "../../game/types";
import { EnemyNode } from "./EnemyNode";
import { DamageNumberLayer } from "./DamageNumberLayer";
import { EquipmentLayer, type EquipmentHover } from "./EquipmentLayer";
import { CellOutletLayer } from "./CellOutletLayer";
import type { CellOutletId } from "./cellOutletRenderModel";
import {
  MapBackdrop,
  FacilityCorridors,
  FacilityDoors,
  IncidentLayer,
  ProcessNodes,
  TransportNetwork,
} from "./MapLayers";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, type CameraTransform } from "./mapGeometry";
import { MapLabelLayer } from "./MapLabelLayer";
import { RoomNode } from "./RoomNode";

extend({ Container, Graphics, Text });

export interface MapSceneProps {
  camera: CameraTransform;
  game: GameState;
  hoveredRunId: TransportRunId | null;
  onHoverCellOutlet: (bufferId: CellOutletId | null) => void;
  onHoverEquipment: (equipment: EquipmentHover | null) => void;
  onHoverEnemy: (enemyId: number | null) => void;
  onHoverRoom: (roomId: RoomId | null) => void;
  onHoverRun: (runId: TransportRunId | null) => void;
  onPipeDragStart: (roomId: RoomId) => void;
  onPipeDragEnd: (roomId: RoomId) => void;
  onSelectRoom: (roomId: RoomId) => void;
  pipeDragSourceRoomId: RoomId | null;
  pipeMode: boolean;
  selectedRoomId: RoomId;
  selectedSpecies: SpeciesId | null;
}

export const MapScene = ({
  camera,
  game,
  hoveredRunId,
  onHoverCellOutlet,
  onHoverEquipment,
  onHoverEnemy,
  onHoverRoom,
  onHoverRun,
  onPipeDragEnd,
  onPipeDragStart,
  onSelectRoom,
  pipeDragSourceRoomId,
  pipeMode,
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
      <pixiContainer alpha={pipeMode ? 0.32 : 1}>
        <MapBackdrop />
      </pixiContainer>
      <pixiContainer alpha={pipeMode ? 0.55 : 1}>
        {ROOM_ORDER.map((roomId) => (
          <RoomNode
            key={roomId}
            game={game}
            roomId={roomId}
            selected={pipeMode ? pipeDragSourceRoomId === roomId : selectedRoomId === roomId}
            onHover={onHoverRoom}
            onSelect={onSelectRoom}
            onPipeDragStart={onPipeDragStart}
            onPipeDragEnd={onPipeDragEnd}
            pipeMode={pipeMode}
          />
        ))}
      </pixiContainer>
      <pixiContainer alpha={pipeMode ? 0.3 : 1}>
        <FacilityCorridors />
        <FacilityDoors game={game} />
      </pixiContainer>
      <TransportNetwork
        game={game}
        hoveredRunId={hoveredRunId}
        onHover={onHoverRun}
        pipeDragSourceRoomId={pipeDragSourceRoomId}
        pipeMode={pipeMode}
        selectedSpecies={selectedSpecies}
      />
      <pixiContainer alpha={pipeMode ? 0.25 : 1} eventMode={pipeMode ? "none" : "passive"}>
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
    </pixiContainer>
  </Application>
);
