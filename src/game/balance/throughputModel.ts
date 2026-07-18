import type { GameDefinition } from "../definitionTypes";
import type { LevelId, ReactionId, SpeciesId } from "../types";
import type { Matrix } from "./linearAlgebra";
import { conduitProfiles } from "./routeModel";

export interface StoichiometryModel {
  species: SpeciesId[];
  reactions: ReactionId[];
  /** Rows are species; columns are reactions. Reactants are negative and products positive. */
  matrix: Matrix;
}

export const stoichiometryModel = (definition: GameDefinition): StoichiometryModel => {
  const species = Object.keys(definition.species) as SpeciesId[];
  const reactions = Object.keys(definition.reactions) as ReactionId[];
  const matrix = species.map((speciesId) =>
    reactions.map((reactionId) => {
      const reaction = definition.reactions[reactionId];
      const produced = reaction.products
        .filter((participant) => participant.species === speciesId)
        .reduce((total, participant) => total + participant.coefficient, 0);
      const consumed = reaction.reactants
        .filter((participant) => participant.species === speciesId)
        .reduce((total, participant) => total + participant.coefficient, 0);
      return produced - consumed;
    })
  );
  return { species, reactions, matrix };
};

export interface ThroughputProfile {
  chlorAlkaliExtentPerSecond: number;
  chlorinePerSecond: number;
  hydrogenPerSecond: number;
  sodiumHydroxidePerSecond: number;
  hydrogenChloridePerSecond: number;
  hydrochloricAcidPerSecond: number;
  hypochloritePerSecond: number;
  releasedChlorinePerSecond: number;
  ox1ExtentPerSecond: number;
  ox1FullChargeSeconds: number;
  ox1CooldownSeconds: number;
  ox1ExpectedIntervalSeconds: number;
}

const reactionRate = (definition: GameDefinition, reactionId: ReactionId): number => {
  const behavior = definition.reactions[reactionId].behavior;
  return "maximumRate" in behavior ? behavior.maximumRate : Number.POSITIVE_INFINITY;
};

export const idealThroughputProfile = (
  levelId: LevelId,
  definition: GameDefinition
): ThroughputProfile => {
  const conduits = conduitProfiles(levelId, definition);
  const liquidFeed =
    conduits.find((line) => line.connectionId === "liquid:core__lower_intake")?.maximumFlow ??
    definition.lineSpecs.liquid_line.maxFlow;
  const starterGas =
    conduits.find((line) => line.connectionId === "gas:core__furnace")?.maximumFlow ??
    definition.lineSpecs.gas_line.maxFlow;
  const cellBehavior = definition.equipment.membrane_cell.grades[0]?.behavior;
  const cellRate =
    cellBehavior?.kind === "membrane_cell" ? cellBehavior.processRate : Number.POSITIVE_INFINITY;
  // Equal water/brine pools feed one half of total line flow to each 2:2 reactant.
  const chlorAlkaliExtentPerSecond = Math.min(cellRate, liquidFeed / 4);
  const chlorinePerSecond = chlorAlkaliExtentPerSecond;
  const hydrogenPerSecond = chlorAlkaliExtentPerSecond;
  const sodiumHydroxidePerSecond = chlorAlkaliExtentPerSecond * 2;
  const hclExtent = Math.min(
    hydrogenPerSecond,
    chlorinePerSecond,
    reactionRate(definition, "hydrogen_chlorine_recombination")
  );
  const hydrogenChloridePerSecond = hclExtent * 2;
  const hydrochloricAcidPerSecond = Math.min(
    hydrogenChloridePerSecond,
    reactionRate(definition, "hydrogen_chloride_absorption")
  );
  const hypochloritePerSecond = Math.min(
    chlorinePerSecond,
    sodiumHydroxidePerSecond / 2,
    reactionRate(definition, "hypochlorite_formation")
  );
  const releasedChlorinePerSecond = Math.min(
    hypochloritePerSecond,
    hydrochloricAcidPerSecond / 2,
    reactionRate(definition, "acid_chlorine_release")
  );
  const flash = definition.reactions.hydrogen_oxygen_combustion.behavior;
  if (flash.kind !== "flash") throw new Error("OX-1 behavior is not a flash.");
  // The starter header is authored in the exact 2 H2 : 1 O2 reaction ratio.
  const ox1ExtentPerSecond = starterGas / 3;
  const ox1FullChargeSeconds = flash.maximumExtent / ox1ExtentPerSecond;
  return {
    chlorAlkaliExtentPerSecond,
    chlorinePerSecond,
    hydrogenPerSecond,
    sodiumHydroxidePerSecond,
    hydrogenChloridePerSecond,
    hydrochloricAcidPerSecond,
    hypochloritePerSecond,
    releasedChlorinePerSecond,
    ox1ExtentPerSecond,
    ox1FullChargeSeconds,
    ox1CooldownSeconds: flash.cooldownSeconds,
    ox1ExpectedIntervalSeconds: Math.max(ox1FullChargeSeconds, flash.cooldownSeconds),
  };
};
