import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ALL_AVAILABILITY } from "./fullPlant";
import { emptyLoadout, gasRun, liquidRun } from "./helpers";

export const STORED_CHLORINE_LEVEL: LevelDefinition = {
  id: "stored_chlorine",
  number: 3,
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
    {
      id: "recirculate",
      primeSeconds: 18,
      wave: [...enemySequence(6, "skimmer", 1, 2), ...enemySequence(2, "floater", 4, 3)].sort(
        (left, right) => left.at - right.at
      ),
      availability: ALL_AVAILABILITY,
    },
    {
      id: "armored_storage",
      primeSeconds: 22,
      wave: [...enemySequence(4, "shell", 1, 3.4), ...enemySequence(3, "bellows", 3, 3.8)].sort(
        (left, right) => left.at - right.at
      ),
      availability: ALL_AVAILABILITY,
    },
    {
      id: "release_exam",
      primeSeconds: 20,
      wave: [
        ...enemySequence(8, "skimmer", 0.5, 1.6),
        ...enemySequence(3, "shell", 2.5, 3.2),
        ...enemySequence(2, "floater", 5, 3.6),
      ].sort((left, right) => left.at - right.at),
      availability: ALL_AVAILABILITY,
    },
  ],
};
