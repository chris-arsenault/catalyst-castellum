import { DEFAULT_GAME_DEFINITION } from "../game/definition";
import type { GuideConceptModel, GuideConceptStage } from "./flashPointConcept";
import { definitionTransportRun } from "../game/world/instances";

const makeReagentStages = (): GuideConceptStage[] => {
  const definition = DEFAULT_GAME_DEFINITION;
  const reaction = definition.reactions.chlor_alkali_electrolysis;
  const feed = definitionTransportRun(definition, "core_cell").liquid;
  const recovery = definitionTransportRun(definition, "core_cell").gas;
  const transfer = definitionTransportRun(definition, "cell_absorber").gas;
  const grade = definition.equipment.membrane_cell.grades[0];
  if (!feed || !recovery || !transfer || grade?.behavior.kind !== "membrane_cell") {
    throw new Error("Make the Reagent concept requires its cell and transport runs");
  }
  const speciesCoefficient = (species: string): number =>
    [...reaction.reactants, ...reaction.products].find((entry) => entry.species === species)
      ?.coefficient ?? 0;
  return [
    {
      kind: "feed",
      title: "tutorial.concept.reagent.feed.title",
      metric: {
        key: "tutorial.concept.reagent.feed.metric",
        parameters: {
          water: speciesCoefficient("water"),
          salt: speciesCoefficient("sodium_chloride"),
          rate: feed.maxFlow,
        },
      },
      detail: "tutorial.concept.reagent.feed.detail",
    },
    {
      kind: "convert",
      title: "tutorial.concept.reagent.convert.title",
      metric: {
        key: "tutorial.concept.reagent.convert.metric",
        parameters: { rate: grade.behavior.processRate, power: grade.behavior.powerDraw },
      },
      detail: "tutorial.concept.reagent.convert.detail",
    },
    {
      kind: "separate",
      title: "tutorial.concept.reagent.separate.title",
      metric: {
        key: "tutorial.concept.reagent.separate.metric",
        parameters: {
          chlorine: speciesCoefficient("chlorine"),
          hydrogen: speciesCoefficient("hydrogen"),
          hydroxide: speciesCoefficient("sodium_hydroxide"),
        },
      },
      detail: "tutorial.concept.reagent.separate.detail",
    },
    {
      kind: "relieve",
      title: "tutorial.concept.reagent.relieve.title",
      metric: {
        key: "tutorial.concept.reagent.relieve.metric",
        parameters: { transfer: transfer.maxFlow, recovery: recovery.maxFlow },
      },
      detail: "tutorial.concept.reagent.relieve.detail",
    },
  ];
};

export const MAKE_REAGENT_CONCEPT_MODEL: GuideConceptModel = {
  principle: "tutorial.concept.reagent.principle",
  stages: makeReagentStages(),
  conclusion: "tutorial.concept.reagent.conclusion",
};
