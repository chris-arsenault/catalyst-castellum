import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_TWO_SITE_SEEDS, JUNCTION_L6_SITE } from "../sites/actTwo";
import { paletteAvailability } from "./fullPlant";
import type { ProcessFamilyId } from "../../types";

const JUNCTION_L6_PALETTE: readonly ProcessFamilyId[] = [
  "nickel",
  "carbon_steam",
  "chlorine_sodium",
];
const JUNCTION_L6_AVAILABILITY = paletteAvailability(JUNCTION_L6_PALETTE);
import { actTwoSupplies } from "./actTwoShared";
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const JUNCTION_L6_LEVEL: LevelDefinition = {
  id: "junction_l6",
  number: 7,
  palette: JUNCTION_L6_PALETTE,
  enemyLevel: 26,
  focusRoomId: "lower_intake",
  featuredReactionIds: [
    "nickel_oxide_reduction",
    "nickel_carbonyl_formation",
    "nickel_carbonyl_deposition",
    "nickel_catalyzed_methanation",
  ],
  startingMatter: 360,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actTwoSupplies("freight_intake", {
    capacity: 760,
    contents: { hydrogen: 300, oxygen: 120, carbon_monoxide: 260 },
    cost: 31,
  }),
  site: { kind: "generated", seed: ACT_TWO_SITE_SEEDS.junction_l6, spec: JUNCTION_L6_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      lower_intake: { surface_nickel: 28, nickel_oxide: 18 },
      furnace: { surface_nickel: 12 },
      reservoir: { iron_catalyst: 4, solid_carbon: 20 },
    },
  },
  rounds: [
    {
      id: "freight_intake",
      primeSeconds: 72,
      wave: enemySequence(1, "flintjack", 0.5, 1, -4),
      availability: JUNCTION_L6_AVAILABILITY,
    },
    {
      id: "emitter_manifest",
      primeSeconds: 72,
      wave: wave(enemySequence(1, "glowbag", 1, 1, -8), enemySequence(1, "clatter", 2, 1, -8)),
      availability: JUNCTION_L6_AVAILABILITY,
    },
    {
      id: "carrier_transfer",
      primeSeconds: 72,
      wave: enemySequence(1, "splitback", 1, 1, -6),
      availability: JUNCTION_L6_AVAILABILITY,
    },
    {
      id: "industrial_feed",
      primeSeconds: 72,
      wave: wave(
        enemySequence(5, "flintjack", 0.5, 1.5, -3),
        enemySequence(3, "clatter", 1, 1.8, -3),
        enemySequence(1, "glowbag", 2, 1, -2),
        enemySequence(1, "splitback", 4, 1, -8),
        enemySequence(1, "shear_jelly", 5, 1, -2)
      ),
      availability: JUNCTION_L6_AVAILABILITY,
    },
    {
      id: "qualification_run",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "flintjack", 0.5, 1, 1),
        enemySequence(4, "flintjack", 2, 1.5, -3),
        enemySequence(4, "clatter", 1, 1.8, -3),
        enemySequence(4, "splitback", 2.5, 2.5, -4),
        enemySequence(3, "redlung", 4, 2.7, -3),
        enemySequence(3, "glowbag", 5, 2.8, -3),
        enemySequence(1, "anchor", 7, 1, -2)
      ),
      availability: JUNCTION_L6_AVAILABILITY,
    },
  ],
};
