import type { GameState, TowerInstanceId } from "../../game/types";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";
import { CampaignEncounterSurface } from "../../application/CampaignEncounterSurface";
import { EncounterTowerLayer } from "./EncounterTowerLayer";

export const TowerLayer = (props: {
  game: GameState;
  placementPreview: TowerPlacementPreview | null;
  selectedTowerId: TowerInstanceId | null;
  onSelectTower: (towerId: TowerInstanceId) => void;
}) => (
  <CampaignEncounterSurface>
    <EncounterTowerLayer {...props} game={props.game.encounter} />
  </CampaignEncounterSurface>
);
