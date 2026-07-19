import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_THREE_SITE_SEEDS, PELL_CORDON_SITE } from "../sites/actThree";
import { actThreeSupplies } from "./actThreeShared";
import { ACT_II_AVAILABILITY } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const PELL_CORDON_LEVEL: LevelDefinition = {
  id: "pell_cordon",
  number: 12,
  enemyLevel: 31,
  focusRoomId: "furnace",
  featuredReactionIds: [
    "hydrogen_oxygen_combustion",
    "acid_chlorine_release",
    "ammonia_oxidation",
    "nickel_carbonyl_deposition",
    "uranium_hexafluoride_hydrolysis",
    "uranyl_fluoride_recovery",
  ],
  startingMatter: 520,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  supplies: actThreeSupplies("outer_boundary", {
    gasCapacity: 1_500,
    gasContents: {
      hydrogen: 420,
      oxygen: 210,
      nitrogen: 260,
      carbon_monoxide: 180,
      hydrogen_fluoride: 260,
    },
    gasCost: 52,
    water: 260,
    brine: 260,
    liquidCapacity: 300,
    waterCost: 15,
    brineCost: 19,
  }),
  site: { kind: "generated", seed: ACT_THREE_SITE_SEEDS.pell_cordon, spec: PELL_CORDON_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      switchyard: { hematite: 30, magnetite: 14 },
      furnace: { solid_carbon: 38, iron_catalyst: 6 },
      gallery: { platinum_catalyst: 5, surface_nickel: 20, uranyl_fluoride: 48 },
      lower_intake: { nickel_oxide: 20, surface_nickel: 22 },
    },
  },
  rounds: [
    {
      id: "outer_boundary",
      primeSeconds: 72,
      wave: wave(
        enemySequence(3, "deckmouth", 0.5, 1.8, -11),
        enemySequence(2, "clatter", 2, 2, -11)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "copied_cadence",
      primeSeconds: 72,
      wave: wave(
        enemySequence(8, "flintjack", 0.5, 1.2, -10),
        enemySequence(4, "glowbag", 2, 2.5, -10),
        enemySequence(3, "shear_jelly", 3, 2.8, -10)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "closure_load",
      primeSeconds: 72,
      wave: wave(
        enemySequence(5, "splitback", 1, 2.5, -10),
        enemySequence(4, "redlung", 2, 2.6, -9),
        enemySequence(3, "clatter", 3, 2.1, -9),
        enemySequence(1, "anchor", 5, 1, -10)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "counter_pattern",
      primeSeconds: 72,
      wave: wave(
        enemySequence(10, "flintjack", 0.5, 1.05, -9),
        enemySequence(7, "deckmouth", 1, 1.45, -9),
        enemySequence(4, "splitback", 2, 2.3, -9),
        enemySequence(4, "redlung", 3, 2.4, -8),
        enemySequence(3, "glowbag", 4, 2.5, -9),
        enemySequence(3, "shear_jelly", 5, 2.6, -8)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "near_voice",
      primeSeconds: 72,
      wave: wave(
        enemySequence(9, "flintjack", 0.5, 1.05, -7),
        enemySequence(1, "deckmouth", 1, 1, 1),
        enemySequence(6, "deckmouth", 2.4, 1.4, -7),
        enemySequence(6, "splitback", 2, 2.1, -8),
        enemySequence(5, "redlung", 2.5, 2.2, -7),
        enemySequence(5, "clatter", 3, 1.8, -6),
        enemySequence(4, "glowbag", 4, 2.3, -7),
        enemySequence(3, "shear_jelly", 5, 2.5, -6),
        enemySequence(1, "anchor", 7, 1, -4)
      ),
      availability: ACT_II_AVAILABILITY,
    },
  ],
};
