import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_THREE_SITE_SEEDS, VASKER_STORE_SITE } from "../sites/actThree";
import { actThreeSupplies } from "./actThreeShared";
import { paletteAvailability } from "./fullPlant";
import type { ProcessFamilyId } from "../../types";

const VASKER_STORE_PALETTE: readonly ProcessFamilyId[] = [
  "chlorine_sodium",
  "nitrogen_oxide",
  "iron",
];
const VASKER_STORE_AVAILABILITY = paletteAvailability(VASKER_STORE_PALETTE);
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const VASKER_STORE_LEVEL: LevelDefinition = {
  id: "vasker_store",
  number: 10,
  palette: VASKER_STORE_PALETTE,
  enemyLevel: 29,
  focusRoomId: "reservoir",
  featuredReactionIds: [
    "uranium_hexafluoride_hydrolysis",
    "ammonia_oxidation",
    "nickel_carbonyl_deposition",
  ],
  startingMatter: 460,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actThreeSupplies("outer_store", {
    gasCapacity: 1_050,
    gasContents: {
      hydrogen: 300,
      oxygen: 150,
      nitrogen: 230,
    },
    gasCost: 42,
    water: 220,
    brine: 220,
    liquidCapacity: 260,
    hazard: {
      gas: {
        contents: { chlorine: 60, ammonia: 25 },
        capacity: 110,
        cost: 22,
        availableFromRound: "outer_store",
      },
      liquid: {
        contents: { hydrochloric_acid: 24 },
        capacity: 36,
        cost: 22,
        availableFromRound: "outer_store",
      },
    },
    waterCost: 13,
    brineCost: 17,
  }),
  site: { kind: "generated", seed: ACT_THREE_SITE_SEEDS.vasker_store, spec: VASKER_STORE_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      switchyard: { hematite: 24, magnetite: 10 },
      furnace: { iron_catalyst: 5 },
      gallery: { platinum_catalyst: 4 },
    },
  },
  rounds: [
    {
      id: "outer_store",
      primeSeconds: 72,
      wave: enemySequence(2, "flintjack", 0.5, 2, -9),
      availability: VASKER_STORE_AVAILABILITY,
    },
    {
      id: "heavy_store",
      primeSeconds: 72,
      wave: wave(
        enemySequence(2, "splitback", 1, 3.4, -9),
        enemySequence(2, "redlung", 2, 3.2, -8)
      ),
      availability: VASKER_STORE_AVAILABILITY,
    },
    {
      id: "upper_store",
      primeSeconds: 72,
      wave: wave(
        enemySequence(3, "clatter", 0.5, 2, -8),
        enemySequence(2, "shear_jelly", 2, 3, -8),
        enemySequence(1, "glowbag", 3.5, 1, -9),
        enemySequence(1, "anchor", 5, 1, -9)
      ),
      availability: VASKER_STORE_AVAILABILITY,
    },
    {
      id: "overlap_cycle",
      primeSeconds: 72,
      wave: wave(
        enemySequence(7, "flintjack", 0.5, 1.45, -7),
        enemySequence(5, "deckmouth", 1.5, 2, -7),
        enemySequence(3, "redlung", 3, 2.7, -7),
        enemySequence(2, "glowbag", 4, 3.1, -7)
      ),
      availability: VASKER_STORE_AVAILABILITY,
    },
    {
      id: "closure_stock",
      primeSeconds: 72,
      wave: wave(
        enemySequence(6, "flintjack", 0.5, 1.45, -5),
        enemySequence(4, "deckmouth", 1, 1.8, -5),
        enemySequence(4, "splitback", 2, 2.7, -6),
        enemySequence(3, "redlung", 3, 2.8, -5),
        enemySequence(3, "clatter", 4, 2.3, -4),
        enemySequence(2, "glowbag", 5, 3, -5),
        enemySequence(1, "shear_jelly", 6, 1, 1),
        enemySequence(1, "anchor", 7.5, 1, -6)
      ),
      availability: VASKER_STORE_AVAILABILITY,
    },
  ],
};
