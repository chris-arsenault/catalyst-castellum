import type { GasAmounts, SpeciesDefinition, SpeciesId } from "../types";
import { emptyGas as makeEmptyGas } from "../materials";
import { ADVANCED_GAS_DEFINITIONS } from "./species/advancedGases";
import { BASE_GAS_DEFINITIONS } from "./species/baseGases";
import { LIQUID_DEFINITIONS } from "./species/liquids";
import { STATIONARY_DEFINITIONS } from "./species/stationary";

export {
  GAS_COLORS,
  GAS_LABELS,
  LIQUID_COLORS,
  LIQUID_LABELS,
  STATIONARY_COLORS,
  STATIONARY_LABELS,
} from "./substancePresentation";

export const MAX_CYCLES = 3;
export const AMBIENT_TEMPERATURE = 22;

export const SPECIES_DEFINITIONS: Record<SpeciesId, SpeciesDefinition> = {
  ...BASE_GAS_DEFINITIONS,
  ...ADVANCED_GAS_DEFINITIONS,
  ...LIQUID_DEFINITIONS,
  ...STATIONARY_DEFINITIONS,
};

export { emptyGas, emptyLiquid } from "../materials";

export const ambientGas = (): GasAmounts => ({
  ...makeEmptyGas(),
  oxygen: 21,
  nitrogen: 78,
  carbon_dioxide: 1,
});
