import { useGamePresentation } from "../../application/presentationContext";
import { useOptionalEncounterSurface } from "../../application/encounterSurface";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";

export const TowerPlacementFeedback = ({ preview }: { preview: TowerPlacementPreview | null }) => {
  const fallback = useGamePresentation();
  const surface = useOptionalEncounterSurface();
  const { commandCopy } = surface?.presentation ?? fallback;
  const reason = preview ? commandCopy({ code: preview.reason, cost: preview.cost }) : null;
  return (
    <div className="tower-placement-feedback" role="status" aria-live="polite">
      {reason}
    </div>
  );
};
