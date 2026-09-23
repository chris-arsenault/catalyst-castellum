import { Maximize2, Minus, Plus } from "lucide-react";
import { useEncounterControls } from "../../application/encounterSurface";
import { EncounterScene } from "./EncounterScene";
import { useMapCamera, useMapInteractions } from "./useMapCamera";
import { useMapHover, usePointerProbe } from "./useMapHover";
import { useEncounterPlacement } from "./useEncounterPlacement";
import { TowerPlacementFeedback } from "./TowerPlacementFeedback";
import { TacticalEnemyTooltip } from "./TacticalEnemyTooltip";

const idle = () => undefined;

const CameraButtons = ({ camera }: { camera: ReturnType<typeof useMapCamera> }) => {
  const { translator } = useEncounterControls().presentation;
  return (
    <div className="map-camera-controls">
      <button
        type="button"
        aria-label={translator.text("ui.map.camera.zoomOut")}
        onClick={() => camera.zoomBy(1 / 1.2)}
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        aria-label={translator.text("ui.map.camera.zoomIn")}
        onClick={() => camera.zoomBy(1.2)}
      >
        <Plus size={14} />
      </button>
      <button
        type="button"
        aria-label={translator.text("ui.map.camera.fit")}
        onClick={camera.resetCamera}
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
};

export const EncounterMap = () => {
  const { encounter, selection, presentation } = useEncounterControls();
  const { translator } = presentation;
  const camera = useMapCamera(encounter.map);
  const { wrapperRef, trackPointer, probePointer } = usePointerProbe();
  const hover = useMapHover(false, probePointer);
  const placement = useEncounterPlacement(camera);
  const interactions = useMapInteractions(
    Boolean(selection),
    camera,
    (event) => {
      trackPointer(event);
      placement.trackPlacement(event);
    },
    idle
  );
  return (
    <div
      ref={wrapperRef}
      className={`game-map-canvas ${selection ? "tower-mode" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={translator.text("ui.map.interactionSurface")}
      data-testid="game-map"
      data-camera-x={camera.camera.x}
      data-camera-y={camera.camera.y}
      data-camera-zoom={camera.camera.zoom}
      data-tower-preview-face={placement.preview?.mountFace ?? ""}
      data-tower-preview-allowed={placement.preview ? String(placement.preview.allowed) : ""}
      {...interactions}
      onKeyDown={placement.onKeyDown}
      onClick={placement.onClick}
    >
      <EncounterScene
        camera={camera.camera}
        placementPreview={placement.preview}
        onHoverEnemy={hover.onHoverEnemy}
      />
      <TowerPlacementFeedback preview={placement.preview} />
      <div
        className="map-chrome"
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <CameraButtons camera={camera} />
        {selection && (
          <p className="encounter-keyboard-hint">{translator.text("catalyst.keyboard")}</p>
        )}
        {hover.hoveredEnemyId !== null && (
          <div className="tactical-enemy-inspection">
            <TacticalEnemyTooltip enemyId={hover.hoveredEnemyId} />
          </div>
        )}
      </div>
    </div>
  );
};
