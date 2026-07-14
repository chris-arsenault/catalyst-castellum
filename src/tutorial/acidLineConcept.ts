import { DEFAULT_GAME_DEFINITION } from "../game/definition";
import type { GuideConceptModel, GuideConceptStage } from "./flashPointConcept";

const concise = (value: number): string => String(Number(value.toFixed(2)));

const acidLineStages = (): GuideConceptStage[] => {
  const definition = DEFAULT_GAME_DEFINITION;
  const reaction = definition.reactions.hydrogen_chlorine_recombination;
  const behavior = reaction.behavior;
  const feed = definition.transportRuns.cell_furnace.gas;
  const firstReturn = definition.transportRuns.furnace_return.gas;
  const finalReturn = definition.transportRuns.return_final.gas;
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
  const coefficient = (species: string): number =>
    [...reaction.reactants, ...reaction.products].find((entry) => entry.species === species)
      ?.coefficient ?? 0;
  return [
    {
      kind: "feed",
      title: "Deliver the shared gas batch",
      metric: `${concise(coefficient("hydrogen"))} H₂ : ${concise(
        coefficient("chlorine")
      )} Cl₂ · ${concise(feed.maxFlow)} mol-eq/s`,
      detail:
        "The preloaded anode and cathode buffers join at R-05. Its fan carries the shared 1:1 reactant stream through a physical duct into R-02.",
    },
    {
      kind: "heat",
      title: "Activate and distribute CL-2",
      metric: `${concise(coil.behavior.targetTemperature)}°C target · ${concise(
        behavior.activationTemperature
      )}→${concise(behavior.activationTemperature + behavior.activationRange)}°C activation`,
      detail: `The Thermal Coil raises both gas layers through the CL-2 activation range. Grade 1 agitation exchanges the layers and applies ${concise(
        agitator.behavior.reactionMultiplier
      )}× reaction kinetics.`,
    },
    {
      kind: "convert",
      title: "Create hydrogen chloride",
      metric: `${concise(coefficient("hydrogen"))} H₂ + ${concise(
        coefficient("chlorine")
      )} Cl₂ → ${concise(coefficient("hydrogen_chloride"))} HCl`,
      detail: `Each layer resolves independently. Available 1:1 reactants and temperature activation set the live rate from a ${concise(
        behavior.maximumRate
      )} extent/s base.`,
    },
    {
      kind: "route",
      title: "Build acid residence time",
      metric: `R-02→R-04 ${concise(firstReturn.maxFlow)} · R-04→R-06 ${concise(
        finalReturn.maxFlow
      )} mol-eq/s`,
      detail:
        "The two return fans extend the HCl-bearing gas path across three combat rooms. Filled conduit and room inventories preserve corrosive exposure as the wave advances.",
    },
  ];
};

export const ACID_LINE_CONCEPT_MODEL: GuideConceptModel = {
  principle:
    "CL-2 is a temperature-activated continuous reaction. Shared H₂/Cl₂ feed supplies equal reactants, R-02 equipment establishes reaction conditions, and the return line carries the HCl product along the hostile route.",
  stages: acidLineStages(),
  conclusion:
    "Feed inventory, per-layer temperature, reactant balance, mixing, and downstream residence time shape the acid front. Prime charges the complete line; assault tests its corrosive exposure against armored shells.",
};
