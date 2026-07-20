import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout, gasRun, liquidRun } from "./helpers";
import { CHLOR_ALKALI_SITE, CHLOR_ALKALI_TUTORIAL_SEED } from "../sites/chlorAlkali";
import {
  BRINE_CHARGE,
  LIQUID_RESERVOIR_A_ID,
  LIQUID_RESERVOIR_B_ID,
  WATER_CHARGE,
  liquidSupply,
} from "../supplies";

const reagentRoundOne = availability({
  equipment: ["membrane_cell"],
  gasLines: ["gas:lower_intake__reservoir"],
  liquidLines: ["liquid:core__lower_intake"],
});

const reagentRoundTwo = availability({
  ...reagentRoundOne,
  gasLines: ["gas:lower_intake__reservoir", "gas:core__lower_intake"],
});

const acidRounds = availability({
  equipment: ["membrane_cell", "thermal_coil", "gas_agitator"],
  gasLines: [
    "gas:lower_intake__reservoir",
    "gas:core__lower_intake",
    "gas:furnace__lower_intake",
    "gas:furnace__gallery",
    "gas:gallery__washlock",
  ],
  liquidLines: ["liquid:core__lower_intake"],
});

export const MAKE_THE_REAGENT_LEVEL: LevelDefinition = {
  id: "make_the_reagent",
  number: 2,
  enemyLevel: 21,
  focusRoomId: "lower_intake",
  featuredReactionIds: ["chlor_alkali_electrolysis", "hydrogen_chlorine_recombination"],
  startingMatter: 28,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: [
    liquidSupply({
      id: LIQUID_RESERVOIR_A_ID,
      code: "L-1",
      capacity: 180,
      initial: { water: 120 },
      availableFromRound: "co_products",
      replenishment: { kind: "matter", contents: WATER_CHARGE, cost: 7 },
      accent: "#41baf5",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_B_ID,
      code: "L-2",
      capacity: 180,
      initial: { sodium_chloride: 120 },
      availableFromRound: "co_products",
      replenishment: { kind: "matter", contents: BRINE_CHARGE, cost: 10 },
      accent: "#60cce4",
    }),
  ],
  loadout: {
    ...emptyLoadout(),
    gasConduits: {
      "gas:lower_intake__reservoir": gasRun(true),
      "gas:core__lower_intake": gasRun(false),
      "gas:furnace__lower_intake": gasRun(false),
      "gas:furnace__gallery": gasRun(false),
      "gas:gallery__washlock": gasRun(false),
    },
    liquidConduits: { "liquid:core__lower_intake": liquidRun(false) },
  },
  site: { kind: "generated", seed: CHLOR_ALKALI_TUTORIAL_SEED, spec: CHLOR_ALKALI_SITE },
  rounds: [
    {
      id: "co_products",
      primeSeconds: 25,
      wave: enemySequence(5, "deckmouth", 10.5, 2, -18),
      availability: reagentRoundOne,
    },
    {
      id: "shared_relief",
      primeSeconds: 14,
      wave: enemySequence(9, "flintjack", 0.5, 1.45),
      availability: reagentRoundTwo,
    },
    {
      id: "hot_mix",
      primeSeconds: 30,
      wave: enemySequence(5, "splitback", 0.5, 1, 8),
      availability: acidRounds,
    },
    {
      id: "residence_time",
      primeSeconds: 14,
      wave: [
        ...enemySequence(3, "flintjack", 0.5, 1.6, 8),
        ...enemySequence(2, "shear_jelly", 2, 2.5, 8),
        ...enemySequence(3, "clatter", 3, 2.4, 8),
      ].sort((left, right) => left.at - right.at),
      availability: acidRounds,
    },
    {
      id: "full_chain",
      primeSeconds: 18,
      wave: [
        ...enemySequence(6, "flintjack", 0.5, 1.4, 8),
        ...enemySequence(4, "splitback", 2, 2.8, 8),
        ...enemySequence(2, "shear_jelly", 4, 2.6, 8),
        ...enemySequence(2, "glowbag", 5, 4, 8),
        ...enemySequence(1, "anchor", 6, 1, 8),
      ].sort((left, right) => left.at - right.at),
      availability: acidRounds,
    },
  ],
};
