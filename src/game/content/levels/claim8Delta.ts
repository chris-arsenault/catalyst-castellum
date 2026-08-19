import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, DEFAULT_ROUTE_INGRESSES, emptyLoadout } from "./helpers";

const claimAvailability = availability({ towers: ["flash_chamber", "caustic_jet"] });

const mixed = (...groups: ReturnType<typeof enemySequence>[]) =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Claim 8-Delta establishes placement, coverage, direct damage, cadence, and upgrades. */
export const CLAIM_8_DELTA_LEVEL: LevelDefinition = {
  id: "claim_8_delta",
  number: 1,
  palette: ["iron"],
  enemyLevel: 20,
  focusRoomId: "switchyard",
  featuredReactionIds: [],
  startingMatter: 82,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: [],
  site: null,
  loadout: emptyLoadout(),
  routes: DEFAULT_ROUTE_INGRESSES,
  rounds: [
    {
      id: "first_coverage",
      wave: enemySequence(5, "deckmouth", 0.5, 3.8, -8),
      availability: claimAvailability,
    },
    {
      id: "rapid_service",
      wave: enemySequence(8, "flintjack", 0.5, 2.1, -8),
      availability: claimAvailability,
    },
    {
      id: "mixed_column",
      wave: mixed(
        enemySequence(6, "flintjack", 0.5, 2.2, -7),
        enemySequence(4, "deckmouth", 2, 3.4, -7)
      ),
      availability: claimAvailability,
    },
    {
      id: "upgrade_pressure",
      wave: mixed(
        enemySequence(9, "flintjack", 0.5, 1.7, -6),
        enemySequence(4, "deckmouth", 3, 3.1, -6)
      ),
      availability: claimAvailability,
    },
    {
      id: "claim_exam",
      wave: mixed(
        enemySequence(8, "flintjack", 0.5, 1.6, -5),
        enemySequence(6, "deckmouth", 2, 2.7, -5),
        enemySequence(2, "redlung", 6, 5, -8)
      ),
      availability: claimAvailability,
    },
  ],
};
