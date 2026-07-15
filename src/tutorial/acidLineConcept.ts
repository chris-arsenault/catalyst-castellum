import { DEFAULT_GAME_DEFINITION } from "../game/definition";
import type { GuideConceptModel, GuideConceptStage } from "./flashPointConcept";
import { maybeLineDefinition } from "../game/world/instances";

const ACID_REACTION = DEFAULT_GAME_DEFINITION.reactions.hydrogen_chlorine_recombination;
const acidCoefficient = (species: string): number =>
  [...ACID_REACTION.reactants, ...ACID_REACTION.products].find((entry) => entry.species === species)
    ?.coefficient ?? 0;

const acidLineStages = (): GuideConceptStage[] => {
  const definition = DEFAULT_GAME_DEFINITION;
  const behavior = ACID_REACTION.behavior;
  const feed = maybeLineDefinition(definition, "gas:furnace__lower_intake", "gas");
  const firstReturn = maybeLineDefinition(definition, "gas:furnace__gallery", "gas");
  const finalReturn = maybeLineDefinition(definition, "gas:gallery__washlock", "gas");
  const coil = definition.equipment.thermal_coil.grades[0];
  const agitator = definition.equipment.gas_agitator.grades[0];
  if (
    behavior.kind !== "gas_recombination" ||
    !feed ||
    !firstReturn ||
    !finalReturn ||
    coil?.behavior.kind !== "thermal_coil" ||
    agitator?.behavior.kind !== "gas_agitator"
  ) {
    throw new Error("Acid Line concept requires CL-2, its equipment, and its gas route");
  }
  return [
    {
      kind: "feed",
      title: "tutorial.concept.acid.feed.title",
      metric: {
        key: "tutorial.concept.acid.feed.metric",
        parameters: {
          hydrogen: acidCoefficient("hydrogen"),
          chlorine: acidCoefficient("chlorine"),
          rate: feed.maxFlow,
        },
      },
      detail: "tutorial.concept.acid.feed.detail",
    },
    {
      kind: "heat",
      title: "tutorial.concept.acid.heat.title",
      metric: {
        key: "tutorial.concept.acid.heat.metric",
        parameters: {
          target: coil.behavior.targetTemperature,
          minimum: behavior.activationTemperature,
          maximum: behavior.activationTemperature + behavior.activationRange,
        },
      },
      detail: {
        key: "tutorial.concept.acid.heat.detail",
        parameters: { multiplier: agitator.behavior.reactionMultiplier },
      },
    },
    {
      kind: "convert",
      title: "tutorial.concept.acid.convert.title",
      metric: {
        key: "tutorial.concept.acid.convert.metric",
        parameters: {
          hydrogen: acidCoefficient("hydrogen"),
          chlorine: acidCoefficient("chlorine"),
          chloride: acidCoefficient("hydrogen_chloride"),
        },
      },
      detail: {
        key: "tutorial.concept.acid.convert.detail",
        parameters: { rate: behavior.maximumRate },
      },
    },
    {
      kind: "route",
      title: "tutorial.concept.acid.route.title",
      metric: {
        key: "tutorial.concept.acid.route.metric",
        parameters: { first: firstReturn.maxFlow, final: finalReturn.maxFlow },
      },
      detail: "tutorial.concept.acid.route.detail",
    },
  ];
};

export const ACID_LINE_CONCEPT_MODEL: GuideConceptModel = {
  principle: "tutorial.concept.acid.principle",
  stages: acidLineStages(),
  conclusion: "tutorial.concept.acid.conclusion",
};
