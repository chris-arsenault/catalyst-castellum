import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import {
  placeTower as place,
  portfolioRound as round,
  targetTower as target,
  upgradeTower as upgrade,
} from "./buildCommands";

const towerId = (sequence: number): string => `tower:kettleblack:${sequence}`;

const wallPairs = (chassisId: "flash_chamber" | "caustic_jet"): ReturnType<typeof place>[] =>
  [
    [12, "left_wall", "right"],
    [27, "right_wall", "left"],
    [29, "left_wall", "right"],
    [46, "right_wall", "left"],
    [48, "left_wall", "right"],
    [67, "right_wall", "left"],
    [69, "left_wall", "right"],
    [82, "right_wall", "left"],
    [84, "left_wall", "right"],
    [100, "right_wall", "left"],
    [102, "left_wall", "right"],
    [120, "right_wall", "left"],
  ].map(([column, mountFace, orientation]) =>
    place(
      chassisId,
      { column: column as number, elevation: 7 },
      mountFace as "left_wall" | "right_wall",
      orientation as "left" | "right"
    )
  );

const preciseApproach: ReferenceBuildDefinition = {
  id: "kettleblack_precise_approach",
  archetype: "precise",
  rounds: [
    round(wallPairs("flash_chamber")),
    round([upgrade(towerId(3), "flash_calibration"), upgrade(towerId(9), "flash_calibration")]),
    round([upgrade(towerId(5), "flash_calibration"), target(towerId(11), "strongest")]),
    round([upgrade(towerId(3), "flash_breach"), upgrade(towerId(9), "flash_breach")]),
    round(),
  ],
};

const rapidApproach: ReferenceBuildDefinition = {
  id: "kettleblack_rapid_approach",
  archetype: "rapid",
  rounds: [
    round(wallPairs("caustic_jet")),
    round([upgrade(towerId(4), "caustic_manifold"), upgrade(towerId(10), "caustic_manifold")]),
    round([upgrade(towerId(6), "caustic_manifold"), upgrade(towerId(12), "caustic_manifold")]),
    round([upgrade(towerId(10), "caustic_split")]),
    round(),
  ],
};

const burnerPositions = [12, 29, 48, 69, 84, 102].map((column) =>
  place("carbon_burner", { column, elevation: 8 }, "left_wall", "right")
);
const rightCausticJets = [27, 46, 67, 82, 100, 120].map((column) =>
  place("caustic_jet", { column, elevation: 7 }, "right_wall", "left")
);

const areaApproach: ReferenceBuildDefinition = {
  id: "kettleblack_burner_approach",
  archetype: "area",
  rounds: [
    round([...burnerPositions, ...rightCausticJets]),
    round([upgrade(towerId(2), "burner_focus"), upgrade(towerId(5), "burner_focus")]),
    round([upgrade(towerId(8), "caustic_manifold"), upgrade(towerId(11), "caustic_manifold")]),
    round([upgrade(towerId(5), "burner_fan")]),
    round(),
  ],
};

const quenchPositions = [
  [18, 12],
  [38, 15],
  [57, 13],
  [75, 14],
  [92, 12],
  [111, 12],
].map(([column, elevation]) =>
  place("quench_coil", { column: column!, elevation: elevation! }, "ceiling", "down")
);

const controlledApproach: ReferenceBuildDefinition = {
  id: "kettleblack_controlled_approach",
  archetype: "control",
  rounds: [
    round([...quenchPositions, ...rightCausticJets]),
    round([upgrade(towerId(2), "quench_duration"), upgrade(towerId(5), "quench_duration")]),
    round([upgrade(towerId(8), "caustic_manifold"), upgrade(towerId(11), "caustic_manifold")]),
    round([upgrade(towerId(5), "quench_field")]),
    round(),
  ],
};

const supportedApproach: ReferenceBuildDefinition = {
  id: "kettleblack_supported_approach",
  archetype: "support",
  rounds: [
    round([
      ...[12, 29, 48, 69, 84, 102].map((column) =>
        place("carbonyl_marker", { column, elevation: 8 }, "left_wall", "right")
      ),
      ...[27, 46, 67, 82, 100, 120].map((column) =>
        place("flash_chamber", { column, elevation: 7 }, "right_wall", "left")
      ),
    ]),
    round([upgrade(towerId(8), "flash_calibration"), upgrade(towerId(11), "flash_calibration")]),
    round([upgrade(towerId(2), "marker_range"), target(towerId(5), "support")]),
    round([upgrade(towerId(11), "flash_breach")]),
    round(),
  ],
};

export const KETTLEBLACK_REFERENCE_BUILDS: readonly ReferenceBuildDefinition[] = [
  preciseApproach,
  rapidApproach,
  areaApproach,
  controlledApproach,
  supportedApproach,
];
