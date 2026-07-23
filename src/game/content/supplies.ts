import type {
  GasAmounts,
  GasSupplyDefinition,
  LiquidAmounts,
  LiquidSupplyDefinition,
} from "../types";

export const GAS_RESERVOIR_ID = "gas_reservoir";
export const SPECIALTY_GAS_RESERVOIR_ID = "specialty_gas_reservoir";
export const HAZARD_GAS_RESERVOIR_ID = "hazard_gas_reservoir";
export const LIQUID_RESERVOIR_A_ID = "liquid_reservoir_a";
export const LIQUID_RESERVOIR_B_ID = "liquid_reservoir_b";
export const HAZARD_LIQUID_RESERVOIR_ID = "hazard_liquid_reservoir";

export const REACTANT_GAS_CHARGE: Partial<GasAmounts> = { hydrogen: 20, oxygen: 10 };
export const WATER_CHARGE: Partial<LiquidAmounts> = { water: 28 };
export const BRINE_CHARGE: Partial<LiquidAmounts> = { sodium_chloride: 28 };

export const gasSupply = (definition: Omit<GasSupplyDefinition, "phase">): GasSupplyDefinition => ({
  ...definition,
  phase: "gas",
});

export const liquidSupply = (
  definition: Omit<LiquidSupplyDefinition, "phase">
): LiquidSupplyDefinition => ({ ...definition, phase: "liquid" });
