import type { GameState, RoomId, SpeciesId, ConnectionId, TowerInstanceId } from "../../game/types";
import type { PipePreview, RoomEffectPreview } from "../../application/storeTypes";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";
import type { CameraTransform } from "./mapGeometry";
import type { EquipmentHover } from "./EquipmentLayer";
import type { CellOutletId } from "./cellOutletRenderModel";
import { CampaignEncounterSurface } from "../../application/CampaignEncounterSurface";
import { EncounterScene } from "./EncounterScene";
import {
  GhostRouteLayer,
  IncidentLayer,
  ProcessNodes,
  PipeHitLayer,
  TransportNetwork,
} from "./MapLayers";
import { EquipmentLayer } from "./EquipmentLayer";
import { CellOutletLayer } from "./CellOutletLayer";
import { MapLabelLayer } from "./MapLabelLayer";
import { RoomNode } from "./RoomNode";
import { DamageNumberLayer } from "./DamageNumberLayer";
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
  placementPreview: TowerPlacementPreview | null;
  selectedTowerId: TowerInstanceId | null;
  onSelectTower: (towerId: TowerInstanceId) => void;
}

/** Campaign-only process overlays compose into the common tactical scene. */
export const MapScene = (props: MapSceneProps) => (
  <CampaignEncounterSurface>
    <EncounterScene
      camera={props.camera}
      placementPreview={props.placementPreview}
      onHoverEnemy={props.onHoverEnemy}
    >
      <PipeHitLayer game={props.game} onHover={props.onHoverRun} />
      {props.game.encounter.world.rooms.map((roomId) => (
        <RoomNode
          key={roomId}
          game={props.game}
          roomId={roomId}
          selected={
            props.pipeMode ? props.pipeDragSourceRoomId === roomId : props.selectedRoomId === roomId
          }
          onHover={props.onHoverRoom}
          onSelect={props.onSelectRoom}
          onPipeDragStart={props.onPipeDragStart}
          onPipeDragEnd={props.onPipeDragEnd}
          pipeMode={props.pipeMode}
          roomEffectTone={props.roomEffectPreview?.rooms[roomId] ?? null}
        />
      ))}
      {props.pipePreview && <GhostRouteLayer game={props.game} preview={props.pipePreview} />}
      <TransportNetwork
        game={props.game}
        hoveredRunId={props.hoveredRunId}
        pipeDragSourceRoomId={props.pipeDragSourceRoomId}
        pipeMode={props.pipeMode}
        selectedSpecies={props.selectedSpecies}
      />
      <ProcessNodes game={props.game} />
      <CellOutletLayer
        game={props.game}
        onHover={props.onHoverCellOutlet}
        onSelectRoom={props.onSelectRoom}
      />
      <EquipmentLayer
        game={props.game}
        onHover={props.onHoverEquipment}
        onSelectRoom={props.onSelectRoom}
      />
      <MapLabelLayer game={props.game} selectedRoomId={props.selectedRoomId} />
      <IncidentLayer game={props.game} />
      <DamageNumberLayer game={props.game} />
    </EncounterScene>
  </CampaignEncounterSurface>
);
