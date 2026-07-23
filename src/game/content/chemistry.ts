import {
  REACTION_IDS,
  type ElementalComposition,
  type ReactionDefinition,
  type ReactionId,
} from "../types";
import { SPECIES_DEFINITIONS } from "./substances";
import { CARBON_STEAM_REACTIONS } from "./reactions/carbonSteam";
import { NITROGEN_OXIDE_REACTIONS } from "./reactions/nitrogenOxide";
import { TRANSITION_METAL_REACTIONS } from "./reactions/transitionMetals";
import { URANIUM_FLUORINE_REACTIONS } from "./reactions/uraniumFluorine";

export const REACTION_DEFINITIONS: Record<ReactionId, ReactionDefinition> = {
  chlor_alkali_electrolysis: {
    id: "chlor_alkali_electrolysis",
    family: "chlorine_sodium",
    regime: "engineered",
    code: "CL-1",
    kind: "chemical",
    equation: "2 NaCl(aq) + 2 H₂O(l) → Cl₂(g) + H₂(g) + 2 NaOH(aq)",
    reactants: [
      { species: "sodium_chloride", coefficient: 2 },
      { species: "water", coefficient: 2 },
    ],
    products: [
      { species: "chlorine", coefficient: 1 },
      { species: "hydrogen", coefficient: 1 },
      { species: "sodium_hydroxide", coefficient: 2 },
    ],
    behavior: { kind: "electrolysis", maximumRate: 1.12, roomHeatPerExtent: 0.62 },
  },
  hydrogen_oxygen_combustion: {
    id: "hydrogen_oxygen_combustion",
    family: "chlorine_sodium",
    regime: "wild",
    code: "OX-1",
    kind: "chemical",
    equation: "2 H₂(g) + O₂(g) → 2 H₂O(g) + heat + pressure",
    reactants: [
      { species: "hydrogen", coefficient: 2 },
      { species: "oxygen", coefficient: 1 },
    ],
    products: [{ species: "steam", coefficient: 2 }],
    behavior: {
      kind: "flash",
      ignitionExtent: 3,
      maximumExtent: 6,
      minimumHydrogenFraction: 0.075,
      minimumOxygenFraction: 0.12,
      cooldownSeconds: 2.5,
      pressurePulseBase: 72,
      pressurePulsePerExtent: 20,
      gasHeatPerExtent: 11,
      roomHeatPerExtent: 1.8,
      pressureDamageBase: 59.46,
      pressureDamagePerExtent: 7.945,
      heatDamagePerExtent: 1.979,
    },
  },
  hydrogen_chlorine_recombination: {
    id: "hydrogen_chlorine_recombination",
    family: "chlorine_sodium",
    regime: "wild",
    code: "CL-2",
    kind: "chemical",
    equation: "H₂(g) + Cl₂(g) → 2 HCl(g) + heat",
    reactants: [
      { species: "hydrogen", coefficient: 1 },
      { species: "chlorine", coefficient: 1 },
    ],
    products: [{ species: "hydrogen_chloride", coefficient: 2 }],
    behavior: {
      kind: "gas_recombination",
      maximumRate: 0.95,
      activationTemperature: 38,
      activationRange: 28,
      gasHeatPerExtent: 4.8,
      roomHeatPerExtent: 0.8,
      event: { code: "hcl_production_started", roomId: "furnace" },
    },
  },
  hydrogen_chloride_absorption: {
    id: "hydrogen_chloride_absorption",
    family: "chlorine_sodium",
    regime: "wild",
    code: "P-1",
    kind: "physical",
    equation: "HCl(g) → HCl(aq)",
    reactants: [{ species: "hydrogen_chloride", coefficient: 1 }],
    products: [{ species: "hydrochloric_acid", coefficient: 1 }],
    behavior: {
      kind: "absorption",
      maximumRate: 1.75,
      solventInventoryScale: 8,
      maximumProductFraction: 0.58,
    },
  },
  acid_neutralization: {
    id: "acid_neutralization",
    family: "chlorine_sodium",
    regime: "wild",
    code: "CL-3",
    kind: "chemical",
    equation: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) + heat",
    reactants: [
      { species: "hydrochloric_acid", coefficient: 1 },
      { species: "sodium_hydroxide", coefficient: 1 },
    ],
    products: [
      { species: "sodium_chloride", coefficient: 1 },
      { species: "water", coefficient: 1 },
    ],
    behavior: {
      kind: "mixed_contact",
      maximumRate: 2.8,
      mixingInventoryScale: 6,
      roomHeatPerExtent: 0.42,
    },
  },
  hypochlorite_formation: {
    id: "hypochlorite_formation",
    family: "chlorine_sodium",
    regime: "wild",
    code: "CL-4",
    kind: "chemical",
    equation: "Cl₂(g) + 2 NaOH(aq) → NaOCl(aq) + NaCl(aq) + H₂O(l)",
    reactants: [
      { species: "chlorine", coefficient: 1 },
      { species: "sodium_hydroxide", coefficient: 2 },
    ],
    products: [
      { species: "sodium_hypochlorite", coefficient: 1 },
      { species: "sodium_chloride", coefficient: 1 },
      { species: "water", coefficient: 1 },
    ],
    behavior: {
      kind: "mixed_contact",
      maximumRate: 0.82,
      mixingInventoryScale: 6,
      roomHeatPerExtent: 0.28,
      headroom: "liquid",
    },
  },
  acid_chlorine_release: {
    id: "acid_chlorine_release",
    family: "chlorine_sodium",
    regime: "wild",
    code: "CL-5",
    kind: "chemical",
    equation: "NaOCl(aq) + 2 HCl(aq) → NaCl(aq) + Cl₂(g) + H₂O(l)",
    reactants: [
      { species: "sodium_hypochlorite", coefficient: 1 },
      { species: "hydrochloric_acid", coefficient: 2 },
    ],
    products: [
      { species: "sodium_chloride", coefficient: 1 },
      { species: "chlorine", coefficient: 1 },
      { species: "water", coefficient: 1 },
    ],
    behavior: {
      kind: "mixed_contact",
      maximumRate: 0.72,
      mixingInventoryScale: 6,
      roomHeatPerExtent: 0.34,
      headroom: "gas",
      event: { code: "chlorine_evolution_started", roomId: "washlock" },
    },
  },
  ...CARBON_STEAM_REACTIONS,
  ...NITROGEN_OXIDE_REACTIONS,
  ...TRANSITION_METAL_REACTIONS,
  ...URANIUM_FLUORINE_REACTIONS,
};

const flashBehavior = REACTION_DEFINITIONS.hydrogen_oxygen_combustion.behavior;
if (flashBehavior.kind !== "flash") throw new Error("Hydrogen flash reaction is misconfigured");
export const HYDROGEN_FLASH_RULES = flashBehavior;

const sideElements = (participants: ReactionDefinition["reactants"]): ElementalComposition => {
  const totals: ElementalComposition = {};
  for (const participant of participants) {
    const species = SPECIES_DEFINITIONS[participant.species];
    for (const [element, count] of Object.entries(species.elements)) {
      totals[element] = (totals[element] ?? 0) + count * participant.coefficient;
    }
  }
  return totals;
};

export const reactionElementBalance = (reaction: ReactionDefinition): ElementalComposition => {
  const reactants = sideElements(reaction.reactants);
  const products = sideElements(reaction.products);
  const elements = new Set([...Object.keys(reactants), ...Object.keys(products)]);
  return Object.fromEntries(
    [...elements].map((element) => [element, (products[element] ?? 0) - (reactants[element] ?? 0)])
  );
};

export const reactionIsBalanced = (reaction: ReactionDefinition): boolean =>
  Object.values(reactionElementBalance(reaction)).every((difference) => difference === 0);

export const validateReactionCatalog = (): string[] =>
  REACTION_IDS.flatMap((id) => {
    const reaction = REACTION_DEFINITIONS[id];
    if (reactionIsBalanced(reaction)) return [];
    const imbalance = Object.entries(reactionElementBalance(reaction))
      .filter(([, difference]) => difference !== 0)
      .map(([element, difference]) => `${element}:${difference > 0 ? "+" : ""}${difference}`)
      .join(", ");
    return [`${reaction.code} (${reaction.id}) is unbalanced (${imbalance})`];
  });
