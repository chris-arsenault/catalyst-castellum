import { Application, extend } from "@pixi/react";
import { AnimatedSprite, Container, Graphics, Sprite, Text } from "pixi.js";
import type { GameState, RoomId, SpeciesId, ConnectionId } from "../../game/types";
import type { PipePreview, RoomEffectPreview } from "../../application/storeTypes";
import { GhostRouteLayer } from "./MapLayers";
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
  PipeHitLayer,
  TransportNetwork,
} from "./MapLayers";
import {
  mapRenderResolution,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  type CameraTransform,
} from "./mapGeometry";
import { MapLabelLayer } from "./MapLabelLayer";
import { RoomNode } from "./RoomNode";
import { enemyRoomId } from "../../game/queries";
import { RoomBackgroundLayer } from "./RoomSectionLayer";

extend({ AnimatedSprite, Container, Graphics, Sprite, Text });

export interface MapSceneProps {
  camera: CameraTransform;
  game: GameState;
  hoveredRunId: ConnectionId | null;
  onHoverCellOutlet: (outputId: CellOutletId | null) => void;
  onHoverEquipment: (equipment: EquipmentHover | null) => void;
  onHoverEnemy: (enemyId: number | null) => void;
  onHoverRoom: (roomId: RoomId | null) => void;
  onHoverRun: (runId: ConnectionId | null) => void;
  onPipeDragStart: (roomId: RoomId) => void;
  onPipeDragEnd: (roomId: RoomId) => void;
  onSelectRoom: (roomId: RoomId) => void;
  pipeDragSourceRoomId: RoomId | null;
  pipeMode: boolean;
  pipePreview: PipePreview | null;
  selectedRoomId: RoomId;
  selectedSpecies: SpeciesId | null;
  roomEffectPreview: RoomEffectPreview | null;
}

const enemyHasFieldProtection = (game: GameState, enemy: GameState["enemies"][number]): boolean => {
  const roomId = enemyRoomId(enemy, game);
  if (!roomId) return false;
  return game.enemies.some(
    (candidate) =>
      candidate.id !== enemy.id &&
      candidate.behavior.kind === "shared_field" &&
      candidate.behavior.active &&
      candidate.behavior.charge > 0 &&
      enemyRoomId(candidate, game) === roomId
  );
};

const EnemyLayer = ({
  game,
  onHoverEnemy,
}: {
  game: GameState;
  onHoverEnemy: (enemyId: number | null) => void;
}) =>
  game.enemies.map((enemy) => (
    <EnemyNode
      key={enemy.id}
      enemy={enemy}
      map={game.map}
      fieldProtected={enemyHasFieldProtection(game, enemy)}
      onHover={onHoverEnemy}
    />
  ));

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
  pipePreview,
  selectedRoomId,
  selectedSpecies,
  roomEffectPreview,
}: MapSceneProps) => (
  <Application
    width={VIEWPORT_WIDTH}
    height={VIEWPORT_HEIGHT}
    backgroundAlpha={0}
    antialias
    autoDensity
    resolution={mapRenderResolution(globalThis.devicePixelRatio)}
    preference="webgl"
  >
    <pixiContainer x={camera.x} y={camera.y} scale={camera.zoom}>
      <pixiContainer alpha={pipeMode ? 0.32 : 1}>
        <MapBackdrop game={game} />
        <RoomBackgroundLayer map={game.map} />
      </pixiContainer>
      <PipeHitLayer game={game} onHover={onHoverRun} />
      <pixiContainer alpha={pipeMode ? 0.55 : 1}>
        {game.world.rooms.map((roomId) => (
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
            roomEffectTone={roomEffectPreview?.rooms[roomId] ?? null}
          />
        ))}
      </pixiContainer>
      <pixiContainer alpha={pipeMode ? 0.3 : 1}>
        <FacilityCorridors game={game} />
        <FacilityDoors game={game} />
      </pixiContainer>
      {pipePreview && <GhostRouteLayer game={game} preview={pipePreview} />}
      <TransportNetwork
        game={game}
        hoveredRunId={hoveredRunId}
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
        <EnemyLayer game={game} onHoverEnemy={onHoverEnemy} />
        <DamageNumberLayer game={game} />
      </pixiContainer>
    </pixiContainer>
  </Application>
);
