import { useCallback, useMemo } from "react";
import type { Graphics } from "pixi.js";
import { useEncounterControls } from "../../application/encounterSurface";
import {
  previewCatalystField,
  previewCatalystPlacement,
  previewDischarge,
} from "../../game/tactical";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";
import { mapViewFor } from "./mapGeometry";
import {
  drawPendingAttacks,
  drawDischargePulses,
  drawFieldArrows,
  drawDischargePreview,
} from "./catalystDrawing";

/** Render committed positions and pure kernel previews; drawings never resolve combat. */
export const CatalystLayer = ({ placement }: { placement: TowerPlacementPreview | null }) => {
  const { encounter, selectedTowerId, presentation, reducedMotion } = useEncounterControls();
  const field = selectedTowerId
    ? previewCatalystField(encounter, selectedTowerId, presentation.context)
    : null;
  const discharge = selectedTowerId
    ? previewDischarge(encounter, selectedTowerId, presentation.context)
    : null;
  const candidateDevice = placement ? presentation.towers.device(placement.chassisId) : null;
  const radius = field?.radius ?? discharge?.radius;
  const candidateArrows = useMemo(
    () =>
      placement && candidateDevice?.kind === "field"
        ? previewCatalystPlacement(
            encounter,
            placement.placement,
            candidateDevice.defaultMode,
            placement.chassisId,
            presentation.context
          )
        : [],
    [placement, candidateDevice, encounter, presentation.context]
  );
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      const view = mapViewFor(encounter.map);
      drawPendingAttacks(g, encounter);
      if (!reducedMotion) drawDischargePulses(g, encounter);
      drawFieldArrows(g, candidateArrows, view, 0.55);
      if (field) {
        drawFieldArrows(g, field.routeArrows, view, 0.3);
        drawFieldArrows(g, field.arrows, view, 1);
      }
      const tower = selectedTowerId ? encounter.towers[selectedTowerId] : null;
      if (tower && radius) {
        const origin = view.worldToMapPoint(tower.placement.firingOrigin);
        g.circle(origin.x, origin.y, radius * view.pixelsPerUnit).stroke({
          color: field ? 0x8dc9ff : 0xd6ccff,
          width: 2,
          alpha: 0.6,
        });
      }
      if (discharge) drawDischargePreview(g, encounter, discharge);
    },
    [encounter, selectedTowerId, candidateArrows, field, discharge, reducedMotion, radius]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};
