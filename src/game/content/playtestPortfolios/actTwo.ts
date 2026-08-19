/* eslint-disable max-lines-per-function -- Each factory is declarative authored strategy data. */

import type { CanonicalLevelId } from "../../types";
import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import {
  buildLine as line,
  install,
  LIQUID_CHARGES,
  placeTower as place,
  portfolioRound as round,
  targetTower as target,
  upgradeTower as upgrade,
} from "./buildCommands";
import { KETTLEBLACK_REFERENCE_BUILDS } from "./kettleblack";

type WallPlacement = readonly [column: number, elevation: number];
type ControlPlacement = readonly [
  column: number,
  elevation: number,
  face: "floor" | "left_wall" | "right_wall" | "ceiling",
];
type OrientedPlacement = readonly [
  column: number,
  elevation: number,
  face: "floor" | "left_wall" | "right_wall" | "ceiling",
  orientation: "left" | "right" | "up" | "down",
];

export interface SiteDefenseGeometry {
  levelId: CanonicalLevelId;
  walls: readonly WallPlacement[];
  controlMounts: readonly ControlPlacement[];
  upperMounts: readonly OrientedPlacement[];
  controlDamageMounts: readonly OrientedPlacement[];
  controlBurnerCount: 0 | 6;
}

const towerId = (levelId: CanonicalLevelId, sequence: number): string =>
  `tower:${levelId}:${sequence}`;

const wallTower = (
  chassisId: "flash_chamber" | "caustic_jet" | "carbon_burner" | "wash_head" | "carbonyl_marker",
  [column, elevation]: WallPlacement
) => place(chassisId, { column, elevation }, "right_wall", "left");

const surfaceOrientation = (face: ControlPlacement[2]) => {
  if (face === "ceiling") return "down";
  if (face === "right_wall") return "left";
  return "right";
};

const quenchTower = ([column, elevation, face]: ControlPlacement) =>
  place("quench_coil", { column, elevation }, face, surfaceOrientation(face));

const surfaceFlash = ([column, elevation, face]: ControlPlacement) =>
  place("flash_chamber", { column, elevation }, face, surfaceOrientation(face));

export const directTowerBuilds = ({
  levelId,
  walls,
  controlMounts,
  upperMounts,
  controlDamageMounts,
  controlBurnerCount,
}: SiteDefenseGeometry): ReferenceBuildDefinition[] => {
  const precise: ReferenceBuildDefinition = {
    id: `${levelId}_precise_line`,
    archetype: "precise",
    rounds: [
      round([
        ...walls.slice(0, 14).map((placement) => wallTower("caustic_jet", placement)),
        ...controlMounts.slice(0, 4).map(surfaceFlash),
      ]),
      round([
        ...walls.slice(14, 16).map((placement) => wallTower("caustic_jet", placement)),
        upgrade(towerId(levelId, 4), "caustic_manifold"),
        upgrade(towerId(levelId, 8), "caustic_manifold"),
      ]),
      round([
        upgrade(towerId(levelId, 11), "caustic_manifold"),
        upgrade(towerId(levelId, 14), "caustic_manifold"),
      ]),
      round([upgrade(towerId(levelId, 8), "caustic_split")]),
      round([
        upgrade(towerId(levelId, 15), "flash_calibration"),
        upgrade(towerId(levelId, 16), "flash_calibration"),
        upgrade(towerId(levelId, 17), "flash_calibration"),
        upgrade(towerId(levelId, 18), "flash_calibration"),
      ]),
    ],
  };
  const rapid: ReferenceBuildDefinition = {
    id: `${levelId}_rapid_service`,
    archetype: "rapid",
    rounds: [
      round(walls.slice(0, 14).map((placement) => wallTower("caustic_jet", placement))),
      round([
        ...walls.slice(14, 16).map((placement) => wallTower("caustic_jet", placement)),
        upgrade(towerId(levelId, 4), "caustic_manifold"),
        upgrade(towerId(levelId, 8), "caustic_manifold"),
      ]),
      round([
        upgrade(towerId(levelId, 11), "caustic_manifold"),
        upgrade(towerId(levelId, 15), "caustic_manifold"),
      ]),
      round([
        upgrade(towerId(levelId, 8), "caustic_split"),
        ...(walls[15] ? [upgrade(towerId(levelId, 16), "caustic_split")] : []),
      ]),
      round(),
    ],
  };
  const burnerCount = 6;
  const area: ReferenceBuildDefinition = {
    id: `${levelId}_burner_screen`,
    archetype: "area",
    rounds: [
      round([
        ...walls.slice(0, burnerCount).map((placement) => wallTower("carbon_burner", placement)),
        ...walls
          .slice(burnerCount, burnerCount + 9)
          .map((placement) => wallTower("caustic_jet", placement)),
      ]),
      round([
        upgrade(towerId(levelId, 2), "burner_focus"),
        upgrade(towerId(levelId, 5), "burner_focus"),
      ]),
      round([upgrade(towerId(levelId, 8), "caustic_manifold")]),
      round([upgrade(towerId(levelId, 5), "burner_fan")]),
      round(),
    ],
  };
  const controlCount = 4;
  const control: ReferenceBuildDefinition = {
    id: `${levelId}_controlled_routes`,
    archetype: "control",
    rounds: [
      round([
        ...controlMounts.slice(0, controlCount).map(quenchTower),
        ...walls
          .slice(0, controlBurnerCount)
          .map((placement) => wallTower("carbon_burner", placement)),
        ...walls
          .slice(controlBurnerCount, 14)
          .map((placement) => wallTower("caustic_jet", placement)),
      ]),
      round([
        ...upperMounts.map(([column, elevation, face, orientation]) =>
          place("wash_head", { column, elevation }, face, orientation)
        ),
        ...controlDamageMounts.map(([column, elevation, face, orientation]) =>
          place("carbon_burner", { column, elevation }, face, orientation)
        ),
        upgrade(towerId(levelId, 2), "quench_duration"),
        upgrade(towerId(levelId, 4), "quench_duration"),
      ]),
      round([
        ...(controlBurnerCount === 0
          ? [
              upgrade(towerId(levelId, 8), "caustic_manifold"),
              upgrade(towerId(levelId, 10), "caustic_manifold"),
            ]
          : [
              upgrade(towerId(levelId, 6), "burner_focus"),
              upgrade(towerId(levelId, 9), "burner_focus"),
            ]),
        ...upperMounts.map((_, index) => upgrade(towerId(levelId, 19 + index), "wash_burst")),
      ]),
      round([
        upgrade(towerId(levelId, 4), "quench_field"),
        ...(controlBurnerCount === 0 ? [] : [upgrade(towerId(levelId, 6), "burner_fan")]),
        ...upperMounts.map((_, index) => upgrade(towerId(levelId, 19 + index), "wash_column")),
      ]),
      round([
        ...(controlBurnerCount === 0 ? [] : [upgrade(towerId(levelId, 8), "burner_focus")]),
        ...controlDamageMounts.map((_, index) =>
          upgrade(towerId(levelId, 19 + upperMounts.length + index), "burner_focus")
        ),
      ]),
    ],
  };
  const support: ReferenceBuildDefinition = {
    id: `${levelId}_support_priority`,
    archetype: "support",
    rounds: [
      round([
        ...walls.slice(0, 2).map((placement) => wallTower("carbonyl_marker", placement)),
        ...walls.slice(2, 10).map((placement) => wallTower("caustic_jet", placement)),
        ...walls
          .slice(10, 14)
          .map((placement) =>
            place(
              "wash_head",
              { column: placement[0], elevation: placement[1] },
              "right_wall",
              "left"
            )
          ),
      ]),
      round([target(towerId(levelId, 1), "support"), target(towerId(levelId, 2), "support")]),
      round([
        upgrade(towerId(levelId, 4), "caustic_manifold"),
        upgrade(towerId(levelId, 7), "caustic_manifold"),
      ]),
      round([upgrade(towerId(levelId, 2), "marker_range")]),
      round(),
    ],
  };
  return [precise, rapid, area, control, support];
};

const CORDON_GEOMETRY: SiteDefenseGeometry = {
  levelId: "cordon_41",
  walls: [
    [55, 9],
    [68, 9],
    [82, 7],
    [82, 23],
    [98, 21],
    [98, 7],
    [118, 7],
    [138, 5],
    [68, 11],
    [82, 11],
    [82, 25],
    [98, 25],
    [98, 9],
    [118, 9],
    [138, 9],
  ],
  controlMounts: [
    [52, 13, "ceiling"],
    [57, 17, "ceiling"],
    [77, 6, "floor"],
    [69, 34, "ceiling"],
    [95, 20, "floor"],
    [88, 4, "floor"],
    [100, 12, "ceiling"],
    [121, 4, "floor"],
  ],
  upperMounts: [],
  controlDamageMounts: [],
  controlBurnerCount: 0,
};

const JUNCTION_GEOMETRY: SiteDefenseGeometry = {
  levelId: "junction_l6",
  walls: [
    [43, 7],
    [66, 7],
    [87, 5],
    [87, 17],
    [106, 15],
    [106, 7],
    [126, 7],
    [146, 5],
    [66, 9],
    [87, 9],
    [87, 19],
    [106, 19],
    [106, 9],
    [126, 9],
    [146, 9],
  ],
  controlMounts: [
    [39, 12, "ceiling"],
    [45, 13, "ceiling"],
    [79, 4, "floor"],
    [69, 23, "ceiling"],
    [98, 14, "floor"],
    [89, 4, "floor"],
    [108, 12, "ceiling"],
    [129, 4, "floor"],
  ],
  upperMounts: [],
  controlDamageMounts: [],
  controlBurnerCount: 6,
};

const PELL_GEOMETRY: SiteDefenseGeometry = {
  levelId: "pell_cut",
  walls: [
    [48, 7],
    [66, 7],
    [84, 5],
    [84, 20],
    [102, 18],
    [102, 7],
    [122, 7],
    [142, 5],
    [66, 9],
    [84, 9],
    [84, 22],
    [102, 22],
    [102, 9],
    [122, 9],
    [142, 9],
  ],
  controlMounts: [
    [45, 12, "ceiling"],
    [50, 15, "ceiling"],
    [77, 4, "floor"],
    [68, 28, "ceiling"],
    [95, 17, "floor"],
    [86, 4, "floor"],
    [104, 12, "ceiling"],
    [125, 4, "floor"],
  ],
  upperMounts: [],
  controlDamageMounts: [],
  controlBurnerCount: 6,
};

export const processAssistedTowerBuild = (
  geometry: SiteDefenseGeometry,
  outputRoomId: "gallery" | "furnace"
): ReferenceBuildDefinition => {
  const { levelId, walls } = geometry;
  const processCommands = [
    ...LIQUID_CHARGES,
    install("lower_intake", "socket_a", "membrane_cell"),
    ...line("liquid_line", "core", "lower_intake"),
    ...line("gas_line", "lower_intake", outputRoomId),
  ];
  return {
    id: `${levelId}_prepared_burners`,
    archetype: "hybrid",
    rounds: [
      round([
        ...walls.slice(0, 6).map((placement) => wallTower("carbon_burner", placement)),
        ...walls.slice(6, 12).map((placement) => wallTower("caustic_jet", placement)),
        ...processCommands,
      ]),
      round([
        ...LIQUID_CHARGES,
        upgrade(towerId(levelId, 5), "burner_focus"),
        ...walls.slice(12, 15).map((placement) => wallTower("caustic_jet", placement)),
      ]),
      round([upgrade(towerId(levelId, 8), "caustic_manifold")]),
      round([upgrade(towerId(levelId, 5), "burner_fan")]),
      round([...LIQUID_CHARGES]),
    ],
  };
};

export const towerPortfolioWithProcessAlternative = (
  geometry: SiteDefenseGeometry,
  outputRoomId: "gallery" | "furnace"
): readonly ReferenceBuildDefinition[] => [
  ...directTowerBuilds(geometry).slice(0, 4),
  processAssistedTowerBuild(geometry, outputRoomId),
];

export const ACT_TWO_REFERENCE_BUILDS = {
  kettleblack: KETTLEBLACK_REFERENCE_BUILDS,
  cordon_41: directTowerBuilds(CORDON_GEOMETRY),
  junction_l6: towerPortfolioWithProcessAlternative(JUNCTION_GEOMETRY, "gallery"),
  pell_cut: towerPortfolioWithProcessAlternative(PELL_GEOMETRY, "furnace"),
} as const satisfies Record<string, readonly ReferenceBuildDefinition[]>;
