/* eslint-disable max-lines -- Opening-site reference portfolios stay together for progression review. */

import type { GameCommand, LevelId } from "../types";
import type {
  BuildArchetypeId,
  DiversityRequirement,
  PlaytestPlan,
  PlaytestRoundPlan,
} from "../playtest/types";
import { MORROW_POCKET_REFERENCE_BUILDS } from "./playtestPortfolios/morrowPocket";
import { ACT_TWO_REFERENCE_BUILDS } from "./playtestPortfolios/actTwo";
import { ACT_THREE_REFERENCE_BUILDS } from "./playtestPortfolios/actThree";

export interface ReferenceBuildDefinition {
  id: string;
  archetype: BuildArchetypeId;
  rounds: readonly PlaytestRoundPlan[];
}

export interface LevelPlaytestPortfolio {
  levelId: LevelId;
  requirements: DiversityRequirement;
  referenceBuilds: readonly ReferenceBuildDefinition[];
}

const round = (commands: readonly GameCommand[] = []): PlaytestRoundPlan => ({ commands });

const guidedRequirements: DiversityRequirement = {
  minimumPassingBuilds: 1,
  minimumPassingArchetypes: 1,
  minimumDistinctSignatures: 1,
};

const openRequirements: DiversityRequirement = {
  minimumPassingBuilds: 5,
  minimumPassingArchetypes: 5,
  minimumDistinctSignatures: 5,
};

const CLAIM_LONG_LINE: readonly PlaytestRoundPlan[] = [
  round([
    {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    },
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    },
    {
      type: "upgrade_tower",
      towerId: "tower:claim_8_delta:1",
      upgradeId: "flash_calibration",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 15, elevation: 11 },
      mountFace: "ceiling",
      orientation: "down",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 27, elevation: 8 },
      mountFace: "right_wall",
      orientation: "left",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:claim_8_delta:2",
      upgradeId: "caustic_manifold",
    },
    {
      type: "set_tower_targeting",
      towerId: "tower:claim_8_delta:4",
      policy: "strongest",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:claim_8_delta:1",
      upgradeId: "flash_breach",
    },
  ]),
];

const CLAIM_RAPID_CROSSING: readonly PlaytestRoundPlan[] = [
  round([
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    },
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 27, elevation: 8 },
      mountFace: "right_wall",
      orientation: "left",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:claim_8_delta:1",
      upgradeId: "caustic_manifold",
    },
    {
      type: "upgrade_tower",
      towerId: "tower:claim_8_delta:2",
      upgradeId: "caustic_manifold",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 15, elevation: 11 },
      mountFace: "ceiling",
      orientation: "down",
    },
  ]),
  round(),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:claim_8_delta:3",
      upgradeId: "flash_calibration",
    },
  ]),
];

const HARKER_VERTICAL_FIELDS: readonly PlaytestRoundPlan[] = [
  round([
    {
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column: 39, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    },
    {
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column: 45, elevation: 9 },
      mountFace: "ceiling",
      orientation: "down",
    },
    {
      type: "set_tower_targeting",
      towerId: "tower:harkers_brace:2",
      policy: "last",
    },
    {
      type: "upgrade_tower",
      towerId: "tower:harkers_brace:1",
      upgradeId: "burner_focus",
    },
    {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 58, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column: 73, elevation: 15 },
      mountFace: "left_wall",
      orientation: "right",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 82, elevation: 10 },
      mountFace: "ceiling",
      orientation: "down",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 88, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:harkers_brace:5",
      upgradeId: "caustic_manifold",
    },
  ]),
];

const TWELVE_CASK_REACTION: readonly PlaytestRoundPlan[] = [
  round([
    {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    },
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 27, elevation: 8 },
      mountFace: "right_wall",
      orientation: "left",
    },
    {
      type: "place_tower",
      chassisId: "acid_pot",
      anchor: { column: 10, elevation: 13 },
      mountFace: "floor",
      orientation: "right",
    },
    {
      type: "place_tower",
      chassisId: "quench_coil",
      anchor: { column: 10, elevation: 11 },
      mountFace: "ceiling",
      orientation: "down",
    },
    {
      type: "upgrade_tower",
      towerId: "tower:twelve_cask:3",
      upgradeId: "acid_charge",
    },
    {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 15, elevation: 11 },
      mountFace: "ceiling",
      orientation: "down",
    },
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 20 },
      mountFace: "left_wall",
      orientation: "right",
    },
  ]),
  round([
    {
      type: "place_tower",
      chassisId: "acid_pot",
      anchor: { column: 9, elevation: 23 },
      mountFace: "floor",
      orientation: "right",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:twelve_cask:4",
      upgradeId: "quench_duration",
    },
    {
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column: 36, elevation: 18 },
      mountFace: "left_wall",
      orientation: "right",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:twelve_cask:7",
      upgradeId: "acid_charge",
    },
    {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 48, elevation: 8 },
      mountFace: "right_wall",
      orientation: "left",
    },
  ]),
  round([
    {
      type: "upgrade_tower",
      towerId: "tower:twelve_cask:9",
      upgradeId: "caustic_manifold",
    },
  ]),
];

export const LEVEL_PLAYTEST_PORTFOLIOS = {
  claim_8_delta: {
    levelId: "claim_8_delta",
    requirements: guidedRequirements,
    referenceBuilds: [
      {
        id: "claim_long_line",
        archetype: "precise",
        rounds: CLAIM_LONG_LINE,
      },
      {
        id: "claim_rapid_crossing",
        archetype: "rapid",
        rounds: CLAIM_RAPID_CROSSING,
      },
    ],
  },
  harkers_brace: {
    levelId: "harkers_brace",
    requirements: guidedRequirements,
    referenceBuilds: [
      {
        id: "vertical_fields",
        archetype: "area",
        rounds: HARKER_VERTICAL_FIELDS,
      },
    ],
  },
  twelve_cask: {
    levelId: "twelve_cask",
    requirements: guidedRequirements,
    referenceBuilds: [
      {
        id: "neutralization_service",
        archetype: "hybrid",
        rounds: TWELVE_CASK_REACTION,
      },
    ],
  },
  morrow_pocket: {
    levelId: "morrow_pocket",
    requirements: openRequirements,
    referenceBuilds: MORROW_POCKET_REFERENCE_BUILDS,
  },
  kettleblack: {
    levelId: "kettleblack",
    requirements: openRequirements,
    referenceBuilds: ACT_TWO_REFERENCE_BUILDS.kettleblack,
  },
  cordon_41: {
    levelId: "cordon_41",
    requirements: openRequirements,
    referenceBuilds: ACT_TWO_REFERENCE_BUILDS.cordon_41,
  },
  junction_l6: {
    levelId: "junction_l6",
    requirements: openRequirements,
    referenceBuilds: ACT_TWO_REFERENCE_BUILDS.junction_l6,
  },
  pell_cut: {
    levelId: "pell_cut",
    requirements: openRequirements,
    referenceBuilds: ACT_TWO_REFERENCE_BUILDS.pell_cut,
  },
  station_14: {
    levelId: "station_14",
    requirements: openRequirements,
    referenceBuilds: ACT_THREE_REFERENCE_BUILDS.station_14,
  },
  vasker_store: {
    levelId: "vasker_store",
    requirements: openRequirements,
    referenceBuilds: ACT_THREE_REFERENCE_BUILDS.vasker_store,
  },
  lane_six: {
    levelId: "lane_six",
    requirements: openRequirements,
    referenceBuilds: ACT_THREE_REFERENCE_BUILDS.lane_six,
  },
  pell_cordon: {
    levelId: "pell_cordon",
    requirements: openRequirements,
    referenceBuilds: ACT_THREE_REFERENCE_BUILDS.pell_cordon,
  },
} as Record<LevelId, LevelPlaytestPortfolio>;

/** Authored partial builds that must lose once a later lesson or defense stage begins. */
export const LEVEL_FAILURE_CONTROL_BUILDS = {
  claim_8_delta: [
    {
      id: "single_wall_flash",
      archetype: "precise",
      rounds: [round(CLAIM_LONG_LINE[0]!.commands.slice(0, 1))],
    },
  ],
  harkers_brace: [
    {
      id: "single_wall_burner",
      archetype: "area",
      rounds: [round(HARKER_VERTICAL_FIELDS[0]!.commands.slice(0, 1))],
    },
  ],
  twelve_cask: [],
  morrow_pocket: [],
  kettleblack: [],
  cordon_41: [],
  junction_l6: [],
  pell_cut: [],
  station_14: [],
  vasker_store: [],
  lane_six: [],
  pell_cordon: [],
} as Record<LevelId, readonly ReferenceBuildDefinition[]>;

export const playtestPortfolioFor = (levelId: LevelId): LevelPlaytestPortfolio =>
  LEVEL_PLAYTEST_PORTFOLIOS[levelId];

export const referenceBuildsFor = (levelId: LevelId): PlaytestPlan[] =>
  LEVEL_PLAYTEST_PORTFOLIOS[levelId].referenceBuilds.map((build) => ({
    name: build.id,
    archetype: build.archetype,
    rounds: build.rounds,
  }));

export const failureControlBuildsFor = (levelId: LevelId): PlaytestPlan[] =>
  LEVEL_FAILURE_CONTROL_BUILDS[levelId].map((build) => ({
    name: build.id,
    archetype: build.archetype,
    rounds: build.rounds,
  }));

export const primaryReferenceBuildFor = (levelId: LevelId): PlaytestPlan => {
  const build = referenceBuildsFor(levelId)[0];
  if (!build) throw new Error(`Level ${levelId} has no reference build.`);
  return build;
};
