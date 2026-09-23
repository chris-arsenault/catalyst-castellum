import { useOptionalEncounterSurface } from "../application/encounterSurface";
import { CampaignEncounterSurface } from "../application/CampaignEncounterSurface";
import { EncounterTowerPanel } from "./EncounterTowerPanel";
export { EncounterTowerPanel } from "./EncounterTowerPanel";

export const TowerPanel = () => {
  const surface = useOptionalEncounterSurface();
  return surface ? (
    <EncounterTowerPanel />
  ) : (
    <CampaignEncounterSurface>
      <EncounterTowerPanel />
    </CampaignEncounterSurface>
  );
};
