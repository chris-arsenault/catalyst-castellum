import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_THREE_SITE_SEEDS, LANE_SIX_SITE } from "../sites/actThree";
import { actThreeSupplies } from "./actThreeShared";
import { paletteAvailability } from "./fullPlant";
import type { ProcessFamilyId } from "../../types";

const LANE_SIX_PALETTE: readonly ProcessFamilyId[] = ["carbon_steam", "nickel", "nitrogen_oxide"];
const LANE_SIX_AVAILABILITY = paletteAvailability(LANE_SIX_PALETTE);
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const LANE_SIX_LEVEL: LevelDefinition = {
  id: "lane_six",
  number: 11,
  palette: LANE_SIX_PALETTE,
  enemyLevel: 30,
  focusRoomId: "gallery",
  featuredReactionIds: [
    "hydrogen_oxygen_combustion",
    "nitrogen_dioxide_absorption",
    "nickel_carbonyl_deposition",
    "uranyl_fluoride_recovery",
  ],
  startingMatter: 490,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actThreeSupplies("lane_marker", {
    gasCapacity: 1_250,
    gasContents: {
      hydrogen: 360,
      oxygen: 180,
      nitrogen: 240,
      carbon_monoxide: 180,
    },
    gasCost: 46,
    water: 240,
    brine: 0,
    liquidCapacity: 280,
    hazard: {
      gas: {
        contents: { ammonia: 50, nitrogen_dioxide: 18 },
        capacity: 100,
        cost: 22,
        availableFromRound: "lane_marker",
      },
    },
    waterCost: 14,
    brineCost: 18,
  }),
  site: { kind: "generated", seed: ACT_THREE_SITE_SEEDS.lane_six, spec: LANE_SIX_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { solid_carbon: 34, iron_catalyst: 5 },
      gallery: { platinum_catalyst: 4, surface_nickel: 18 },
      lower_intake: { nickel_oxide: 18, surface_nickel: 18 },
    },
  },
  rounds: [
    {
      id: "lane_marker",
      primeSeconds: 72,
      wave: enemySequence(3, "deckmouth", 0.5, 1.8, -10),
      availability: LANE_SIX_AVAILABILITY,
    },
    {
      id: "fast_column",
      primeSeconds: 72,
      wave: wave(
        enemySequence(8, "flintjack", 0.5, 1.2, -9),
        enemySequence(4, "clatter", 1.5, 1.8, -9)
      ),
      availability: LANE_SIX_AVAILABILITY,
    },
    {
      id: "field_column",
      primeSeconds: 72,
      wave: wave(
        enemySequence(4, "splitback", 1, 2.6, -9),
        enemySequence(4, "redlung", 2, 2.5, -8),
        enemySequence(2, "glowbag", 3.5, 3, -9),
        enemySequence(1, "anchor", 5, 1, -9)
      ),
      availability: LANE_SIX_AVAILABILITY,
    },
    {
      id: "convoy_window",
      primeSeconds: 72,
      wave: wave(
        enemySequence(10, "flintjack", 0.5, 1.05, -8),
        enemySequence(6, "deckmouth", 1, 1.55, -8),
        enemySequence(4, "clatter", 2, 1.9, -8),
        enemySequence(3, "shear_jelly", 3, 2.5, -8),
        enemySequence(3, "glowbag", 4, 2.6, -8)
      ),
      availability: LANE_SIX_AVAILABILITY,
    },
    {
      id: "whole_lane",
      primeSeconds: 72,
      wave: wave(
        enemySequence(8, "flintjack", 0.5, 1.1, -6),
        enemySequence(6, "deckmouth", 1, 1.5, -6),
        enemySequence(5, "splitback", 2, 2.2, -7),
        enemySequence(4, "redlung", 2.5, 2.4, -6),
        enemySequence(4, "clatter", 3, 1.9, -5),
        enemySequence(3, "glowbag", 4, 2.5, -6),
        enemySequence(2, "shear_jelly", 5, 2.7, -5),
        enemySequence(1, "anchor", 7, 1, 1)
      ),
      availability: LANE_SIX_AVAILABILITY,
    },
  ],
};
