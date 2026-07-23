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

const round = (commands: readonly GameCommand[] = [], primeFraction = 1): PlaytestRoundPlan => ({
  commands,
  primeFraction,
});

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

const FLASH_CORRIDOR_COMMANDS: readonly GameCommand[] = [
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
];

const ACID_LINE_COMMANDS: readonly GameCommand[] = [
  {
    type: "install_equipment",
    roomId: "lower_intake",
    socketId: "socket_a",
    equipmentId: "membrane_cell",
  },
  { type: "set_conduit", connectionId: "liquid:core__lower_intake", enabled: true },
  { type: "set_conduit", connectionId: "gas:lower_intake__reservoir", enabled: true },
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
  { type: "build_connection", kind: "gas_line", fromRoomId: "furnace", toRoomId: "lower_intake" },
  { type: "set_conduit", connectionId: "gas:furnace__lower_intake", enabled: true },
  { type: "build_connection", kind: "gas_line", fromRoomId: "furnace", toRoomId: "gallery" },
  { type: "set_conduit", connectionId: "gas:furnace__gallery", enabled: true },
  { type: "build_connection", kind: "gas_line", fromRoomId: "gallery", toRoomId: "washlock" },
  { type: "set_conduit", connectionId: "gas:gallery__washlock", enabled: true },
];

const STORED_RELEASE_COMMANDS: readonly GameCommand[] = [
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
];

export const LEVEL_PLAYTEST_PORTFOLIOS: Record<LevelId, LevelPlaytestPortfolio> = {
  flash_point: {
    levelId: "flash_point",
    requirements: guidedRequirements,
    referenceBuilds: [
      {
        id: "flash_corridor",
        archetype: "burst",
        rounds: [
          round(FLASH_CORRIDOR_COMMANDS.slice(0, 2)),
          round([
            FLASH_CORRIDOR_COMMANDS[4]!,
            FLASH_CORRIDOR_COMMANDS[5]!,
            FLASH_CORRIDOR_COMMANDS[6]!,
          ]),
          round([FLASH_CORRIDOR_COMMANDS[2]!, FLASH_CORRIDOR_COMMANDS[3]!]),
        ],
      },
    ],
  },
  make_the_reagent: {
    levelId: "make_the_reagent",
    requirements: guidedRequirements,
    referenceBuilds: [
      {
        id: "acid_line",
        archetype: "continuous",
        rounds: [
          round(ACID_LINE_COMMANDS.slice(0, 3)),
          round(),
          round(ACID_LINE_COMMANDS.slice(3)),
        ],
      },
    ],
  },
  stored_chlorine: {
    levelId: "stored_chlorine",
    requirements: guidedRequirements,
    referenceBuilds: [
      {
        id: "stored_release",
        archetype: "storage",
        rounds: [round(STORED_RELEASE_COMMANDS)],
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
};

/** Authored partial builds that must lose once a later lesson or defense stage begins. */
export const LEVEL_FAILURE_CONTROL_BUILDS: Record<LevelId, readonly ReferenceBuildDefinition[]> = {
  flash_point: [
    {
      id: "single_flash_chamber",
      archetype: "burst",
      rounds: [round(FLASH_CORRIDOR_COMMANDS.slice(0, 2))],
    },
  ],
  make_the_reagent: [
    {
      id: "membrane_only",
      archetype: "continuous",
      rounds: [round(ACID_LINE_COMMANDS.slice(0, 3))],
    },
  ],
  stored_chlorine: [],
  morrow_pocket: [],
  kettleblack: [],
  cordon_41: [],
  junction_l6: [],
  pell_cut: [],
  station_14: [],
  vasker_store: [],
  lane_six: [],
  pell_cordon: [],
};

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
