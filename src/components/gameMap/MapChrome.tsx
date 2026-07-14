import { Maximize2, Minus, Move, Plus } from "lucide-react";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type RoomId,
  type SpeciesId,
  type TransportRunId,
} from "../../game/types";
import { SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import { FIT_ZOOM } from "./mapGeometry";
import { TransportTooltip } from "./TransportTooltip";
import { RoomTooltip } from "./RoomTooltip";
import { EquipmentTooltip } from "./EquipmentTooltip";
import type { EquipmentHover } from "./EquipmentLayer";
import { EnemyTooltip } from "./EnemyTooltip";
import { CellOutletTooltip } from "./CellOutletTooltip";
import type { CellOutletId } from "./cellOutletRenderModel";
import { speciesCopy } from "../../presentation/entityCopy";

// HTML overlays keep secondary map detail available without competing with the Pixi playfield.

interface MaterialFlowControlProps {
  selectedSpecies: SpeciesId | null;
  onSelectSpecies: (species: SpeciesId | null) => void;
}

const MaterialFlowControl = ({ selectedSpecies, onSelectSpecies }: MaterialFlowControlProps) => (
  <label className="material-flow-control">
    <span>Material flow</span>
    <select
      aria-label="Material flow overlay"
      data-testid="material-flow-overlay"
      value={selectedSpecies ?? ""}
      onChange={(event) =>
        onSelectSpecies(event.target.value === "" ? null : (event.target.value as SpeciesId))
      }
    >
      <option value="">Overlay off</option>
      <optgroup label="Gas">
        {GAS_TYPES.map((species) => (
          <option key={species} value={species}>
            {SPECIES_DEFINITIONS[species].formula} ·{" "}
            {speciesCopy(SPECIES_DEFINITIONS[species]).name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Liquid">
        {LIQUID_TYPES.map((species) => (
          <option key={species} value={species}>
            {SPECIES_DEFINITIONS[species].formula} ·{" "}
            {speciesCopy(SPECIES_DEFINITIONS[species]).name}
          </option>
        ))}
      </optgroup>
    </select>
  </label>
);

interface CameraControlsProps {
  zoom: number;
  onReset: () => void;
  onZoom: (factor: number) => void;
}

const CameraControls = ({ zoom, onReset, onZoom }: CameraControlsProps) => (
  <div className="map-camera-controls" aria-label="Map camera controls">
    <span>
      <Move size={13} /> drag · wheel
    </span>
    <button type="button" aria-label="Zoom out" onClick={() => onZoom(1 / 1.2)}>
      <Minus size={14} />
    </button>
    <strong>{Math.round((zoom / FIT_ZOOM) * 100)}%</strong>
    <button type="button" aria-label="Zoom in" onClick={() => onZoom(1.2)}>
      <Plus size={14} />
    </button>
    <button type="button" aria-label="Fit facility" onClick={onReset}>
      <Maximize2 size={14} />
    </button>
  </div>
);

interface MapChromeProps {
  game: GameState;
  hoveredCellOutletId: CellOutletId | null;
  hoveredEquipment: EquipmentHover | null;
  hoveredEnemyId: number | null;
  hoveredRunId: TransportRunId | null;
  hoveredRoomId: RoomId | null;
  onResetCamera: () => void;
  onSelectSpecies: (species: SpeciesId | null) => void;
  onZoom: (factor: number) => void;
  selectedSpecies: SpeciesId | null;
  zoom: number;
}

export const MapChrome = ({
  game,
  hoveredCellOutletId,
  hoveredEquipment,
  hoveredEnemyId,
  hoveredRunId,
  hoveredRoomId,
  onResetCamera,
  onSelectSpecies,
  onZoom,
  selectedSpecies,
  zoom,
}: MapChromeProps) => (
  <div
    className="map-chrome"
    onPointerDown={(event) => event.stopPropagation()}
    onWheel={(event) => event.stopPropagation()}
  >
    <MaterialFlowControl selectedSpecies={selectedSpecies} onSelectSpecies={onSelectSpecies} />
    <CameraControls zoom={zoom} onReset={onResetCamera} onZoom={onZoom} />
    <EnemyTooltip game={game} enemyId={hoveredEnemyId} />
    <CellOutletTooltip
      game={game}
      bufferId={hoveredEnemyId === null ? hoveredCellOutletId : null}
    />
    <EquipmentTooltip
      game={game}
      equipment={hoveredEnemyId === null && hoveredCellOutletId === null ? hoveredEquipment : null}
    />
    <TransportTooltip
      game={game}
      runId={
        hoveredEnemyId !== null || hoveredCellOutletId !== null || hoveredEquipment
          ? null
          : hoveredRunId
      }
      selectedSpecies={selectedSpecies}
    />
    <RoomTooltip
      game={game}
      roomId={
        hoveredEnemyId !== null || hoveredCellOutletId !== null || hoveredEquipment
          ? null
          : hoveredRoomId
      }
    />
    <div className="map-material-legend" aria-label="Map materials and damage legend">
      <span>
        <i className="upper-gas" /> upper gas
      </span>
      <span>
        <i className="lower-gas" /> lower gas
      </span>
      <span>
        <i className="liquid" /> liquid
      </span>
      <span>
        <i className="damage" /> typed damage
      </span>
    </div>
  </div>
);
