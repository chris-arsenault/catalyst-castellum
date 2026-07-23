import { describe, expect, it } from "vitest";
import type { LevelDefinition } from "../definitionTypes";
import { PROCESS_FAMILY_IDS } from "../identifiers";
import type { ProcessFamilyId, SpeciesId } from "../types";
import { LEVEL_DEFINITIONS } from "./campaign";
import { REACTION_DEFINITIONS } from "./chemistry";
import { SPECIES_DEFINITIONS } from "./substances";

const OFFENSIVE_FAMILIES = PROCESS_FAMILY_IDS.filter((family) => family !== "iron");

const isDamaging = (speciesId: SpeciesId): boolean => {
  const species = SPECIES_DEFINITIONS[speciesId];
  return species.damageSourceId !== null && species.hazards.length > 0;
};

const addProvisions = (
  provisions: Set<SpeciesId>,
  contents: Partial<Record<SpeciesId, number>> | undefined
): void => {
  const entries = Object.entries(contents ?? {}) as [SpeciesId, number][];
  for (const [speciesId, amount] of entries) {
    if (amount > 0) provisions.add(speciesId);
  }
};

const levelProvisions = (level: LevelDefinition): Set<SpeciesId> => {
  const provisions = new Set<SpeciesId>();
  for (const supply of level.supplies) {
    addProvisions(provisions, supply.initial as Partial<Record<SpeciesId, number>>);
    addProvisions(provisions, supply.replenishment.contents as Partial<Record<SpeciesId, number>>);
  }
  for (const roomStationary of Object.values(level.loadout.stationary ?? {})) {
    addProvisions(provisions, roomStationary as Partial<Record<SpeciesId, number>>);
  }
  return provisions;
};

const depthOneFamilies = (provisions: Set<SpeciesId>): Set<ProcessFamilyId> => {
  const reached = new Set<ProcessFamilyId>();
  const record = (speciesId: SpeciesId): void => {
    const family = SPECIES_DEFINITIONS[speciesId].family;
    if (family !== "common" && isDamaging(speciesId)) reached.add(family);
  };
  for (const speciesId of provisions) record(speciesId);
  for (const reaction of Object.values(REACTION_DEFINITIONS)) {
    const feedable = reaction.reactants.every(({ species }) => provisions.has(species));
    if (!feedable) continue;
    for (const product of reaction.products) record(product.species);
  }
  return reached;
};

describe("depth-one hazard contract (ADR-0009)", () => {
  it("reaches every offensive family within one reaction of supplied feedstock somewhere in the campaign", () => {
    const reachedAnywhere = new Set<ProcessFamilyId>();
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      for (const family of depthOneFamilies(levelProvisions(level))) reachedAnywhere.add(family);
    }
    for (const family of OFFENSIVE_FAMILIES) {
      expect(reachedAnywhere.has(family), family).toBe(true);
    }
  });

  it("supplies the decided direct-hazard packets at their sites", () => {
    expect(levelProvisions(LEVEL_DEFINITIONS.morrow_pocket).has("chlorine")).toBe(true);
    expect(levelProvisions(LEVEL_DEFINITIONS.morrow_pocket).has("sodium_hypochlorite")).toBe(true);
    expect(levelProvisions(LEVEL_DEFINITIONS.cordon_41).has("ammonia")).toBe(true);
    expect(levelProvisions(LEVEL_DEFINITIONS.vasker_store).has("hydrochloric_acid")).toBe(true);
    expect(levelProvisions(LEVEL_DEFINITIONS.lane_six).has("ammonia")).toBe(true);
    expect(levelProvisions(LEVEL_DEFINITIONS.pell_cordon).has("chlorine")).toBe(true);
  });

  it("keeps nickel carbonyl a synthesized species at every site", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      expect(levelProvisions(level).has("nickel_carbonyl"), level.id).toBe(false);
    }
  });

  it("gives every open site from Morrow Pocket onward its own depth-one offensive option", () => {
    const openLevels = [
      "morrow_pocket",
      "kettleblack",
      "cordon_41",
      "junction_l6",
      "pell_cut",
      "station_14",
      "vasker_store",
      "lane_six",
      "pell_cordon",
    ] as const;
    for (const levelId of openLevels) {
      const reached = depthOneFamilies(levelProvisions(LEVEL_DEFINITIONS[levelId]));
      expect(reached.size, levelId).toBeGreaterThan(0);
    }
  });
});
