import type { GameDefinition } from "../definitionTypes";
import { GAS_TYPES, LIQUID_TYPES, type LevelId, type ReactionId, type SpeciesId } from "../types";
import { GAS_LOCAL_PORT_RATE, LIQUID_LOCAL_PORT_RATE } from "../engine/junctions";
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
  levelId: LevelId;
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
  reactions: ReactionThroughputProfile[];
  supplies: SupplyThroughputProfile[];
}

export interface ReactionThroughputProfile {
  reactionId: ReactionId;
  code: string;
  behaviorKind: GameDefinition["reactions"][ReactionId]["behavior"]["kind"];
  maximumExtentPerSecond: number;
  minimumProcIntervalSeconds: number;
  equipmentExtentPerSecondByLevel: [number, number, number] | null;
  reactantDemandPerSecond: Partial<Record<SpeciesId, number>>;
  productOutputPerSecond: Partial<Record<SpeciesId, number>>;
}

export interface SupplyThroughputProfile {
  supplyId: string;
  phase: "gas" | "liquid";
  totalInventory: number;
  portRate: number;
  idealDischargeSeconds: number;
  speciesRate: Partial<Record<SpeciesId, number>>;
  replenishmentCost: number | null;
}

const reactionRate = (definition: GameDefinition, reactionId: ReactionId): number => {
  const behavior = definition.reactions[reactionId].behavior;
  return "maximumRate" in behavior ? behavior.maximumRate : Number.POSITIVE_INFINITY;
};

const equipmentRatesForReaction = (
  definition: GameDefinition,
  reactionId: ReactionId
): [number, number, number] | null => {
  const equipment = Object.values(definition.equipment).find(
    (candidate) => candidate.operation?.reactionId === reactionId
  );
  if (!equipment) return null;
  return equipment.grades.map((grade) =>
    grade.behavior.kind === "electrolyzer" ? grade.behavior.processRate : 0
  ) as [number, number, number];
};

export const reactionThroughputProfiles = (
  definition: GameDefinition
): ReactionThroughputProfile[] =>
  Object.values(definition.reactions).map((reaction) => {
    const behaviorRate =
      reaction.behavior.kind === "flash"
        ? reaction.behavior.maximumExtent / reaction.behavior.cooldownSeconds
        : reaction.behavior.maximumRate;
    const equipmentRates = equipmentRatesForReaction(definition, reaction.id);
    const maximumExtentPerSecond = equipmentRates
      ? Math.min(behaviorRate, equipmentRates[2])
      : behaviorRate;
    let minimumProcIntervalSeconds = Number.POSITIVE_INFINITY;
    if (reaction.behavior.kind === "flash") {
      minimumProcIntervalSeconds = reaction.behavior.cooldownSeconds;
    } else if (maximumExtentPerSecond > 0) {
      minimumProcIntervalSeconds = 1 / maximumExtentPerSecond;
    }
    return {
      reactionId: reaction.id,
      code: reaction.code,
      behaviorKind: reaction.behavior.kind,
      maximumExtentPerSecond,
      minimumProcIntervalSeconds,
      equipmentExtentPerSecondByLevel: equipmentRates,
      reactantDemandPerSecond: Object.fromEntries(
        reaction.reactants.map(({ species, coefficient }) => [
          species,
          coefficient * maximumExtentPerSecond,
        ])
      ),
      productOutputPerSecond: Object.fromEntries(
        reaction.products.map(({ species, coefficient }) => [
          species,
          coefficient * maximumExtentPerSecond,
        ])
      ),
    };
  });

export const supplyThroughputProfiles = (
  levelId: LevelId,
  definition: GameDefinition
): SupplyThroughputProfile[] =>
  definition.levels[levelId].supplies.map((supply) => {
    const speciesIds = supply.phase === "gas" ? GAS_TYPES : LIQUID_TYPES;
    const contents = supply.initial as Partial<Record<SpeciesId, number>>;
    const totalInventory = speciesIds.reduce(
      (total, speciesId) => total + (contents[speciesId] ?? 0),
      0
    );
    const portRate = supply.phase === "gas" ? GAS_LOCAL_PORT_RATE : LIQUID_LOCAL_PORT_RATE;
    return {
      supplyId: supply.id,
      phase: supply.phase,
      totalInventory,
      portRate,
      idealDischargeSeconds:
        totalInventory > 0 ? totalInventory / portRate : Number.POSITIVE_INFINITY,
      speciesRate: Object.fromEntries(
        speciesIds.flatMap((speciesId) => {
          const amount = contents[speciesId] ?? 0;
          return amount > 0 ? [[speciesId, portRate * (amount / totalInventory)]] : [];
        })
      ),
      replenishmentCost: supply.replenishment.kind === "matter" ? supply.replenishment.cost : null,
    };
  });

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
    cellBehavior?.kind === "electrolyzer" ? cellBehavior.processRate : Number.POSITIVE_INFINITY;
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
    levelId,
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
    reactions: reactionThroughputProfiles(definition),
    supplies: supplyThroughputProfiles(levelId, definition),
  };
};
