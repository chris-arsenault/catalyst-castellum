import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { availability, DEFAULT_ROUTE_INGRESSES, emptyLoadout } from "./helpers";

const braceAvailability = availability({
  towers: ["flash_chamber", "caustic_jet", "carbon_burner"],
});

const mixed = (...groups: ReturnType<typeof enemySequence>[]) =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Harker's Brace proves elevation, occlusion, and face-dependent Carbon Burner geometry. */
export const HARKERS_BRACE_LEVEL: LevelDefinition = {
  id: "harkers_brace",
  number: 2,
  palette: ["iron"],
  enemyLevel: 21,
  focusRoomId: "switchyard",
  featuredReactionIds: [],
  startingMatter: 104,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: [],
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.harkers_brace,
    hullAnchor: { columns: 58, elevations: 0 },
  },
  loadout: emptyLoadout(),
  routes: DEFAULT_ROUTE_INGRESSES,
  rounds: [
    {
      id: "brace_wall",
      wave: enemySequence(7, "deckmouth", 0.5, 3, -7),
      availability: braceAvailability,
    },
    {
      id: "brace_ceiling",
      wave: enemySequence(10, "flintjack", 0.5, 1.9, -7),
      availability: braceAvailability,
    },
    {
      id: "split_height",
      wave: mixed(
        enemySequence(7, "flintjack", 0.5, 2, -6),
        enemySequence(5, "shear_jelly", 2, 3, -7)
      ),
      availability: braceAvailability,
    },
    {
      id: "climbing_column",
      wave: mixed(
        enemySequence(6, "clatter", 0.5, 2.2, -7),
        enemySequence(6, "deckmouth", 2, 2.8, -6)
      ),
      availability: braceAvailability,
    },
    {
      id: "brace_exam",
      wave: mixed(
        enemySequence(8, "flintjack", 0.5, 1.7, -5),
        enemySequence(6, "clatter", 2, 2.3, -6),
        enemySequence(6, "shear_jelly", 3.5, 2.7, -6),
        enemySequence(2, "redlung", 6, 4.5, -7)
      ),
      availability: braceAvailability,
    },
  ],
};
