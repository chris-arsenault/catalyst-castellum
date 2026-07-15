import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout, gasRun, liquidRun } from "./helpers";

const acidAvailability = availability({
  equipment: ["membrane_cell", "thermal_coil", "gas_agitator"],
  gasRuns: ["cell_furnace", "furnace_return", "return_final"],
  liquidRuns: ["core_cell"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

export const ACID_LINE_LEVEL: LevelDefinition = {
  id: "acid_line",
  number: 3,
  focusRoomId: "furnace",
  featuredReactionIds: ["hydrogen_chlorine_recombination"],
  startingMatter: 42,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  loadout: {
    ...emptyLoadout(),
    equipment: {
      lower_intake: {
        socket_a: { equipmentId: "membrane_cell", level: 1, enabled: true },
      },
    },
    gasConduits: {
      cell_furnace: gasRun(false),
      furnace_return: gasRun(false),
      return_final: gasRun(false),
    },
    liquidConduits: { core_cell: liquidRun(false) },
    liquidSourceAmounts: { water_tank: 130, sodium_chloride_tank: 130 },
    gasBuffers: { anode_header: { chlorine: 16 }, cathode_header: { hydrogen: 16 } },
  },
  rounds: [
    {
      id: "hot_mix",
      primeSeconds: 30,
      wave: enemySequence(5, "shell", 0.5, 3.2),
      availability: acidAvailability,
    },
    {
      id: "residence_time",
      primeSeconds: 14,
      wave: [...enemySequence(6, "skimmer", 0.5, 1.6), ...enemySequence(2, "floater", 2, 2.5)].sort(
        (left, right) => left.at - right.at
      ),
      availability: acidAvailability,
    },
  ],
};
