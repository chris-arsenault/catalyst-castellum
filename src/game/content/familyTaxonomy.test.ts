import { describe, expect, it } from "vitest";
import { PROCESS_FAMILY_IDS, REACTION_IDS } from "../identifiers";
import type { ProcessFamilyId, ReactionId } from "../types";
import { REACTION_DEFINITIONS } from "./chemistry";
import { SPECIES_DEFINITIONS } from "./substances";

const WILD_REACTIONS: readonly ReactionId[] = [
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
  "carbon_monoxide_oxidation",
  "nitric_oxide_oxidation",
  "uranium_hexafluoride_hydrolysis",
];

const FAMILY_BY_CODE_PREFIX: Record<string, ProcessFamilyId> = {
  CL: "chlorine_sodium",
  OX: "chlorine_sodium",
  P: "chlorine_sodium",
  CS: "carbon_steam",
  NO: "nitrogen_oxide",
  FE: "iron",
  NI: "nickel",
  UF: "uranium_fluorine",
};

describe("process family taxonomy", () => {
  it("assigns every reaction the family its code prefix names", () => {
    for (const id of REACTION_IDS) {
      const reaction = REACTION_DEFINITIONS[id];
      const prefix = reaction.code.split("-")[0] ?? reaction.code;
      expect(reaction.family, reaction.code).toBe(FAMILY_BY_CODE_PREFIX[prefix]);
    }
  });

  it("keeps exactly the spontaneous roster wild", () => {
    const wild = REACTION_IDS.filter((id) => REACTION_DEFINITIONS[id].regime === "wild");
    expect([...wild].sort()).toEqual([...WILD_REACTIONS].sort());
  });

  it("classifies both electrolysis reactions as engineered", () => {
    expect(REACTION_DEFINITIONS.chlor_alkali_electrolysis.regime).toBe("engineered");
    expect(REACTION_DEFINITIONS.hydrogen_fluoride_electrolysis.regime).toBe("engineered");
  });

  it("gives every offensive family a damaging species and keeps iron support-only", () => {
    const damagingFamilies = new Set(
      Object.values(SPECIES_DEFINITIONS)
        .filter((species) => species.damageSourceId !== null && species.hazards.length > 0)
        .map((species) => species.family)
    );
    for (const family of PROCESS_FAMILY_IDS) {
      if (family === "iron") {
        expect(damagingFamilies.has(family)).toBe(false);
      } else {
        expect(damagingFamilies.has(family), family).toBe(true);
      }
    }
  });

  it("tags every family with at least one reaction and one species", () => {
    for (const family of PROCESS_FAMILY_IDS) {
      const reactions = REACTION_IDS.filter((id) => REACTION_DEFINITIONS[id].family === family);
      const species = Object.values(SPECIES_DEFINITIONS).filter(
        (definition) => definition.family === family
      );
      expect(reactions.length, family).toBeGreaterThan(0);
      expect(species.length, family).toBeGreaterThan(0);
    }
  });
});
