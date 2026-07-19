import type { GasType, LiquidType, StationaryType } from "../types";

export const GAS_LABELS: Record<GasType, string> = {
  oxygen: "O₂",
  nitrogen: "N₂",
  carbon_dioxide: "CO₂",
  carbon_monoxide: "CO",
  chlorine: "Cl₂",
  hydrogen: "H₂",
  hydrogen_chloride: "HCl",
  steam: "H₂O(g)",
  methane: "CH₄",
  ammonia: "NH₃",
  nitric_oxide: "NO",
  nitrogen_dioxide: "NO₂",
  nitrous_oxide: "N₂O",
  nickel_carbonyl: "Ni(CO)₄",
  uranium_hexafluoride: "UF₆",
  hydrogen_fluoride: "HF",
  fluorine: "F₂",
};

export const GAS_COLORS: Record<GasType, string> = {
  oxygen: "#73c3d4",
  nitrogen: "#507c74",
  carbon_dioxide: "#8b9f9a",
  carbon_monoxide: "#9aada8",
  chlorine: "#c5f540",
  hydrogen: "#f5a249",
  hydrogen_chloride: "#f6cd5c",
  steam: "#d1f1f6",
  methane: "#7cb9a6",
  ammonia: "#c7dd74",
  nitric_oxide: "#709a8e",
  nitrogen_dioxide: "#b86e3e",
  nitrous_oxide: "#889cca",
  nickel_carbonyl: "#b8d0a0",
  uranium_hexafluoride: "#d7d184",
  hydrogen_fluoride: "#d9eef0",
  fluorine: "#e5ef62",
};

export const LIQUID_LABELS: Record<LiquidType, string> = {
  water: "H₂O",
  sodium_chloride: "NaCl(aq)",
  sodium_hydroxide: "NaOH(aq)",
  sodium_hypochlorite: "NaOCl(aq)",
  hydrochloric_acid: "HCl(aq)",
  nitric_acid: "HNO₃(aq)",
};

export const LIQUID_COLORS: Record<LiquidType, string> = {
  water: "#41baf5",
  sodium_chloride: "#60cce4",
  sodium_hydroxide: "#b555f5",
  sodium_hypochlorite: "#ade253",
  hydrochloric_acid: "#f5844a",
  nitric_acid: "#efb347",
};

export const STATIONARY_LABELS: Record<StationaryType, string> = {
  solid_carbon: "C(s)",
  hematite: "Fe₂O₃(s)",
  magnetite: "Fe₃O₄(s)",
  nickel_oxide: "NiO(s)",
  surface_nickel: "Ni(s)",
  uranyl_fluoride: "UO₂F₂(s)",
  iron_catalyst: "Fe(cat)",
  platinum_catalyst: "Pt(cat)",
};

export const STATIONARY_COLORS: Record<StationaryType, string> = {
  solid_carbon: "#343b3d",
  hematite: "#9f4c34",
  magnetite: "#455052",
  nickel_oxide: "#6f8e62",
  surface_nickel: "#9ba9a3",
  uranyl_fluoride: "#c8c56b",
  iron_catalyst: "#7f7266",
  platinum_catalyst: "#c5ced2",
};
