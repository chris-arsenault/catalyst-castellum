import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, DEFAULT_ROUTE_INGRESSES, emptyLoadout } from "./helpers";

const caskAvailability = availability({
  towers: ["bolt_caster", "repeater", "line_projector", "mortar", "snare_emitter"],
});

const mixed = (...groups: ReturnType<typeof enemySequence>[]) =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Twelve-Cask introduces finite service, bounded area damage, and route control. */
export const TWELVE_CASK_LEVEL: LevelDefinition = {
  id: "twelve_cask",
  number: 3,
  palette: ["iron"],
  enemyLevel: 22,
  focusRoomId: "reservoir",
  featuredReactionIds: [],
  startingMatter: 142,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: [],
  site: null,
  loadout: emptyLoadout(),
  routes: DEFAULT_ROUTE_INGRESSES,
  rounds: [
    {
      id: "finite_service",
      wave: enemySequence(12, "flintjack", 0.5, 1.5, -7),
      availability: caskAvailability,
    },
    {
      id: "bounded_area",
      wave: enemySequence(12, "deckmouth", 0.5, 1.6, -6),
      availability: caskAvailability,
    },
    {
      id: "route_control",
      wave: mixed(
        enemySequence(10, "flintjack", 0.5, 1.5, -5),
        enemySequence(5, "redlung", 2, 3, -7)
      ),
      availability: caskAvailability,
    },
    {
      id: "armored_casks",
      wave: mixed(
        enemySequence(6, "splitback", 0.5, 2.8, -8),
        enemySequence(10, "flintjack", 1, 1.6, -4)
      ),
      availability: caskAvailability,
    },
    {
      id: "cask_exam",
      wave: mixed(
        enemySequence(12, "flintjack", 0.5, 1.35, -3),
        enemySequence(8, "deckmouth", 1.5, 2, -3),
        enemySequence(5, "splitback", 3, 2.7, -7),
        enemySequence(2, "redlung", 6, 4, -5)
      ),
      availability: caskAvailability,
    },
  ],
};
