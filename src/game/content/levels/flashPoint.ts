import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout, gasRun } from "./helpers";

const flashAvailability = availability({
  equipment: ["gas_agitator"],
  gasRuns: ["core_furnace"],
  gasSources: ["starter_gas_header"],
});

export const FLASH_POINT_LEVEL: LevelDefinition = {
  id: "flash_point",
  number: 1,
  focusRoomId: "furnace",
  featuredReactionIds: ["hydrogen_oxygen_combustion"],
  startingMatter: 16,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  loadout: {
    ...emptyLoadout(),
    gasConduits: { core_furnace: gasRun(false) },
    gasSourceGas: { starter_gas_header: { hydrogen: 76, oxygen: 38 } },
  },
  rounds: [
    {
      id: "first_spark",
      primeSeconds: 24,
      wave: enemySequence(10, "crawler", 0.5, 2.2),
      availability: flashAvailability,
    },
    {
      id: "stored_momentum",
      primeSeconds: 10,
      wave: [
        ...enemySequence(6, "skimmer", 0.5, 1.65),
        ...enemySequence(2, "crawler", 2.2, 2.5),
      ].sort((left, right) => left.at - right.at),
      availability: flashAvailability,
    },
  ],
};
