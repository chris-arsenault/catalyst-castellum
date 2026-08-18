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
      place("bolt_caster", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("bolt_caster", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("bolt_caster", { column: 28, elevation: 22 }, "ceiling", "down"),
      place("bolt_caster", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("bolt_caster", { column: 41, elevation: 12 }, "ceiling", "down"),
      upgrade(towerId(3), "bolt_calibration"),
      upgrade(towerId(5), "bolt_calibration"),
    ]),
    round([
      place("bolt_caster", { column: 48, elevation: 8 }, "right_wall", "left"),
      target(towerId(6), "strongest"),
    ]),
    round([upgrade(towerId(1), "bolt_calibration"), upgrade(towerId(2), "bolt_calibration")]),
    round([upgrade(towerId(3), "bolt_piercing"), upgrade(towerId(5), "bolt_piercing")]),
    round(),
  ],
};

const rapidInterlock: ReferenceBuildDefinition = {
  id: "rapid_interlock",
  archetype: "rapid",
  rounds: [
    round([
      place("repeater", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("repeater", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("repeater", { column: 28, elevation: 22 }, "ceiling", "down"),
      place("repeater", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("repeater", { column: 41, elevation: 12 }, "ceiling", "down"),
      place("flak_nest", { column: 25, elevation: 11 }, "ceiling", "down"),
      upgrade(towerId(5), "repeater_feed"),
    ]),
    round([
      place("repeater", { column: 48, elevation: 8 }, "right_wall", "left"),
      upgrade(towerId(3), "repeater_feed"),
    ]),
    round([upgrade(towerId(1), "repeater_feed"), upgrade(towerId(2), "repeater_feed")]),
    round([upgrade(towerId(5), "repeater_tracking"), upgrade(towerId(6), "flak_burst")]),
    round(),
  ],
};

const areaBarrage: ReferenceBuildDefinition = {
  id: "area_barrage",
  archetype: "area",
  rounds: [
    round([
      place("line_projector", { column: 10, elevation: 11 }, "ceiling", "down"),
      place("line_projector", { column: 22, elevation: 14 }, "left_wall", "right"),
      place("line_projector", { column: 42, elevation: 22 }, "ceiling", "down"),
      place("line_projector", { column: 42, elevation: 12 }, "ceiling", "down"),
      place("mortar", { column: 15, elevation: 4 }, "floor", "left"),
      place("bolt_caster", { column: 28, elevation: 22 }, "ceiling", "down"),
    ]),
    round([
      place("line_projector", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("line_projector", { column: 48, elevation: 8 }, "right_wall", "left"),
    ]),
    round([upgrade(towerId(5), "mortar_payload"), upgrade(towerId(6), "bolt_calibration")]),
    round([upgrade(towerId(1), "projector_focus"), upgrade(towerId(4), "projector_focus")]),
    round([
      place("line_projector", { column: 46, elevation: 12 }, "ceiling", "down"),
      upgrade(towerId(8), "projector_focus"),
      upgrade(towerId(9), "projector_focus"),
    ]),
  ],
};

const controlledKillbox: ReferenceBuildDefinition = {
  id: "controlled_killbox",
  archetype: "control",
  rounds: [
    round([
      place("snare_emitter", { column: 10, elevation: 11 }, "ceiling", "down"),
      place("snare_emitter", { column: 28, elevation: 22 }, "ceiling", "down"),
      place("snare_emitter", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("snare_emitter", { column: 41, elevation: 12 }, "ceiling", "down"),
      place("repeater", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("repeater", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("repeater", { column: 30, elevation: 22 }, "ceiling", "down"),
      place("repeater", { column: 48, elevation: 8 }, "right_wall", "left"),
      place("flak_nest", { column: 25, elevation: 11 }, "ceiling", "down"),
    ]),
    round([upgrade(towerId(2), "snare_duration"), upgrade(towerId(4), "snare_duration")]),
    round([upgrade(towerId(5), "repeater_feed"), upgrade(towerId(8), "repeater_feed")]),
    round([upgrade(towerId(3), "snare_duration"), upgrade(towerId(9), "flak_burst")]),
    round(),
  ],
};

const supportedBattery: ReferenceBuildDefinition = {
  id: "supported_battery",
  archetype: "support",
  rounds: [
    round([
      place("relay", { column: 41, elevation: 12 }, "ceiling", "down"),
      place("bolt_caster", { column: 6, elevation: 8 }, "left_wall", "right"),
      place("repeater", { column: 6, elevation: 20 }, "left_wall", "right"),
      place("mortar", { column: 15, elevation: 4 }, "floor", "left"),
      place("bolt_caster", { column: 28, elevation: 22 }, "ceiling", "down"),
      place("repeater", { column: 41, elevation: 22 }, "ceiling", "down"),
      place("flak_nest", { column: 25, elevation: 11 }, "ceiling", "down"),
    ]),
    round([
      place("line_projector", { column: 48, elevation: 8 }, "right_wall", "left"),
      target(towerId(1), "support"),
    ]),
    round([upgrade(towerId(4), "mortar_payload"), upgrade(towerId(5), "bolt_calibration")]),
    round([upgrade(towerId(6), "repeater_feed"), upgrade(towerId(7), "flak_burst")]),
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
