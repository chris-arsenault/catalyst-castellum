import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout, gasRun, liquidRun } from "./helpers";

const reagentRoundOne = availability({
  equipment: ["membrane_cell"],
  gasRuns: ["cell_absorber"],
  liquidRuns: ["core_cell"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

const reagentRoundTwo = availability({
  ...reagentRoundOne,
  gasRuns: ["cell_absorber", "core_cell"],
});

export const MAKE_THE_REAGENT_LEVEL: LevelDefinition = {
  id: "make_the_reagent",
  number: 2,
  focusRoomId: "lower_intake",
  startingMatter: 28,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  loadout: {
    ...emptyLoadout(),
    gasConduits: { cell_absorber: gasRun(true), core_cell: gasRun(false) },
    liquidConduits: { core_cell: liquidRun(false) },
    liquidSourceAmounts: { water_tank: 120, sodium_chloride_tank: 120 },
  },
  rounds: [
    {
      id: "co_products",
      primeSeconds: 25,
      wave: enemySequence(5, "crawler", 10.5, 2),
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
