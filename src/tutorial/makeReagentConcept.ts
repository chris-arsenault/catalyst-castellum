import { DEFAULT_GAME_DEFINITION } from "../game/definition";
import type { GuideConceptModel, GuideConceptStage } from "./flashPointConcept";

const concise = (value: number): string => String(Number(value.toFixed(2)));

const makeReagentStages = (): GuideConceptStage[] => {
  const definition = DEFAULT_GAME_DEFINITION;
  const reaction = definition.reactions.chlor_alkali_electrolysis;
  const feed = definition.transportRuns.core_cell.liquid;
  const recovery = definition.transportRuns.core_cell.gas;
  const transfer = definition.transportRuns.cell_absorber.gas;
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
      title: "Supply equal reactants",
      metric: `H₂O : NaCl ${concise(speciesCoefficient("water"))}:${concise(
        speciesCoefficient("sodium_chloride")
      )} · pump ${concise(feed.maxFlow)} mol-eq/s`,
      detail:
        "The Core pump combines water and brine in one physical pipe. Cell current follows the reactant with the smaller available stoichiometric amount.",
    },
    {
      kind: "convert",
      title: "Drive electrolysis",
      metric: `${concise(grade.behavior.processRate)} extent/s · ${concise(
        grade.behavior.powerDraw
      )} kW-eq`,
      detail:
        "An active Grade 1 Membrane Cell consumes the mixed liquid feed and applies its rated current while every outlet has capacity.",
    },
    {
      kind: "separate",
      title: "Create three co-products",
      metric: `${concise(speciesCoefficient("chlorine"))} Cl₂ + ${concise(
        speciesCoefficient("hydrogen")
      )} H₂ + ${concise(speciesCoefficient("sodium_hydroxide"))} NaOH`,
      detail:
        "The membrane sends chlorine, hydrogen, and sodium hydroxide into isolated buffers mounted with the cell. The smallest remaining buffer headroom sets the whole-cell rate.",
    },
    {
      kind: "relieve",
      title: "Move the shared gas stream",
      metric: `R-03 duct ${concise(transfer.maxFlow)} · Core recovery ${concise(
        recovery.maxFlow
      )} mol-eq/s`,
      detail:
        "This assignment mounts both gas headers on the R-05 junction. Active outlet fans draw that shared mixture onward and restore buffer headroom for sustained cell current.",
    },
  ];
};

export const MAKE_REAGENT_CONCEPT_MODEL: GuideConceptModel = {
  principle:
    "CL-1 is a continuous conserved process. Liquid feed supplies its reactants, cell current converts them together, three outlet buffers receive the products, and downstream flow restores production headroom.",
  stages: makeReagentStages(),
  conclusion:
    "Reactant availability and the smallest outlet headroom set the live cell rate. Prime establishes feed and product flow; assault tests the process network while enemies cross R-03.",
};
