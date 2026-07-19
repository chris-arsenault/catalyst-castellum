import type { GasAmounts, SiteSupplyDefinition } from "../../types";
import {
  GAS_RESERVOIR_ID,
  SPECIALTY_GAS_RESERVOIR_ID,
  LIQUID_RESERVOIR_A_ID,
  LIQUID_RESERVOIR_B_ID,
  gasSupply,
  liquidSupply,
} from "../supplies";

interface ActThreeSupplyOptions {
  gasCapacity: number;
  gasContents: Partial<GasAmounts>;
  gasCost: number;
  water: number;
  brine: number;
  liquidCapacity: number;
  waterCost: number;
  brineCost: number;
}

/** Late sites vary feed inventory and price while preserving the established three-reservoir grammar. */
export const actThreeSupplies = (
  availableFromRound: string,
  options: ActThreeSupplyOptions
): readonly SiteSupplyDefinition[] => {
  const { hydrogen_fluoride: specialtyInventory = 0, ...ordinaryGas } = options.gasContents;
  const specialty =
    specialtyInventory > 0
      ? [
          gasSupply({
            id: SPECIALTY_GAS_RESERVOIR_ID,
            code: "G-2",
            capacity: specialtyInventory,
            initial: { hydrogen_fluoride: specialtyInventory },
            availableFromRound,
            replenishment: {
              kind: "matter" as const,
              contents: { hydrogen_fluoride: specialtyInventory },
              cost: Math.max(8, Math.round(options.gasCost * 0.45)),
            },
            accent: "#c6ee86",
          }),
        ]
      : [];
  return [
    gasSupply({
      id: GAS_RESERVOIR_ID,
      code: "G-1",
      capacity: options.gasCapacity,
      initial: ordinaryGas,
      availableFromRound,
      replenishment: { kind: "matter", contents: ordinaryGas, cost: options.gasCost },
      accent: "#d7d184",
    }),
    ...specialty,
    liquidSupply({
      id: LIQUID_RESERVOIR_A_ID,
      code: "L-1",
      capacity: options.liquidCapacity,
      initial: { water: options.water },
      availableFromRound,
      replenishment: { kind: "matter", contents: { water: 40 }, cost: options.waterCost },
      accent: "#41baf5",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_B_ID,
      code: "L-2",
      capacity: options.liquidCapacity,
      initial: { sodium_chloride: options.brine },
      availableFromRound,
      replenishment: {
        kind: "matter",
        contents: { sodium_chloride: 40 },
        cost: options.brineCost,
      },
      accent: "#60cce4",
    }),
  ];
};
