import type { ReactionDefinition, ReactionId } from "../../types";

export const URANIUM_FLUORINE_REACTIONS = {
  uranium_hexafluoride_hydrolysis: {
    id: "uranium_hexafluoride_hydrolysis",
    code: "UF-1",
    kind: "chemical",
    equation: "UF₆(g) + 2 H₂O(g) → UO₂F₂(s) + 4 HF(g)",
    reactants: [
      { species: "uranium_hexafluoride", coefficient: 1 },
      { species: "steam", coefficient: 2 },
    ],
    products: [
      { species: "uranyl_fluoride", coefficient: 1 },
      { species: "hydrogen_fluoride", coefficient: 4 },
    ],
    behavior: {
      kind: "mass_action",
      maximumRate: 1.1,
      halfSaturation: 1.2,
      contact: "gas",
      forward: {
        rateConstant: 1,
        rateOrders: [
          { species: "uranium_hexafluoride", order: 1 },
          { species: "steam", order: 1 },
        ],
        activationTemperature: -25,
        fullActivationTemperature: 5,
      },
      gasHeatPerExtent: 1.6,
      roomHeatPerExtent: 0.35,
    },
  },
  uranyl_fluoride_recovery: {
    id: "uranyl_fluoride_recovery",
    code: "UF-2",
    kind: "chemical",
    equation: "UO₂F₂(s) + 2 F₂(g) → UF₆(g) + O₂(g) + heat",
    reactants: [
      { species: "uranyl_fluoride", coefficient: 1 },
      { species: "fluorine", coefficient: 2 },
    ],
    products: [
      { species: "uranium_hexafluoride", coefficient: 1 },
      { species: "oxygen", coefficient: 1 },
    ],
    behavior: {
      kind: "mass_action",
      maximumRate: 0.28,
      halfSaturation: 1.5,
      contact: "gas",
      forward: {
        rateConstant: 1,
        rateOrders: [
          { species: "uranyl_fluoride", order: 1 },
          { species: "fluorine", order: 1 },
        ],
        activationTemperature: 92,
        fullActivationTemperature: 145,
      },
      inhibitors: [
        { species: "steam", halfInhibition: 0.08 },
        { species: "water", halfInhibition: 0.08 },
      ],
      gasHeatPerExtent: 2.4,
      roomHeatPerExtent: 0.56,
    },
  },
  hydrogen_fluoride_electrolysis: {
    id: "hydrogen_fluoride_electrolysis",
    code: "UF-3",
    kind: "chemical",
    equation: "2 HF(g) → H₂(g) + F₂(g)",
    reactants: [{ species: "hydrogen_fluoride", coefficient: 2 }],
    products: [
      { species: "hydrogen", coefficient: 1 },
      { species: "fluorine", coefficient: 1 },
    ],
    behavior: { kind: "electrolysis", maximumRate: 0.66, roomHeatPerExtent: 1.25 },
  },
} satisfies Partial<Record<ReactionId, ReactionDefinition>>;
