import type { GameCommand, LevelId } from "../types";

export interface LevelPlaytestPlan {
  levelId: LevelId;
  commands: readonly GameCommand[];
}

export const LEVEL_PLAYTEST_PLANS: Record<LevelId, LevelPlaytestPlan> = {
  flash_point: {
    levelId: "flash_point",
    commands: [
      {
        type: "install_equipment",
        roomId: "furnace",
        socketId: "socket_a",
        equipmentId: "gas_agitator",
      },
      { type: "set_conduit", runId: "core_furnace", phase: "gas", enabled: true },
      { type: "build_transport", runId: "core_gallery", phase: "gas" },
      { type: "set_conduit", runId: "core_gallery", phase: "gas", enabled: true },
      {
        type: "install_equipment",
        roomId: "gallery",
        socketId: "socket_a",
        equipmentId: "gas_agitator",
      },
      { type: "upgrade_equipment", roomId: "furnace", socketId: "socket_a" },
      { type: "upgrade_equipment", roomId: "gallery", socketId: "socket_a" },
    ],
  },
  make_the_reagent: {
    levelId: "make_the_reagent",
    commands: [
      {
        type: "install_equipment",
        roomId: "lower_intake",
        socketId: "socket_a",
        equipmentId: "membrane_cell",
      },
      { type: "set_conduit", runId: "core_cell", phase: "liquid", enabled: true },
      { type: "set_conduit", runId: "cell_absorber", phase: "gas", enabled: true },
    ],
  },
  acid_line: {
    levelId: "acid_line",
    commands: [
      {
        type: "install_equipment",
        roomId: "furnace",
        socketId: "socket_a",
        equipmentId: "thermal_coil",
      },
      {
        type: "install_equipment",
        roomId: "furnace",
        socketId: "socket_b",
        equipmentId: "gas_agitator",
      },
      { type: "set_conduit", runId: "cell_furnace", phase: "gas", enabled: true },
      { type: "set_conduit", runId: "furnace_return", phase: "gas", enabled: true },
      { type: "set_conduit", runId: "return_final", phase: "gas", enabled: true },
    ],
  },
  stored_chlorine: {
    levelId: "stored_chlorine",
    commands: [
      { type: "set_conduit", runId: "cell_absorber", phase: "gas", enabled: true },
      { type: "set_conduit", runId: "core_cell", phase: "liquid", enabled: true },
      {
        type: "install_equipment",
        roomId: "reservoir",
        socketId: "socket_a",
        equipmentId: "wet_contactor",
      },
      {
        type: "install_equipment",
        roomId: "washlock",
        socketId: "socket_a",
        equipmentId: "wet_contactor",
      },
      { type: "set_conduit", runId: "absorber_final", phase: "liquid", enabled: true },
    ],
  },
  commissioning_exam: {
    levelId: "commissioning_exam",
    commands: [
      { type: "set_conduit", runId: "core_cell", phase: "liquid", enabled: true },
      { type: "set_conduit", runId: "cell_furnace", phase: "gas", enabled: true },
      { type: "set_conduit", runId: "cell_absorber", phase: "gas", enabled: true },
      { type: "set_conduit", runId: "cell_absorber", phase: "liquid", enabled: true },
      { type: "charge_liquid_source", sourceId: "water_tank" },
      { type: "charge_liquid_source", sourceId: "sodium_chloride_tank" },
    ],
  },
};

export const playtestPlanFor = (levelId: LevelId): LevelPlaytestPlan =>
  LEVEL_PLAYTEST_PLANS[levelId];
