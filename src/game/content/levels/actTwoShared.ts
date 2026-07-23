import type { GasAmounts, LiquidAmounts, SiteSupplyDefinition } from "../../types";
import {
  GAS_RESERVOIR_ID,
  HAZARD_GAS_RESERVOIR_ID,
  HAZARD_LIQUID_RESERVOIR_ID,
  SPECIALTY_GAS_RESERVOIR_ID,
  LIQUID_RESERVOIR_A_ID,
  LIQUID_RESERVOIR_B_ID,
  gasSupply,
  liquidSupply,
} from "../supplies";

export interface HazardPacketOptions {
  gas?: {
    contents: Partial<GasAmounts>;
    capacity: number;
    cost: number;
    availableFromRound: string;
  };
  liquid?: {
    contents: Partial<LiquidAmounts>;
    capacity: number;
    cost: number;
    availableFromRound: string;
  };
}

/** Direct-supply hazard packets back the depth-one contract (ADR-0009). */
export const hazardPacketSupplies = (hazard: HazardPacketOptions): SiteSupplyDefinition[] => [
  ...(hazard.gas
    ? [
        gasSupply({
          id: HAZARD_GAS_RESERVOIR_ID,
          code: "G-3",
          capacity: hazard.gas.capacity,
          initial: hazard.gas.contents,
          availableFromRound: hazard.gas.availableFromRound,
          replenishment: {
            kind: "matter" as const,
            contents: hazard.gas.contents,
            cost: hazard.gas.cost,
          },
          accent: "#f56262",
        }),
      ]
    : []),
  ...(hazard.liquid
    ? [
        liquidSupply({
          id: HAZARD_LIQUID_RESERVOIR_ID,
          code: "L-3",
          capacity: hazard.liquid.capacity,
          initial: hazard.liquid.contents,
          availableFromRound: hazard.liquid.availableFromRound,
          replenishment: {
            kind: "matter" as const,
            contents: hazard.liquid.contents,
            cost: hazard.liquid.cost,
          },
          accent: "#b555f5",
        }),
      ]
    : []),
];

export const actTwoSupplies = (
  availableFromRound: string,
  gas: { capacity: number; contents: Partial<GasAmounts>; cost: number },
  hazard: HazardPacketOptions = {}
): readonly SiteSupplyDefinition[] => {
  const { hydrogen_fluoride: specialtyInventory = 0, ...ordinaryGas } = gas.contents;
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
              cost: Math.max(8, Math.round(gas.cost * 0.45)),
            },
            accent: "#c6ee86",
          }),
        ]
      : [];
  return [
    gasSupply({
      id: GAS_RESERVOIR_ID,
      code: "G-1",
      capacity: gas.capacity,
      initial: ordinaryGas,
      availableFromRound,
      replenishment: { kind: "matter", contents: ordinaryGas, cost: gas.cost },
      accent: "#ed9a48",
    }),
    ...specialty,
    liquidSupply({
      id: LIQUID_RESERVOIR_A_ID,
      code: "L-1",
      capacity: 220,
      initial: { water: 180 },
      availableFromRound,
      replenishment: { kind: "matter", contents: { water: 40 }, cost: 10 },
      accent: "#41baf5",
    }),
    liquidSupply({
      id: LIQUID_RESERVOIR_B_ID,
      code: "L-2",
      capacity: 220,
      initial: { sodium_chloride: 180 },
      availableFromRound,
      replenishment: { kind: "matter", contents: { sodium_chloride: 40 }, cost: 14 },
      accent: "#60cce4",
    }),
    ...hazardPacketSupplies(hazard),
  ];
};
