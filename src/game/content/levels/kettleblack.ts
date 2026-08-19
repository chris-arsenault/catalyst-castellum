import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { availability, DEFAULT_ROUTE_INGRESSES, emptyLoadout } from "./helpers";

const kettleblackAvailability = availability({
  towers: [
    "flash_chamber",
    "caustic_jet",
    "carbon_burner",
    "acid_pot",
    "quench_coil",
    "wash_head",
    "carbonyl_marker",
  ],
});

const mixed = (...groups: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Kettleblack tests the permanent firing room bought before docking and its final approach. */
export const KETTLEBLACK_LEVEL: LevelDefinition = {
  id: "kettleblack",
  number: 5,
  palette: ["iron"],
  enemyLevel: 24,
  focusRoomId: "washlock",
  featuredReactionIds: [],
  startingMatter: 300,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: [],
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.kettleblack,
    hullAnchor: { columns: 72, elevations: 0 },
  },
  loadout: emptyLoadout(),
  routes: DEFAULT_ROUTE_INGRESSES,
  rounds: [
    {
      id: "grain_markers",
      wave: enemySequence(12, "deckmouth", 0.5, 2.8, -5),
      availability: kettleblackAvailability,
    },
    {
      id: "paired_edges",
      wave: mixed(
        enemySequence(10, "flintjack", 0.5, 1.7, -5),
        enemySequence(6, "deckmouth", 2, 3, -5)
      ),
      availability: kettleblackAvailability,
    },
    {
      id: "carrier_return",
      wave: mixed(
        enemySequence(7, "splitback", 0.5, 3, -4),
        enemySequence(5, "redlung", 2, 4.2, -5),
        enemySequence(8, "flintjack", 3, 1.8, -4)
      ),
      availability: kettleblackAvailability,
    },
    {
      id: "split_signal",
      wave: mixed(
        enemySequence(8, "clatter", 0.5, 2, -4),
        enemySequence(8, "shear_jelly", 1.5, 2.4, -5),
        enemySequence(8, "deckmouth", 3, 2.2, -4)
      ),
      availability: kettleblackAvailability,
    },
    {
      id: "edge_condition",
      wave: mixed(
        enemySequence(12, "flintjack", 0.5, 1.4, -3),
        enemySequence(8, "splitback", 1.5, 2.2, -3),
        enemySequence(6, "redlung", 3, 3.2, -4),
        enemySequence(6, "shear_jelly", 4, 2, -4)
      ),
      availability: kettleblackAvailability,
    },
  ],
};
