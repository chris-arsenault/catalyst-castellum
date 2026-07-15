import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ALL_AVAILABILITY } from "./fullPlant";
import { emptyLoadout, gasRun, liquidRun } from "./helpers";

export const STORED_CHLORINE_LEVEL: LevelDefinition = {
  id: "stored_chlorine",
  number: 4,
  focusRoomId: "reservoir",
  featuredReactionIds: ["hypochlorite_formation", "acid_chlorine_release"],
  startingMatter: 42,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  loadout: {
    ...emptyLoadout(),
    equipment: {
      furnace: {
        socket_a: { equipmentId: "thermal_coil", level: 1, enabled: true },
        socket_b: { equipmentId: "gas_agitator", level: 1, enabled: true },
      },
      lower_intake: {
        socket_a: { equipmentId: "membrane_cell", level: 1, enabled: true },
      },
    },
    gasConduits: {
      cell_furnace: gasRun(true),
      cell_absorber: gasRun(false),
      furnace_return: gasRun(true),
      return_final: gasRun(true),
      core_final: gasRun(true),
    },
    liquidConduits: {
      core_cell: liquidRun(false),
      cell_absorber: liquidRun(true),
      core_final: liquidRun(true),
      absorber_final: liquidRun(false),
      core_absorber: liquidRun(false),
    },
    liquidSourceAmounts: { water_tank: 150, sodium_chloride_tank: 150 },
  },
  rounds: [
    {
      id: "store",
      primeSeconds: 34,
      wave: enemySequence(4, "crawler", 6, 4),
      availability: ALL_AVAILABILITY,
    },
    {
      id: "release",
      primeSeconds: 25,
      wave: [...enemySequence(2, "bellows", 4, 4), ...enemySequence(3, "shell", 6, 4)].sort(
        (left, right) => left.at - right.at
      ),
      availability: ALL_AVAILABILITY,
    },
  ],
};
