import { Maximize2, Minus, Move, Plus, Spline, X } from "lucide-react";
import { TUTORIAL_ANCHORS } from "../../tutorial/anchors";
import type { TooltipAnchor } from "./useMapHover";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type RoomId,
  type SpeciesId,
  type ConnectionId,
} from "../../game/types";
import { SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import { mapViewFor } from "./mapGeometry";
import { TransportTooltip } from "./TransportTooltip";
import { RoomTooltip } from "./RoomTooltip";
import { EquipmentTooltip } from "./EquipmentTooltip";
import type { EquipmentHover } from "./EquipmentLayer";
import { EnemyTooltip } from "./EnemyTooltip";
import { CellOutletTooltip } from "./CellOutletTooltip";
import type { CellOutletId } from "./cellOutletRenderModel";
import { speciesCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";

// HTML overlays keep secondary map detail available without competing with the Pixi playfield.

interface MaterialFlowControlProps {
  selectedSpecies: SpeciesId | null;
  onSelectSpecies: (species: SpeciesId | null) => void;
}

const MaterialFlowControl = ({ selectedSpecies, onSelectSpecies }: MaterialFlowControlProps) => {
  const { translator } = useGamePresentation();
  return (
    <label className="material-flow-control">
      <span>{translator.text("ui.map.materialFlow")}</span>
      <select
        aria-label={translator.text("ui.map.materialOverlay")}
        data-testid="material-flow-overlay"
        value={selectedSpecies ?? ""}
        onChange={(event) =>
          onSelectSpecies(event.target.value === "" ? null : (event.target.value as SpeciesId))
        }
      >
        <option value="">{translator.text("ui.map.overlayOff")}</option>
        <optgroup label={translator.text("ui.map.gas")}>
          {GAS_TYPES.map((species) => (
            <option key={species} value={species}>
              {SPECIES_DEFINITIONS[species].formula} ·{" "}
              {speciesCopy(SPECIES_DEFINITIONS[species], translator).name}
            </option>
          ))}
        </optgroup>
        <optgroup label={translator.text("ui.map.liquid")}>
          {LIQUID_TYPES.map((species) => (
            <option key={species} value={species}>
              {SPECIES_DEFINITIONS[species].formula} ·{" "}
              {speciesCopy(SPECIES_DEFINITIONS[species], translator).name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
};

interface CameraControlsProps {
  fitZoom: number;
  zoom: number;
  onReset: () => void;
  onZoom: (factor: number) => void;
}

const CameraControls = ({ fitZoom, zoom, onReset, onZoom }: CameraControlsProps) => {
  const { formatters, translator } = useGamePresentation();
  return (
    <div className="map-camera-controls" aria-label={translator.text("ui.map.camera")}>
      <span>
        <Move size={13} /> {translator.text("ui.map.camera.hint")}
      </span>
      <button
        type="button"
        aria-label={translator.text("ui.map.camera.zoomOut")}
        onClick={() => onZoom(1 / 1.2)}
      >
        <Minus size={14} />
      </button>
      <strong>{formatters.percent(zoom / fitZoom, 0)}</strong>
      <button
        type="button"
        aria-label={translator.text("ui.map.camera.zoomIn")}
        onClick={() => onZoom(1.2)}
      >
        <Plus size={14} />
      </button>
      <button type="button" aria-label={translator.text("ui.map.camera.fit")} onClick={onReset}>
        <Maximize2 size={14} />
      </button>
    </div>
  );
};

interface MapTooltipsProps {
  game: GameState;
  hoveredCellOutletId: CellOutletId | null;
  hoveredEquipment: EquipmentHover | null;
  hoveredEnemyId: number | null;
  hoveredRunId: ConnectionId | null;
  hoveredRoomId: RoomId | null;
  selectedSpecies: SpeciesId | null;
  tooltipAnchor: TooltipAnchor | null;
}

const anchorClassName = (anchor: TooltipAnchor): string =>
  ["map-tooltip-anchor", anchor.flipX ? "flip-x" : "", anchor.flipY ? "flip-y" : ""]
    .filter(Boolean)
    .join(" ");

const MapTooltips = ({
  game,
  hoveredCellOutletId,
  hoveredEquipment,
  hoveredEnemyId,
  hoveredRunId,
  hoveredRoomId,
  selectedSpecies,
  tooltipAnchor,
}: MapTooltipsProps) => {
  if (!tooltipAnchor) return null;
  const blocking =
    hoveredEnemyId !== null || hoveredCellOutletId !== null || hoveredEquipment !== null;
  return (
    <div
      className={anchorClassName(tooltipAnchor)}
      style={{ left: tooltipAnchor.x, top: tooltipAnchor.y }}
    >
      <EnemyTooltip game={game} enemyId={hoveredEnemyId} />
      <CellOutletTooltip
        game={game}
        bufferId={hoveredEnemyId === null ? hoveredCellOutletId : null}
      />
      <EquipmentTooltip
        game={game}
        equipment={
          hoveredEnemyId === null && hoveredCellOutletId === null ? hoveredEquipment : null
        }
      />
      <TransportTooltip
        game={game}
        runId={blocking ? null : hoveredRunId}
        selectedSpecies={selectedSpecies}
      />
      <RoomTooltip game={game} roomId={blocking ? null : hoveredRoomId} />
    </div>
  );
};

interface PipeModeToggleProps {
  pipeMode: boolean;
  onToggle: () => void;
}

const PipeModeToggle = ({ pipeMode, onToggle }: PipeModeToggleProps) => {
  const { translator } = useGamePresentation();
  return (
    <button
      type="button"
      className={`pipe-mode-toggle ${pipeMode ? "active" : ""}`}
      data-testid="pipe-mode-toggle"
      data-tutorial-anchor={TUTORIAL_ANCHORS.pipeModeToggle}
      aria-pressed={pipeMode}
      onClick={onToggle}
    >
      {pipeMode ? <X size={14} /> : <Spline size={14} />}
      {translator.text(pipeMode ? "ui.map.pipes.exit" : "ui.map.pipes.enter")}
    </button>
  );
};

interface MapChromeProps {
  game: GameState;
  hoveredCellOutletId: CellOutletId | null;
  hoveredEquipment: EquipmentHover | null;
  hoveredEnemyId: number | null;
  hoveredRunId: ConnectionId | null;
  hoveredRoomId: RoomId | null;
  onResetCamera: () => void;
  onSelectSpecies: (species: SpeciesId | null) => void;
  onTogglePipeMode: () => void;
  onZoom: (factor: number) => void;
  pipeMode: boolean;
  selectedSpecies: SpeciesId | null;
  tooltipAnchor: TooltipAnchor | null;
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
  onTogglePipeMode,
  onZoom,
  pipeMode,
  selectedSpecies,
  tooltipAnchor,
  zoom,
}: MapChromeProps) => {
  const { translator } = useGamePresentation();
  return (
    <div
      className="map-chrome"
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <MaterialFlowControl selectedSpecies={selectedSpecies} onSelectSpecies={onSelectSpecies} />
      <PipeModeToggle pipeMode={pipeMode} onToggle={onTogglePipeMode} />
      {pipeMode && (
        <p className="pipe-mode-hint" data-testid="pipe-mode-hint">
          {translator.text("ui.map.pipes.hint")}
        </p>
      )}
      <CameraControls
        fitZoom={mapViewFor(game.map).fitZoom}
        zoom={zoom}
        onReset={onResetCamera}
        onZoom={onZoom}
      />
      <MapTooltips
        game={game}
        hoveredCellOutletId={hoveredCellOutletId}
        hoveredEquipment={hoveredEquipment}
        hoveredEnemyId={hoveredEnemyId}
        hoveredRunId={hoveredRunId}
        hoveredRoomId={hoveredRoomId}
        selectedSpecies={selectedSpecies}
        tooltipAnchor={tooltipAnchor}
      />
      <div className="map-material-legend" aria-label={translator.text("ui.map.legend")}>
        <span>
          <i className="upper-gas" /> {translator.text("ui.map.legend.upperGas")}
        </span>
        <span>
          <i className="lower-gas" /> {translator.text("ui.map.legend.lowerGas")}
        </span>
        <span>
          <i className="liquid" /> {translator.text("ui.map.legend.liquid")}
        </span>
        <span>
          <i className="damage" /> {translator.text("ui.map.legend.damage")}
        </span>
      </div>
    </div>
  );
};
