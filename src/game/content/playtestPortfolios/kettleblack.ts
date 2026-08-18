import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import {
  placeTower as place,
  portfolioRound as round,
  targetTower as target,
  upgradeTower as upgrade,
} from "./buildCommands";

const towerId = (sequence: number): string => `tower:kettleblack:${sequence}`;

const wallPairs = (chassisId: "bolt_caster" | "repeater"): ReturnType<typeof place>[] =>
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
    round(wallPairs("bolt_caster")),
    round([upgrade(towerId(3), "bolt_calibration"), upgrade(towerId(9), "bolt_calibration")]),
    round([upgrade(towerId(5), "bolt_calibration"), target(towerId(11), "strongest")]),
    round([upgrade(towerId(3), "bolt_piercing"), upgrade(towerId(9), "bolt_piercing")]),
    round(),
  ],
};

const rapidApproach: ReferenceBuildDefinition = {
  id: "kettleblack_rapid_approach",
  archetype: "rapid",
  rounds: [
    round(wallPairs("repeater")),
    round([upgrade(towerId(4), "repeater_feed"), upgrade(towerId(10), "repeater_feed")]),
    round([upgrade(towerId(6), "repeater_feed"), upgrade(towerId(12), "repeater_feed")]),
    round([upgrade(towerId(10), "repeater_tracking")]),
    round(),
  ],
};

const projectorPositions = [12, 29, 48, 69, 84, 102].map((column) =>
  place("line_projector", { column, elevation: 8 }, "left_wall", "right")
);
const rightRepeaters = [27, 46, 67, 82, 100, 120].map((column) =>
  place("repeater", { column, elevation: 7 }, "right_wall", "left")
);

const areaApproach: ReferenceBuildDefinition = {
  id: "kettleblack_projector_approach",
  archetype: "area",
  rounds: [
    round([...projectorPositions, ...rightRepeaters]),
    round([upgrade(towerId(2), "projector_focus"), upgrade(towerId(5), "projector_focus")]),
    round([upgrade(towerId(8), "repeater_feed"), upgrade(towerId(11), "repeater_feed")]),
    round([upgrade(towerId(5), "projector_fan")]),
    round(),
  ],
};

const snarePositions = [
  [18, 12],
  [38, 15],
  [57, 13],
  [75, 14],
  [92, 12],
  [111, 12],
].map(([column, elevation]) =>
  place("snare_emitter", { column: column!, elevation: elevation! }, "ceiling", "down")
);

const controlledApproach: ReferenceBuildDefinition = {
  id: "kettleblack_controlled_approach",
  archetype: "control",
  rounds: [
    round([...snarePositions, ...rightRepeaters]),
    round([upgrade(towerId(2), "snare_duration"), upgrade(towerId(5), "snare_duration")]),
    round([upgrade(towerId(8), "repeater_feed"), upgrade(towerId(11), "repeater_feed")]),
    round([upgrade(towerId(5), "snare_field")]),
    round(),
  ],
};

const supportedApproach: ReferenceBuildDefinition = {
  id: "kettleblack_supported_approach",
  archetype: "support",
  rounds: [
    round([
      ...[12, 29, 48, 69, 84, 102].map((column) =>
        place("relay", { column, elevation: 8 }, "left_wall", "right")
      ),
      ...[27, 46, 67, 82, 100, 120].map((column) =>
        place("bolt_caster", { column, elevation: 7 }, "right_wall", "left")
      ),
    ]),
    round([upgrade(towerId(8), "bolt_calibration"), upgrade(towerId(11), "bolt_calibration")]),
    round([upgrade(towerId(2), "relay_range"), target(towerId(5), "support")]),
    round([upgrade(towerId(11), "bolt_piercing")]),
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
