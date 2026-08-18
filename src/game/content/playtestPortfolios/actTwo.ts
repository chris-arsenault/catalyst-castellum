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
type SnarePlacement = readonly [column: number, elevation: number, face: "floor" | "ceiling"];

export interface SiteDefenseGeometry {
  levelId: CanonicalLevelId;
  walls: readonly WallPlacement[];
  snares: readonly SnarePlacement[];
}

const towerId = (levelId: CanonicalLevelId, sequence: number): string =>
  `tower:${levelId}:${sequence}`;

const wallTower = (
  chassisId: "bolt_caster" | "repeater" | "line_projector" | "relay",
  [column, elevation]: WallPlacement
) => place(chassisId, { column, elevation }, "right_wall", "left");

const snareTower = ([column, elevation, face]: SnarePlacement) =>
  place("snare_emitter", { column, elevation }, face, face === "ceiling" ? "down" : "right");

const surfaceBolt = ([column, elevation, face]: SnarePlacement) =>
  place("bolt_caster", { column, elevation }, face, face === "ceiling" ? "down" : "right");

export const directTowerBuilds = ({
  levelId,
  walls,
  snares,
}: SiteDefenseGeometry): ReferenceBuildDefinition[] => {
  const precise: ReferenceBuildDefinition = {
    id: `${levelId}_precise_line`,
    archetype: "precise",
    rounds: [
      round([
        ...walls.slice(0, 14).map((placement) => wallTower("repeater", placement)),
        ...snares.slice(0, 4).map(surfaceBolt),
      ]),
      round([
        ...walls.slice(14, 16).map((placement) => wallTower("repeater", placement)),
        upgrade(towerId(levelId, 4), "repeater_feed"),
        upgrade(towerId(levelId, 8), "repeater_feed"),
      ]),
      round([
        upgrade(towerId(levelId, 11), "repeater_feed"),
        upgrade(towerId(levelId, 14), "repeater_feed"),
      ]),
      round([upgrade(towerId(levelId, 8), "repeater_tracking")]),
      round([
        upgrade(towerId(levelId, 15), "bolt_calibration"),
        upgrade(towerId(levelId, 16), "bolt_calibration"),
        upgrade(towerId(levelId, 17), "bolt_calibration"),
        upgrade(towerId(levelId, 18), "bolt_calibration"),
      ]),
    ],
  };
  const rapid: ReferenceBuildDefinition = {
    id: `${levelId}_rapid_service`,
    archetype: "rapid",
    rounds: [
      round(walls.slice(0, 14).map((placement) => wallTower("repeater", placement))),
      round([
        ...walls.slice(14, 16).map((placement) => wallTower("repeater", placement)),
        upgrade(towerId(levelId, 4), "repeater_feed"),
        upgrade(towerId(levelId, 8), "repeater_feed"),
      ]),
      round([
        upgrade(towerId(levelId, 11), "repeater_feed"),
        upgrade(towerId(levelId, 15), "repeater_feed"),
      ]),
      round([
        upgrade(towerId(levelId, 8), "repeater_tracking"),
        ...(walls[15] ? [upgrade(towerId(levelId, 16), "repeater_tracking")] : []),
      ]),
      round(),
    ],
  };
  const projectorCount = 6;
  const area: ReferenceBuildDefinition = {
    id: `${levelId}_projector_screen`,
    archetype: "area",
    rounds: [
      round([
        ...walls
          .slice(0, projectorCount)
          .map((placement) => wallTower("line_projector", placement)),
        ...walls
          .slice(projectorCount, projectorCount + 9)
          .map((placement) => wallTower("repeater", placement)),
      ]),
      round([
        upgrade(towerId(levelId, 2), "projector_focus"),
        upgrade(towerId(levelId, 5), "projector_focus"),
      ]),
      round([upgrade(towerId(levelId, 8), "repeater_feed")]),
      round([upgrade(towerId(levelId, 5), "projector_fan")]),
      round(),
    ],
  };
  const controlCount = 4;
  const control: ReferenceBuildDefinition = {
    id: `${levelId}_controlled_routes`,
    archetype: "control",
    rounds: [
      round([
        ...snares.slice(0, controlCount).map(snareTower),
        ...walls.slice(0, 14).map((placement) => wallTower("repeater", placement)),
      ]),
      round([
        upgrade(towerId(levelId, 2), "snare_duration"),
        upgrade(towerId(levelId, 4), "snare_duration"),
      ]),
      round([upgrade(towerId(levelId, 8), "repeater_feed")]),
      round([upgrade(towerId(levelId, 4), "snare_field")]),
      round(),
    ],
  };
  const support: ReferenceBuildDefinition = {
    id: `${levelId}_support_priority`,
    archetype: "support",
    rounds: [
      round([
        ...walls.slice(0, 2).map((placement) => wallTower("relay", placement)),
        ...walls.slice(2, 10).map((placement) => wallTower("repeater", placement)),
        ...walls
          .slice(10, 14)
          .map((placement) =>
            place(
              "flak_nest",
              { column: placement[0], elevation: placement[1] },
              "right_wall",
              "left"
            )
          ),
      ]),
      round([target(towerId(levelId, 1), "support"), target(towerId(levelId, 2), "support")]),
      round([
        upgrade(towerId(levelId, 4), "repeater_feed"),
        upgrade(towerId(levelId, 7), "repeater_feed"),
      ]),
      round([upgrade(towerId(levelId, 2), "relay_range")]),
      round(),
    ],
  };
  return [precise, rapid, area, control, support];
};

const CORDON_GEOMETRY: SiteDefenseGeometry = {
  levelId: "cordon_41",
  walls: [
    [55, 7],
    [68, 7],
    [82, 7],
    [82, 21],
    [98, 21],
    [98, 5],
    [118, 5],
    [138, 5],
    [68, 11],
    [82, 11],
    [82, 25],
    [98, 25],
    [98, 9],
    [118, 9],
    [138, 9],
  ],
  snares: [
    [52, 13, "ceiling"],
    [57, 17, "ceiling"],
    [77, 6, "floor"],
    [69, 34, "ceiling"],
    [95, 20, "floor"],
    [88, 4, "floor"],
    [100, 12, "ceiling"],
    [121, 4, "floor"],
  ],
};

const JUNCTION_GEOMETRY: SiteDefenseGeometry = {
  levelId: "junction_l6",
  walls: [
    [43, 5],
    [66, 5],
    [87, 5],
    [87, 15],
    [106, 15],
    [106, 5],
    [126, 5],
    [146, 5],
    [66, 9],
    [87, 9],
    [87, 19],
    [106, 19],
    [106, 9],
    [126, 9],
    [146, 9],
  ],
  snares: [
    [39, 12, "ceiling"],
    [45, 13, "ceiling"],
    [79, 4, "floor"],
    [69, 23, "ceiling"],
    [98, 14, "floor"],
    [89, 4, "floor"],
    [108, 12, "ceiling"],
    [129, 4, "floor"],
  ],
};

const PELL_GEOMETRY: SiteDefenseGeometry = {
  levelId: "pell_cut",
  walls: [
    [48, 5],
    [66, 5],
    [84, 5],
    [84, 18],
    [102, 18],
    [102, 5],
    [122, 5],
    [142, 5],
    [66, 9],
    [84, 9],
    [84, 22],
    [102, 22],
    [102, 9],
    [122, 9],
    [142, 9],
  ],
  snares: [
    [45, 12, "ceiling"],
    [50, 15, "ceiling"],
    [77, 4, "floor"],
    [68, 28, "ceiling"],
    [95, 17, "floor"],
    [86, 4, "floor"],
    [104, 12, "ceiling"],
    [125, 4, "floor"],
  ],
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
    id: `${levelId}_prepared_projectors`,
    archetype: "hybrid",
    rounds: [
      round([
        ...walls.slice(0, 6).map((placement) => wallTower("line_projector", placement)),
        ...walls.slice(6, 12).map((placement) => wallTower("repeater", placement)),
        ...processCommands,
      ]),
      round([
        ...LIQUID_CHARGES,
        upgrade(towerId(levelId, 5), "projector_focus"),
        ...walls.slice(12, 15).map((placement) => wallTower("repeater", placement)),
      ]),
      round([upgrade(towerId(levelId, 8), "repeater_feed")]),
      round([upgrade(towerId(levelId, 5), "projector_fan")]),
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
