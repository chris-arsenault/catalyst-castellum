import { architecturalConnections } from "../game/world/map";
import { DEFAULT_GAME_DEFINITION } from "../game/definition";
import type { TutorialCopy, TutorialCopyKey } from "./copyTypes";

export type GuideConceptKind =
  "feed" | "accumulate" | "mix" | "ignite" | "convert" | "separate" | "relieve" | "heat" | "route";

export interface GuideConceptStage {
  kind: GuideConceptKind;
  title: TutorialCopyKey;
  metric: TutorialCopy;
  detail: TutorialCopy;
}

export interface GuideConceptModel {
  principle: TutorialCopyKey;
  stages: readonly GuideConceptStage[];
  conclusion: TutorialCopyKey;
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

const flashPointConceptValues = (): FlashPointConceptValues => {
  const reaction = DEFAULT_GAME_DEFINITION.reactions.hydrogen_oxygen_combustion;
  const behavior = reaction.behavior;
  const run = DEFAULT_GAME_DEFINITION.lineBlueprints["gas:core__furnace"];
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
    openPassages: architecturalConnections(DEFAULT_GAME_DEFINITION.map).filter(
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
    title: "tutorial.concept.flash.feed.title",
    metric: {
      key: "tutorial.concept.flash.feed.metric",
      parameters: {
        hydrogen: values.hydrogenCoefficient,
        oxygen: values.oxygenCoefficient,
        rate: values.maximumFeedRate,
      },
    },
    detail: "tutorial.concept.flash.feed.detail",
  },
  {
    kind: "accumulate",
    title: "tutorial.concept.flash.accumulate.title",
    metric: {
      key: "tutorial.concept.flash.accumulate.metric",
      parameters: { passages: values.openPassages },
    },
    detail: "tutorial.concept.flash.accumulate.detail",
  },
  {
    kind: "mix",
    title: "tutorial.concept.flash.mix.title",
    metric: {
      key: "tutorial.concept.flash.mix.metric",
      parameters: { density: values.mixtureDensity, exchange: values.layerExchangeRate },
    },
    detail: {
      key: "tutorial.concept.flash.mix.detail",
      parameters: { multiplier: values.reactionMultiplier },
    },
  },
  {
    kind: "ignite",
    title: "tutorial.concept.flash.ignite.title",
    metric: {
      key: "tutorial.concept.flash.ignite.metric",
      parameters: {
        hydrogenPercent: values.minimumHydrogenPercent,
        oxygenPercent: values.minimumOxygenPercent,
        hydrogen: values.requiredHydrogen,
        oxygen: values.requiredOxygen,
      },
    },
    detail: {
      key: "tutorial.concept.flash.ignite.detail",
      parameters: {
        base: values.pressurePulseBase,
        perExtent: values.pressurePulsePerExtent,
        heat: values.gasHeatPerExtent,
      },
    },
  },
];

const conceptValues = flashPointConceptValues();

export const FLASH_POINT_CONCEPT_MODEL: GuideConceptModel = {
  principle: "tutorial.concept.flash.principle",
  stages: conceptStages(conceptValues),
  conclusion: "tutorial.concept.flash.conclusion",
};
