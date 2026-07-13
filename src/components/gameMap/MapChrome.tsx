import { Maximize2, Minus, Move, Plus } from "lucide-react";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type SpeciesId,
  type TransportRunId,
} from "../../game/types";
import { SPECIES_DEFINITIONS } from "../../game/config";
import { FIT_ZOOM } from "./mapGeometry";
import { TransportTooltip } from "./TransportTooltip";

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
            {SPECIES_DEFINITIONS[species].formula} · {SPECIES_DEFINITIONS[species].name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Liquid">
        {LIQUID_TYPES.map((species) => (
          <option key={species} value={species}>
            {SPECIES_DEFINITIONS[species].formula} · {SPECIES_DEFINITIONS[species].name}
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
  hoveredRunId: TransportRunId | null;
  onResetCamera: () => void;
  onSelectSpecies: (species: SpeciesId | null) => void;
  onZoom: (factor: number) => void;
  selectedSpecies: SpeciesId | null;
  zoom: number;
}

export const MapChrome = ({
  game,
  hoveredRunId,
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
    <TransportTooltip game={game} runId={hoveredRunId} selectedSpecies={selectedSpecies} />
  </div>
);
