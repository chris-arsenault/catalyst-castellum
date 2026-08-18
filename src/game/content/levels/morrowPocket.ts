import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout } from "./helpers";

const MORROW_ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "west_claim",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "upper_cut",
    roomId: "gallery",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.08,
    eligibility: "all",
  },
];

const onRoute = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));

const mixed = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

const fullTowerAvailability = availability({
  towers: [
    "bolt_caster",
    "repeater",
    "line_projector",
    "mortar",
    "snare_emitter",
    "flak_nest",
    "relay",
  ],
});

/** Morrow Pocket opens the campaign into two simultaneous routes and unrestricted tower choices. */
export const MORROW_POCKET_LEVEL: LevelDefinition = {
  id: "morrow_pocket",
  number: 4,
  palette: ["iron"],
  enemyLevel: 23,
  focusRoomId: "gallery",
  featuredReactionIds: [],
  startingMatter: 192,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  supplies: [],
  site: null,
  loadout: emptyLoadout(),
  routes: MORROW_ROUTES,
  rounds: [
    {
      id: "claim_entry",
      wave: mixed(
        onRoute("west_claim", enemySequence(6, "deckmouth", 0.5, 2.4, -6)),
        onRoute("upper_cut", enemySequence(4, "flintjack", 1.5, 2.5, -6))
      ),
      availability: fullTowerAvailability,
    },
    {
      id: "split_levels",
      wave: mixed(
        onRoute("west_claim", enemySequence(7, "flintjack", 0.5, 1.8, -5)),
        onRoute("upper_cut", enemySequence(5, "shear_jelly", 1, 2.4, -6))
      ),
      availability: fullTowerAvailability,
    },
    {
      id: "armored_claim",
      wave: mixed(
        onRoute("west_claim", enemySequence(5, "splitback", 0.5, 2.8, -5)),
        onRoute("upper_cut", enemySequence(5, "redlung", 1.5, 2.7, -6))
      ),
      availability: fullTowerAvailability,
    },
    {
      id: "support_wake",
      wave: mixed(
        onRoute("west_claim", enemySequence(8, "clatter", 0.5, 1.7, -5)),
        onRoute("upper_cut", enemySequence(6, "flintjack", 1, 1.8, -5)),
        onRoute("upper_cut", enemySequence(1, "anchor", 2, 5, -6))
      ),
      availability: fullTowerAvailability,
    },
    {
      id: "whole_pocket",
      wave: mixed(
        onRoute("west_claim", enemySequence(7, "splitback", 0.5, 2.2, -4)),
        onRoute("west_claim", enemySequence(6, "clatter", 1, 1.9, -4)),
        onRoute("upper_cut", enemySequence(7, "shear_jelly", 0.75, 2, -5)),
        onRoute("upper_cut", enemySequence(3, "glowbag", 2, 3.2, -5)),
        onRoute("upper_cut", enemySequence(1, "anchor", 2.5, 5, -5))
      ),
      availability: fullTowerAvailability,
    },
  ],
};
