import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout, gasRun, liquidRun } from "./helpers";
import { CHLOR_ALKALI_SITE, CHLOR_ALKALI_TUTORIAL_SEED } from "../sites/chlorAlkali";

const reagentRoundOne = availability({
  equipment: ["membrane_cell"],
  gasLines: ["gas:lower_intake__reservoir"],
  liquidLines: ["liquid:core__lower_intake"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

const reagentRoundTwo = availability({
  ...reagentRoundOne,
  gasLines: ["gas:lower_intake__reservoir", "gas:core__lower_intake"],
});

export const MAKE_THE_REAGENT_LEVEL: LevelDefinition = {
  id: "make_the_reagent",
  number: 2,
  focusRoomId: "lower_intake",
  featuredReactionIds: ["chlor_alkali_electrolysis"],
  startingMatter: 28,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  loadout: {
    ...emptyLoadout(),
    gasConduits: {
      "gas:lower_intake__reservoir": gasRun(true),
      "gas:core__lower_intake": gasRun(false),
    },
    liquidConduits: { "liquid:core__lower_intake": liquidRun(false) },
    liquidSourceAmounts: { water_tank: 120, sodium_chloride_tank: 120 },
  },
  site: { kind: "generated", seed: CHLOR_ALKALI_TUTORIAL_SEED, spec: CHLOR_ALKALI_SITE },
  rounds: [
    {
      id: "co_products",
      primeSeconds: 25,
      wave: enemySequence(5, "crawler", 10.5, 2, 0.2),
      availability: reagentRoundOne,
    },
    {
      id: "shared_relief",
      primeSeconds: 14,
      wave: enemySequence(9, "skimmer", 0.5, 1.45),
      availability: reagentRoundTwo,
    },
  ],
};
