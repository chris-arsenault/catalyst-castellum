import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import {
  buildLine as line,
  GAS_CHARGE,
  install,
  LIQUID_CHARGES,
  portfolioRound as round,
  upgrade,
} from "./buildCommands";

const flashBattery: ReferenceBuildDefinition = {
  id: "distributed_flash_battery",
  archetype: "burst",
  rounds: [
    round([
      ...line("gas_line", "core", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      upgrade("furnace", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "core", "gallery"),
      install("gallery", "socket_a", "thermal_coil"),
      install("gallery", "socket_b", "gas_agitator"),
      upgrade("gallery", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "core", "switchyard"),
      install("switchyard", "socket_a", "thermal_coil"),
      install("switchyard", "socket_b", "gas_agitator"),
      upgrade("switchyard", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      upgrade("furnace", "socket_b"),
      upgrade("gallery", "socket_b"),
      upgrade("switchyard", "socket_b"),
    ]),
    round([GAS_CHARGE]),
  ],
};

const acidExposureLine: ReferenceBuildDefinition = {
  id: "acid_exposure_line",
  archetype: "continuous",
  rounds: [
    round([
      install("lower_intake", "socket_a", "membrane_cell"),
      ...line("liquid_line", "core", "lower_intake"),
      ...line("gas_line", "lower_intake", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      ...line("gas_line", "furnace", "gallery"),
      ...line("gas_line", "gallery", "washlock"),
    ]),
    round([
      ...LIQUID_CHARGES,
      upgrade("lower_intake", "socket_a"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_b"),
      install("gallery", "socket_a", "gas_agitator"),
    ]),
    round([
      ...LIQUID_CHARGES,
      upgrade("gallery", "socket_a"),
      install("washlock", "socket_a", "wet_contactor"),
    ]),
    round([
      ...LIQUID_CHARGES,
      upgrade("lower_intake", "socket_a"),
      upgrade("furnace", "socket_b"),
      upgrade("gallery", "socket_a"),
    ]),
    round(LIQUID_CHARGES),
  ],
};

const causticFloor: ReferenceBuildDefinition = {
  id: "caustic_drag_floor",
  archetype: "control",
  rounds: [
    round([
      install("lower_intake", "socket_a", "membrane_cell"),
      ...line("liquid_line", "core", "lower_intake"),
      ...line("gas_line", "lower_intake", "reservoir"),
      ...line("liquid_line", "lower_intake", "reservoir"),
      install("reservoir", "socket_a", "wet_contactor"),
    ]),
    round([
      ...LIQUID_CHARGES,
      ...line("liquid_line", "reservoir", "washlock"),
      install("washlock", "socket_a", "wet_contactor"),
      upgrade("lower_intake", "socket_a"),
      upgrade("reservoir", "socket_a"),
    ]),
    round([
      ...LIQUID_CHARGES,
      install("lower_intake", "socket_b", "wet_contactor"),
      upgrade("washlock", "socket_a"),
    ]),
    round([
      ...LIQUID_CHARGES,
      upgrade("lower_intake", "socket_a"),
      upgrade("reservoir", "socket_a"),
      upgrade("washlock", "socket_a"),
    ]),
    round(LIQUID_CHARGES),
  ],
};

const storedRelease: ReferenceBuildDefinition = {
  id: "stored_hypochlorite_release",
  archetype: "storage",
  rounds: [
    round([
      install("lower_intake", "socket_a", "membrane_cell"),
      ...line("liquid_line", "core", "lower_intake"),
      ...line("gas_line", "lower_intake", "reservoir"),
      ...line("liquid_line", "lower_intake", "reservoir"),
      install("reservoir", "socket_a", "wet_contactor"),
    ]),
    round([
      ...LIQUID_CHARGES,
      ...line("gas_line", "lower_intake", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      ...line("gas_line", "furnace", "gallery"),
      ...line("gas_line", "gallery", "washlock"),
      ...line("liquid_line", "reservoir", "washlock"),
      install("washlock", "socket_a", "wet_contactor"),
    ]),
    round([
      ...LIQUID_CHARGES,
      upgrade("lower_intake", "socket_a"),
      upgrade("furnace", "socket_b"),
      upgrade("reservoir", "socket_a"),
      upgrade("washlock", "socket_a"),
    ]),
    round([
      ...LIQUID_CHARGES,
      upgrade("lower_intake", "socket_a"),
      upgrade("reservoir", "socket_a"),
      upgrade("washlock", "socket_a"),
    ]),
    round(LIQUID_CHARGES),
  ],
};

const hybridDefense: ReferenceBuildDefinition = {
  id: "flash_corrosion_hybrid",
  archetype: "hybrid",
  rounds: [
    round([
      ...line("gas_line", "core", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      install("lower_intake", "socket_a", "membrane_cell"),
      ...line("liquid_line", "core", "lower_intake"),
      ...line("gas_line", "lower_intake", "reservoir"),
      ...line("liquid_line", "lower_intake", "reservoir"),
      install("reservoir", "socket_a", "wet_contactor"),
    ]),
    round([
      GAS_CHARGE,
      ...LIQUID_CHARGES,
      ...line("liquid_line", "reservoir", "washlock"),
      install("washlock", "socket_a", "wet_contactor"),
      upgrade("furnace", "socket_b"),
      upgrade("lower_intake", "socket_a"),
      upgrade("reservoir", "socket_a"),
    ]),
    round([
      GAS_CHARGE,
      ...LIQUID_CHARGES,
      ...line("gas_line", "core", "gallery"),
      install("gallery", "socket_a", "thermal_coil"),
      install("gallery", "socket_b", "gas_agitator"),
      upgrade("washlock", "socket_a"),
    ]),
    round([
      GAS_CHARGE,
      ...LIQUID_CHARGES,
      upgrade("furnace", "socket_b"),
      upgrade("gallery", "socket_b"),
      upgrade("lower_intake", "socket_a"),
      upgrade("reservoir", "socket_a"),
    ]),
    round([GAS_CHARGE, ...LIQUID_CHARGES]),
  ],
};

export const MORROW_POCKET_REFERENCE_BUILDS: readonly ReferenceBuildDefinition[] = [
  flashBattery,
  acidExposureLine,
  causticFloor,
  storedRelease,
  hybridDefense,
];
