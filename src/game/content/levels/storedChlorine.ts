import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_I_AVAILABILITY } from "./fullPlant";
import { emptyLoadout, gasRun, liquidRun } from "./helpers";
import {
  BRINE_CHARGE,
  GAS_RESERVOIR_ID,
  LIQUID_RESERVOIR_A_ID,
  LIQUID_RESERVOIR_B_ID,
  REACTANT_GAS_CHARGE,
  WATER_CHARGE,
  gasSupply,
  liquidSupply,
} from "../supplies";

export const STORED_CHLORINE_LEVEL: LevelDefinition = {
  id: "stored_chlorine",
  number: 3,
  enemyLevel: 22,
  focusRoomId: "reservoir",
  featuredReactionIds: ["hypochlorite_formation", "acid_chlorine_release"],
  startingMatter: 42,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: [
    gasSupply({
      id: GAS_RESERVOIR_ID,
      code: "G-1",
      capacity: 150,
      initial: { hydrogen: 100, oxygen: 50 },
      availableFromRound: "store",
      replenishment: { kind: "unlimited", contents: REACTANT_GAS_CHARGE },
      accent: "#ed9a48",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_A_ID,
      code: "L-1",
      capacity: 180,
      initial: { water: 150 },
      availableFromRound: "store",
      replenishment: { kind: "matter", contents: WATER_CHARGE, cost: 7 },
      accent: "#41baf5",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_B_ID,
      code: "L-2",
      capacity: 180,
      initial: { sodium_chloride: 150 },
      availableFromRound: "store",
      replenishment: { kind: "matter", contents: BRINE_CHARGE, cost: 10 },
      accent: "#60cce4",
    }),
  ],
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
  },
  rounds: [
    {
      id: "store",
      primeSeconds: 34,
      wave: enemySequence(4, "deckmouth", 6, 4),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "release",
      primeSeconds: 25,
      wave: [...enemySequence(2, "redlung", 4, 4), ...enemySequence(3, "splitback", 6, 4)].sort(
        (left, right) => left.at - right.at
      ),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "recirculate",
      primeSeconds: 18,
      wave: [
        ...enemySequence(4, "flintjack", 1, 2),
        ...enemySequence(2, "shear_jelly", 4, 3),
        ...enemySequence(2, "glowbag", 3, 4),
      ].sort((left, right) => left.at - right.at),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "armored_storage",
      primeSeconds: 22,
      wave: [
        ...enemySequence(3, "splitback", 1, 3.4),
        ...enemySequence(3, "redlung", 3, 3.8),
        ...enemySequence(1, "anchor", 4, 1),
      ].sort((left, right) => left.at - right.at),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "release_exam",
      primeSeconds: 20,
      wave: [
        ...enemySequence(4, "flintjack", 0.5, 1.6),
        ...enemySequence(2, "splitback", 2.5, 3.2),
        ...enemySequence(1, "shear_jelly", 5, 3.6),
        ...enemySequence(3, "clatter", 2, 2.7),
        ...enemySequence(2, "glowbag", 4, 4),
        ...enemySequence(1, "anchor", 5, 1),
      ].sort((left, right) => left.at - right.at),
      availability: ACT_I_AVAILABILITY,
    },
  ],
};
