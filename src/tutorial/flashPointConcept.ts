import { DEFAULT_GAME_DEFINITION } from "../game/definition";

export type GuideConceptKind =
  "feed" | "accumulate" | "mix" | "ignite" | "convert" | "separate" | "relieve" | "heat" | "route";

export interface GuideConceptStage {
  kind: GuideConceptKind;
  title: string;
  metric: string;
  detail: string;
}

export interface GuideConceptModel {
  principle: string;
  stages: readonly GuideConceptStage[];
  conclusion: string;
}

interface FlashPointConceptValues {
  gasHeatPerExtent: number;
  hydrogenCoefficient: number;
  layerExchangeRate: number;
  maximumFeedRate: number;
  minimumHydrogenPercent: number;
  minimumOxygenPercent: number;
  mixtureDensity: number;
  openPassages: number;
  oxygenCoefficient: number;
  pressurePulseBase: number;
  pressurePulsePerExtent: number;
  reactionMultiplier: number;
  requiredHydrogen: number;
  requiredOxygen: number;
}

const conciseNumber = (value: number): string => String(Number(value.toFixed(2)));

const flashPointConceptValues = (): FlashPointConceptValues => {
  const reaction = DEFAULT_GAME_DEFINITION.reactions.hydrogen_oxygen_combustion;
  const behavior = reaction.behavior;
  const run = DEFAULT_GAME_DEFINITION.transportRuns.core_furnace.gas;
  const grade = DEFAULT_GAME_DEFINITION.equipment.gas_agitator.grades.find(
    (candidate) => candidate.level === 1
  );
  const hydrogen = reaction.reactants.find((entry) => entry.species === "hydrogen");
  const oxygen = reaction.reactants.find((entry) => entry.species === "oxygen");
  if (
    behavior.kind !== "flash" ||
    !run ||
    grade?.behavior.kind !== "gas_agitator" ||
    !hydrogen ||
    !oxygen
  ) {
    throw new Error("Flash Point conceptual model requires OX-1, its feed, and Grade 1 agitation");
  }

  const reactionMultiplier = grade.behavior.reactionMultiplier;
  const requiredExtent = behavior.ignitionExtent / 2 / reactionMultiplier;
  const totalCoefficient = hydrogen.coefficient + oxygen.coefficient;
  return {
    gasHeatPerExtent: behavior.gasHeatPerExtent,
    hydrogenCoefficient: hydrogen.coefficient,
    layerExchangeRate: grade.behavior.layerExchangeRate,
    maximumFeedRate: run.maxFlow,
    minimumHydrogenPercent: behavior.minimumHydrogenFraction * 100,
    minimumOxygenPercent: behavior.minimumOxygenFraction * 100,
    mixtureDensity:
      (hydrogen.coefficient * DEFAULT_GAME_DEFINITION.species.hydrogen.referenceDensity +
        oxygen.coefficient * DEFAULT_GAME_DEFINITION.species.oxygen.referenceDensity) /
      totalCoefficient,
    openPassages: DEFAULT_GAME_DEFINITION.facilityMap.portals.filter(
      (portal) =>
        portal.rooms.includes("furnace") &&
        portal.defaultOpen !== false &&
        portal.defaultSealed !== true &&
        portal.gasConductance > 0
    ).length,
    oxygenCoefficient: oxygen.coefficient,
    pressurePulseBase: behavior.pressurePulseBase,
    pressurePulsePerExtent: behavior.pressurePulsePerExtent,
    reactionMultiplier,
    requiredHydrogen: hydrogen.coefficient * requiredExtent,
    requiredOxygen: oxygen.coefficient * requiredExtent,
  };
};

const conceptStages = (values: FlashPointConceptValues): GuideConceptStage[] => [
  {
    kind: "feed",
    title: "Deliver reaction mass",
    metric: `${conciseNumber(values.hydrogenCoefficient)} H₂ : ${conciseNumber(
      values.oxygenCoefficient
    )} O₂ · up to ${conciseNumber(values.maximumFeedRate)} mol-eq/s`,
    detail:
      "The physical duct fills first. Once charged, its fan delivers the light starter mixture through R-02’s upper port.",
  },
  {
    kind: "accumulate",
    title: "Build chamber inventory",
    metric: `${values.openPassages} open passages · pressure/density outflow`,
    detail:
      "Near ambient pressure, the openings exchange little net gas. Feed initially exceeds escape, so H₂/O₂ inventory and static pressure rise; growing overpressure strengthens outward flow.",
  },
  {
    kind: "mix",
    title: "Distribute both layers",
    metric: `${conciseNumber(values.mixtureDensity)}× air density · ${conciseNumber(
      values.layerExchangeRate
    )} layer exchange`,
    detail: `The light feed favors the upper layer. Grade 1 agitation swaps gas packets between layers and applies ${conciseNumber(
      values.reactionMultiplier
    )}× OX-1 kinetics, preparing both layers for ignition.`,
  },
  {
    kind: "ignite",
    title: "Cross the ignition gate",
    metric: `H₂ ≥ ${conciseNumber(values.minimumHydrogenPercent)}% · O₂ ≥ ${conciseNumber(
      values.minimumOxygenPercent
    )}% · ${conciseNumber(values.requiredHydrogen)} H₂ + ${conciseNumber(
      values.requiredOxygen
    )} O₂`,
    detail: `Each layer is evaluated independently. A ready layer consumes the 2:1 mixture, creates steam, adds ${conciseNumber(
      values.pressurePulseBase
    )} + ${conciseNumber(
      values.pressurePulsePerExtent
    )} × extent kPa of transient pressure, and raises gas temperature by ${conciseNumber(
      values.gasHeatPerExtent
    )} °C × extent.`,
  },
];

const conceptValues = flashPointConceptValues();

export const FLASH_POINT_CONCEPT_MODEL: GuideConceptModel = {
  principle:
    "Every simulation step resolves conserved gas inventory, density-driven stratification, pressure-driven exchange through open passages, and separate upper/lower reaction conditions. OX-1 emerges when one layer crosses every ignition threshold.",
  stages: conceptStages(conceptValues),
  conclusion:
    "The fan controls reaction mass. The room openings set state-dependent leakage. The agitator controls vertical distribution and reaction readiness. Pressure measures retained gas and becomes a damage output; the ignition gate uses composition, batch, agitation, and cooldown. Prime supplies transport time; assault tests whether a crawler occupies R-02 when the next threshold crossing produces a flash.",
};
