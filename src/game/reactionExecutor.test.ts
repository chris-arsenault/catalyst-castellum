import { describe, expect, it } from "vitest";
import { REACTION_DEFINITIONS, validateReactionCatalog } from "./content/chemistry";
import { SPECIES_DEFINITIONS } from "./content/substances";
import { applyReactionExtent, type MutableReactionInventory } from "./engine/reactionExecutor";
import type { ElementalComposition, SpeciesId } from "./types";

const speciesIds = Object.keys(SPECIES_DEFINITIONS) as SpeciesId[];

const inventoryFixture = (amount = 20) => {
  const amounts = Object.fromEntries(speciesIds.map((speciesId) => [speciesId, amount])) as Record<
    SpeciesId,
    number
  >;
  const inventory: MutableReactionInventory = {
    amount: (speciesId) => amounts[speciesId],
    change: (speciesId, delta) => {
      amounts[speciesId] += delta;
    },
  };
  return { amounts, inventory };
};

const elementsIn = (amounts: Record<SpeciesId, number>): ElementalComposition => {
  const elements: ElementalComposition = {};
  for (const speciesId of speciesIds) {
    for (const [element, count] of Object.entries(SPECIES_DEFINITIONS[speciesId].elements)) {
      elements[element] = (elements[element] ?? 0) + count * amounts[speciesId];
    }
  }
  return elements;
};

describe("declarative reaction execution", () => {
  it("keeps every authored equation element-balanced", () => {
    expect(validateReactionCatalog()).toEqual([]);
  });

  it("applies exactly the declared stoichiometric deltas", () => {
    for (const reaction of Object.values(REACTION_DEFINITIONS)) {
      const { amounts, inventory } = inventoryFixture();
      const before = { ...amounts };
      const elementsBefore = elementsIn(before);
      applyReactionExtent(reaction, inventory, 2);

      for (const speciesId of speciesIds) {
        const reactant = reaction.reactants.find((entry) => entry.species === speciesId);
        const product = reaction.products.find((entry) => entry.species === speciesId);
        const expectedDelta = 2 * ((product?.coefficient ?? 0) - (reactant?.coefficient ?? 0));
        expect(amounts[speciesId] - before[speciesId], `${reaction.id}:${speciesId}`).toBeCloseTo(
          expectedDelta
        );
      }
      expect(elementsIn(amounts), reaction.id).toEqual(elementsBefore);
    }
  });

  it("rejects an extent that exceeds an authored reactant inventory", () => {
    const { inventory } = inventoryFixture(1);
    expect(() =>
      applyReactionExtent(REACTION_DEFINITIONS.chlor_alkali_electrolysis, inventory, 1)
    ).toThrow(/exceeds available reactants/);
  });
});
