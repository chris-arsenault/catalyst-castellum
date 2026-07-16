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
  site: null,
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
      "gas:furnace__lower_intake": gasRun(true),
      "gas:lower_intake__reservoir": gasRun(false),
      "gas:furnace__gallery": gasRun(true),
      "gas:gallery__washlock": gasRun(true),
      "gas:core__washlock": gasRun(true),
    },
    liquidConduits: {
      "liquid:core__lower_intake": liquidRun(false),
      "liquid:lower_intake__reservoir": liquidRun(true),
      "liquid:core__washlock": liquidRun(true),
      "liquid:reservoir__washlock": liquidRun(false),
      "liquid:core__reservoir": liquidRun(false),
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
