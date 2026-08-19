import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import {
  placeTower as place,
  portfolioRound as round,
  targetTower as target,
  upgradeTower as upgrade,
} from "./buildCommands";

const towerId = (sequence: number): string => `tower:morrow_pocket:${sequence}`;

const preciseCrossfire: ReferenceBuildDefinition = {
  id: "precise_crossfire",
  archetype: "precise",
  rounds: [
    round([
      place("flash_chamber", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("flash_chamber", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("flash_chamber", { column: 26, elevation: 22 }, "ceiling", "down"),
      place("flash_chamber", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("flash_chamber", { column: 40, elevation: 12 }, "ceiling", "down"),
      upgrade(towerId(3), "flash_calibration"),
      upgrade(towerId(5), "flash_calibration"),
    ]),
    round([
      place("flash_chamber", { column: 48, elevation: 8 }, "right_wall", "left"),
      target(towerId(6), "strongest"),
    ]),
    round([upgrade(towerId(1), "flash_calibration"), upgrade(towerId(2), "flash_calibration")]),
    round([upgrade(towerId(3), "flash_breach"), upgrade(towerId(5), "flash_breach")]),
    round(),
  ],
};

const rapidInterlock: ReferenceBuildDefinition = {
  id: "rapid_interlock",
  archetype: "rapid",
  rounds: [
    round([
      place("caustic_jet", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("caustic_jet", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("caustic_jet", { column: 26, elevation: 22 }, "ceiling", "down"),
      place("caustic_jet", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("caustic_jet", { column: 40, elevation: 12 }, "ceiling", "down"),
      place("wash_head", { column: 25, elevation: 11 }, "ceiling", "down"),
      upgrade(towerId(5), "caustic_manifold"),
    ]),
    round([
      place("caustic_jet", { column: 48, elevation: 8 }, "right_wall", "left"),
      upgrade(towerId(3), "caustic_manifold"),
    ]),
    round([upgrade(towerId(1), "caustic_manifold"), upgrade(towerId(2), "caustic_manifold")]),
    round([upgrade(towerId(5), "caustic_split"), upgrade(towerId(6), "wash_burst")]),
    round(),
  ],
};

const areaBarrage: ReferenceBuildDefinition = {
  id: "area_barrage",
  archetype: "area",
  rounds: [
    round([
      place("carbon_burner", { column: 10, elevation: 11 }, "ceiling", "down"),
      place("carbon_burner", { column: 22, elevation: 14 }, "left_wall", "right"),
      place("carbon_burner", { column: 42, elevation: 22 }, "ceiling", "down"),
      place("carbon_burner", { column: 40, elevation: 12 }, "ceiling", "down"),
      place("acid_pot", { column: 15, elevation: 4 }, "floor", "left"),
      place("flash_chamber", { column: 26, elevation: 22 }, "ceiling", "down"),
      place("caustic_jet", { column: 6, elevation: 8 }, "left_wall", "right"),
    ]),
    round([
      place("carbon_burner", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("carbon_burner", { column: 48, elevation: 8 }, "right_wall", "left"),
    ]),
    round([upgrade(towerId(5), "acid_charge"), upgrade(towerId(6), "flash_calibration")]),
    round([upgrade(towerId(1), "burner_focus"), upgrade(towerId(4), "burner_focus")]),
    round([
      place("carbon_burner", { column: 46, elevation: 12 }, "ceiling", "down"),
      upgrade(towerId(9), "burner_focus"),
      upgrade(towerId(10), "burner_focus"),
    ]),
  ],
};

const controlledKillbox: ReferenceBuildDefinition = {
  id: "controlled_killbox",
  archetype: "control",
  rounds: [
    round([
      place("quench_coil", { column: 10, elevation: 11 }, "ceiling", "down"),
      place("quench_coil", { column: 26, elevation: 22 }, "ceiling", "down"),
      place("quench_coil", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("quench_coil", { column: 40, elevation: 12 }, "ceiling", "down"),
      place("caustic_jet", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("caustic_jet", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("caustic_jet", { column: 30, elevation: 22 }, "ceiling", "down"),
      place("caustic_jet", { column: 48, elevation: 8 }, "right_wall", "left"),
      place("wash_head", { column: 25, elevation: 11 }, "ceiling", "down"),
    ]),
    round([upgrade(towerId(2), "quench_duration"), upgrade(towerId(4), "quench_duration")]),
    round([upgrade(towerId(5), "caustic_manifold"), upgrade(towerId(8), "caustic_manifold")]),
    round([upgrade(towerId(3), "quench_duration"), upgrade(towerId(9), "wash_burst")]),
    round(),
  ],
};

const supportedBattery: ReferenceBuildDefinition = {
  id: "supported_battery",
  archetype: "support",
  rounds: [
    round([
      place("carbonyl_marker", { column: 40, elevation: 12 }, "ceiling", "down"),
      place("flash_chamber", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("caustic_jet", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("acid_pot", { column: 15, elevation: 4 }, "floor", "left"),
      place("flash_chamber", { column: 26, elevation: 22 }, "ceiling", "down"),
      place("caustic_jet", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("wash_head", { column: 25, elevation: 11 }, "ceiling", "down"),
    ]),
    round([
      place("carbon_burner", { column: 48, elevation: 8 }, "right_wall", "left"),
      target(towerId(1), "support"),
    ]),
    round([upgrade(towerId(4), "acid_charge"), upgrade(towerId(5), "flash_calibration")]),
    round([upgrade(towerId(6), "caustic_manifold"), upgrade(towerId(7), "wash_burst")]),
    round(),
  ],
};

export const MORROW_POCKET_REFERENCE_BUILDS: readonly ReferenceBuildDefinition[] = [
  preciseCrossfire,
  rapidInterlock,
  areaBarrage,
  controlledKillbox,
  supportedBattery,
];
