import type { GasAmounts, GasType, LiquidAmounts, LiquidType } from "../types";

export const MAX_CYCLES = 5;
export const MAX_ENERGY = 100;
export const AMBIENT_TEMPERATURE = 22;
export const SETTLE_DURATION = 6;

export const GAS_LABELS: Record<GasType, string> = {
  oxygen: "O₂",
  co2: "CO₂",
  toxic_gas: "Toxic",
  fuel_gas: "Fuel",
  steam: "Steam",
};

export const GAS_NAMES: Record<GasType, string> = {
  oxygen: "Oxygen",
  co2: "Carbon dioxide",
  toxic_gas: "Toxic gas",
  fuel_gas: "Fuel gas",
  steam: "Steam",
};

export const GAS_COLORS: Record<GasType, string> = {
  oxygen: "#82b9c5",
  co2: "#85918e",
  toxic_gas: "#b4dc45",
  fuel_gas: "#efa24f",
  steam: "#d7edf0",
};

export const LIQUID_LABELS: Record<LiquidType, string> = {
  water: "Water",
  acid: "Acid",
  caustic: "Caustic",
  sludge: "Sludge",
  neutral_liquid: "Neutral",
};

export const LIQUID_COLORS: Record<LiquidType, string> = {
  water: "#4ca9d6",
  acid: "#d7e53d",
  caustic: "#b06ddd",
  sludge: "#876a42",
  neutral_liquid: "#7d9ca2",
};

export const emptyGas = (): GasAmounts => ({
  oxygen: 0,
  co2: 0,
  toxic_gas: 0,
  fuel_gas: 0,
  steam: 0,
});

export const ambientGas = (): GasAmounts => ({
  oxygen: 88,
  co2: 12,
  toxic_gas: 0,
  fuel_gas: 0,
  steam: 0,
});

export const emptyLiquid = (): LiquidAmounts => ({
  water: 0,
  acid: 0,
  caustic: 0,
  sludge: 0,
  neutral_liquid: 0,
});
