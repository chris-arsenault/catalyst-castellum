import { GAS_TYPES, LIQUID_TYPES, type GasAmounts, type LiquidAmounts } from "./types";

export const emptyGas = (): GasAmounts =>
  Object.fromEntries(GAS_TYPES.map((speciesId) => [speciesId, 0])) as GasAmounts;

export const emptyLiquid = (): LiquidAmounts =>
  Object.fromEntries(LIQUID_TYPES.map((speciesId) => [speciesId, 0])) as LiquidAmounts;
