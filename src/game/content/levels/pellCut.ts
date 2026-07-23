import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_TWO_SITE_SEEDS, PELL_CUT_SITE } from "../sites/actTwo";
import { paletteAvailability } from "./fullPlant";
import type { ProcessFamilyId } from "../../types";

const PELL_CUT_PALETTE: readonly ProcessFamilyId[] = [
  "uranium_fluorine",
  "chlorine_sodium",
  "nickel",
];
const PELL_CUT_AVAILABILITY = paletteAvailability(PELL_CUT_PALETTE);
import { actTwoSupplies } from "./actTwoShared";
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const PELL_CUT_LEVEL: LevelDefinition = {
  id: "pell_cut",
  number: 8,
  palette: PELL_CUT_PALETTE,
  enemyLevel: 27,
  focusRoomId: "furnace",
  featuredReactionIds: ["hydrogen_fluoride_electrolysis"],
  startingMatter: 400,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  supplies: actTwoSupplies(
    "array_one",
    {
      capacity: 700,
      contents: { hydrogen: 220, oxygen: 110, hydrogen_fluoride: 300 },
      cost: 36,
    },
    {
      gas: {
        contents: { chlorine: 30 },
        capacity: 45,
        cost: 16,
        availableFromRound: "array_one",
      },
    }
  ),
  site: { kind: "generated", seed: ACT_TWO_SITE_SEEDS.pell_cut, spec: PELL_CUT_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { iron_catalyst: 4 },
      lower_intake: { surface_nickel: 18, nickel_oxide: 12 },
    },
  },
  rounds: [
    {
      id: "array_one",
      primeSeconds: 72,
      wave: enemySequence(1, "deckmouth", 1, 1, -8),
      availability: PELL_CUT_AVAILABILITY,
    },
    {
      id: "array_two",
      primeSeconds: 72,
      wave: wave(
        enemySequence(2, "clatter", 0.5, 1.7, -2),
        enemySequence(1, "shear_jelly", 2, 1, -8),
        enemySequence(1, "glowbag", 3, 1, -8)
      ),
      availability: PELL_CUT_AVAILABILITY,
    },
    {
      id: "array_three",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "splitback", 1, 1, -8),
        enemySequence(1, "redlung", 2, 1, -6),
        enemySequence(1, "anchor", 4, 1, -5)
      ),
      availability: PELL_CUT_AVAILABILITY,
    },
    {
      id: "array_four",
      primeSeconds: 72,
      wave: wave(
        enemySequence(7, "flintjack", 0.5, 1.4, -6),
        enemySequence(5, "deckmouth", 2, 2.4, -7),
        enemySequence(1, "glowbag", 3, 1, -5)
      ),
      availability: PELL_CUT_AVAILABILITY,
    },
    {
      id: "synchronized_cut",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "flintjack", 0.5, 1, 1),
        enemySequence(4, "flintjack", 2, 1.35, -4),
        enemySequence(5, "clatter", 1, 1.6, -4),
        enemySequence(1, "splitback", 2.5, 1, -12),
        enemySequence(4, "redlung", 3.5, 2.4, -5),
        enemySequence(1, "glowbag", 4.5, 1, -8),
        enemySequence(1, "shear_jelly", 5.5, 1, -8),
        enemySequence(1, "anchor", 8, 1, -3)
      ),
      availability: PELL_CUT_AVAILABILITY,
    },
  ],
};
