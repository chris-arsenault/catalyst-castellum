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
      { type: "set_conduit", connectionId: "gas:core__furnace", enabled: true },
      { type: "build_connection", kind: "gas_line", fromRoomId: "core", toRoomId: "gallery" },
      { type: "set_conduit", connectionId: "gas:core__gallery", enabled: true },
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
      { type: "set_conduit", connectionId: "liquid:core__lower_intake", enabled: true },
      { type: "set_conduit", connectionId: "gas:lower_intake__reservoir", enabled: true },
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
      { type: "set_conduit", connectionId: "gas:furnace__lower_intake", enabled: true },
      { type: "set_conduit", connectionId: "gas:furnace__gallery", enabled: true },
      { type: "set_conduit", connectionId: "gas:gallery__washlock", enabled: true },
    ],
  },
  stored_chlorine: {
    levelId: "stored_chlorine",
    commands: [
      { type: "set_conduit", connectionId: "gas:lower_intake__reservoir", enabled: true },
      { type: "set_conduit", connectionId: "liquid:core__lower_intake", enabled: true },
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
      { type: "set_conduit", connectionId: "liquid:reservoir__washlock", enabled: true },
    ],
  },
  commissioning_exam: {
    levelId: "commissioning_exam",
    commands: [
      { type: "set_conduit", connectionId: "liquid:core__lower_intake", enabled: true },
      { type: "set_conduit", connectionId: "gas:furnace__lower_intake", enabled: true },
      { type: "set_conduit", connectionId: "gas:lower_intake__reservoir", enabled: true },
      { type: "set_conduit", connectionId: "liquid:lower_intake__reservoir", enabled: true },
      { type: "charge_liquid_source", sourceId: "water_tank" },
      { type: "charge_liquid_source", sourceId: "sodium_chloride_tank" },
    ],
  },
};

export const playtestPlanFor = (levelId: LevelId): LevelPlaytestPlan =>
  LEVEL_PLAYTEST_PLANS[levelId];
