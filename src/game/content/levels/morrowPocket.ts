import type { LevelDefinition } from "../../definitionTypes";
import { MORROW_POCKET_WAVES } from "../enemies";
import { ACT_I_AVAILABILITY } from "./fullPlant";
import { emptyLoadout } from "./helpers";
import {
  BRINE_CHARGE,
  GAS_RESERVOIR_ID,
  LIQUID_RESERVOIR_A_ID,
  LIQUID_RESERVOIR_B_ID,
  WATER_CHARGE,
  gasSupply,
  liquidSupply,
} from "../supplies";

const MORROW_POCKET_ROUND_IDS = [
  "claim_entry",
  "split_levels",
  "armored_claim",
  "support_wake",
  "whole_pocket",
] as const;

export const MORROW_POCKET_LEVEL: LevelDefinition = {
  id: "morrow_pocket",
  number: 4,
  enemyLevel: 23,
  focusRoomId: "lower_intake",
  featuredReactionIds: [
    "chlor_alkali_electrolysis",
    "hydrogen_chlorine_recombination",
    "hypochlorite_formation",
    "acid_chlorine_release",
  ],
  startingMatter: 150,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  supplies: [
    gasSupply({
      id: GAS_RESERVOIR_ID,
      code: "G-1",
      capacity: 450,
      initial: { hydrogen: 300, oxygen: 150 },
      availableFromRound: "claim_entry",
      replenishment: {
        kind: "matter",
        contents: { hydrogen: 300, oxygen: 150 },
        cost: 12,
      },
      accent: "#ed9a48",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_A_ID,
      code: "L-1",
      capacity: 180,
      initial: { water: 140 },
      availableFromRound: "claim_entry",
      replenishment: { kind: "matter", contents: WATER_CHARGE, cost: 7 },
      accent: "#41baf5",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_B_ID,
      code: "L-2",
      capacity: 180,
      initial: { sodium_chloride: 140 },
      availableFromRound: "claim_entry",
      replenishment: { kind: "matter", contents: BRINE_CHARGE, cost: 10 },
      accent: "#60cce4",
    }),
  ],
  site: null,
  loadout: emptyLoadout(),
  rounds: MORROW_POCKET_WAVES.map((wave, index) => ({
    id: MORROW_POCKET_ROUND_IDS[index]!,
    primeSeconds: 72,
    wave,
    availability: ACT_I_AVAILABILITY,
  })),
};
