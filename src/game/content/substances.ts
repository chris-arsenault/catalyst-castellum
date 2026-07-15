import type { GasAmounts, GasType, LiquidType, SpeciesDefinition, SpeciesId } from "../types";

export const MAX_CYCLES = 3;
export const AMBIENT_TEMPERATURE = 22;

export const GAS_LABELS: Record<GasType, string> = {
  oxygen: "O₂",
  nitrogen: "N₂",
  carbon_dioxide: "CO₂",
  chlorine: "Cl₂",
  hydrogen: "H₂",
  hydrogen_chloride: "HCl",
  steam: "H₂O(g)",
};

export const GAS_COLORS: Record<GasType, string> = {
  oxygen: "#73c3d4",
  nitrogen: "#507c74",
  carbon_dioxide: "#8b9f9a",
  chlorine: "#c5f540",
  hydrogen: "#f5a249",
  hydrogen_chloride: "#f6cd5c",
  steam: "#d1f1f6",
};

export const LIQUID_LABELS: Record<LiquidType, string> = {
  water: "H₂O",
  sodium_chloride: "NaCl(aq)",
  sodium_hydroxide: "NaOH(aq)",
  sodium_hypochlorite: "NaOCl(aq)",
  hydrochloric_acid: "HCl(aq)",
};

export const LIQUID_COLORS: Record<LiquidType, string> = {
  water: "#41baf5",
  sodium_chloride: "#60cce4",
  sodium_hydroxide: "#b555f5",
  sodium_hypochlorite: "#ade253",
  hydrochloric_acid: "#f5844a",
};

export const SPECIES_DEFINITIONS: Record<SpeciesId, SpeciesDefinition> = {
  oxygen: {
    id: "oxygen",
    formula: GAS_LABELS.oxygen,
    phase: "gas",
    elements: { O: 2 },
    molarMass: 31.998,
    referenceDensity: 1.105,
    color: GAS_COLORS.oxygen,
    hazards: [
      {
        basis: "gas_partial_ratio",
        direction: "below",
        threshold: 0.13,
        rate: 58,
        channel: "atmosphere",
        exposure: "oxygen_breathers",
      },
    ],
  },
  nitrogen: {
    id: "nitrogen",
    formula: GAS_LABELS.nitrogen,
    phase: "gas",
    elements: { N: 2 },
    molarMass: 28.014,
    referenceDensity: 0.967,
    color: GAS_COLORS.nitrogen,
    hazards: [],
  },
  carbon_dioxide: {
    id: "carbon_dioxide",
    formula: GAS_LABELS.carbon_dioxide,
    phase: "gas",
    elements: { C: 1, O: 2 },
    molarMass: 44.01,
    referenceDensity: 1.519,
    color: GAS_COLORS.carbon_dioxide,
    hazards: [
      {
        basis: "gas_partial_ratio",
        direction: "above",
        threshold: 0.14,
        rate: 24,
        channel: "atmosphere",
        exposure: "oxygen_breathers",
      },
    ],
  },
  chlorine: {
    id: "chlorine",
    formula: GAS_LABELS.chlorine,
    phase: "gas",
    elements: { Cl: 2 },
    molarMass: 70.9,
    referenceDensity: 2.447,
    color: GAS_COLORS.chlorine,
    hazards: [
      {
        basis: "gas_partial_ratio",
        direction: "above",
        threshold: 0.004,
        rate: 1260,
        channel: "atmosphere",
        exposure: "all",
      },
      {
        basis: "gas_partial_ratio",
        direction: "above",
        threshold: 0.004,
        rate: 960,
        channel: "corrosion",
        exposure: "all",
      },
    ],
  },
  hydrogen: {
    id: "hydrogen",
    formula: GAS_LABELS.hydrogen,
    phase: "gas",
    elements: { H: 2 },
    molarMass: 2.016,
    referenceDensity: 0.07,
    color: GAS_COLORS.hydrogen,
    hazards: [],
  },
  hydrogen_chloride: {
    id: "hydrogen_chloride",
    formula: GAS_LABELS.hydrogen_chloride,
    phase: "gas",
    elements: { H: 1, Cl: 1 },
    molarMass: 36.46,
    referenceDensity: 1.259,
    color: GAS_COLORS.hydrogen_chloride,
    hazards: [
      {
        basis: "gas_partial_ratio",
        direction: "above",
        threshold: 0.006,
        rate: 130,
        channel: "atmosphere",
        exposure: "all",
      },
      {
        basis: "gas_partial_ratio",
        direction: "above",
        threshold: 0.006,
        rate: 230,
        channel: "corrosion",
        exposure: "all",
      },
    ],
  },
  steam: {
    id: "steam",
    formula: GAS_LABELS.steam,
    phase: "gas",
    elements: { H: 2, O: 1 },
    molarMass: 18.015,
    referenceDensity: 0.622,
    color: GAS_COLORS.steam,
    hazards: [
      {
        basis: "gas_partial_ratio",
        direction: "above",
        threshold: 0.35,
        rate: 8,
        channel: "heat",
        exposure: "all",
      },
    ],
  },
  water: {
    id: "water",
    formula: LIQUID_LABELS.water,
    phase: "liquid",
    elements: { H: 2, O: 1 },
    molarMass: 18.015,
    referenceDensity: 1,
    color: LIQUID_COLORS.water,
    hazards: [],
  },
  sodium_chloride: {
    id: "sodium_chloride",
    formula: LIQUID_LABELS.sodium_chloride,
    phase: "liquid",
    elements: { Na: 1, Cl: 1 },
    molarMass: 58.44,
    referenceDensity: 1.15,
    color: LIQUID_COLORS.sodium_chloride,
    hazards: [],
  },
  sodium_hydroxide: {
    id: "sodium_hydroxide",
    formula: LIQUID_LABELS.sodium_hydroxide,
    phase: "liquid",
    elements: { Na: 1, O: 1, H: 1 },
    molarMass: 40,
    referenceDensity: 1.2,
    color: LIQUID_COLORS.sodium_hydroxide,
    hazards: [
      {
        basis: "liquid_strength",
        direction: "above",
        threshold: 2,
        rate: 2.16,
        channel: "corrosion",
        exposure: "floor_contact",
      },
    ],
  },
  sodium_hypochlorite: {
    id: "sodium_hypochlorite",
    formula: LIQUID_LABELS.sodium_hypochlorite,
    phase: "liquid",
    elements: { Na: 1, O: 1, Cl: 1 },
    molarMass: 74.44,
    referenceDensity: 1.1,
    color: LIQUID_COLORS.sodium_hypochlorite,
    hazards: [
      {
        basis: "liquid_strength",
        direction: "above",
        threshold: 5,
        rate: 0.72,
        channel: "corrosion",
        exposure: "floor_contact",
      },
    ],
  },
  hydrochloric_acid: {
    id: "hydrochloric_acid",
    formula: LIQUID_LABELS.hydrochloric_acid,
    phase: "liquid",
    elements: { H: 1, Cl: 1 },
    molarMass: 36.46,
    referenceDensity: 1.12,
    color: LIQUID_COLORS.hydrochloric_acid,
    hazards: [
      {
        basis: "liquid_strength",
        direction: "above",
        threshold: 2,
        rate: 1.74,
        channel: "corrosion",
        exposure: "floor_contact",
      },
    ],
  },
};

export { emptyGas, emptyLiquid } from "../materials";

export const ambientGas = (): GasAmounts => ({
  oxygen: 21,
  nitrogen: 78,
  carbon_dioxide: 1,
  chlorine: 0,
  hydrogen: 0,
  hydrogen_chloride: 0,
  steam: 0,
});
