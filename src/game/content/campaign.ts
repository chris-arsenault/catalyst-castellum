import type { LevelDefinition, RoundDefinition } from "../definitionTypes";
import { LEVEL_IDS, type LevelId } from "../types";
import { MORROW_POCKET_LEVEL } from "./levels/morrowPocket";
import { FLASH_POINT_LEVEL } from "./levels/flashPoint";
import { MAKE_THE_REAGENT_LEVEL } from "./levels/makeTheReagent";
import { STORED_CHLORINE_LEVEL } from "./levels/storedChlorine";
import { KETTLEBLACK_LEVEL } from "./levels/kettleblack";
import { CORDON_41_LEVEL } from "./levels/cordon41";
import { JUNCTION_L6_LEVEL } from "./levels/junctionL6";
import { PELL_CUT_LEVEL } from "./levels/pellCut";
import { STATION_14_LEVEL } from "./levels/station14";
import { VASKER_STORE_LEVEL } from "./levels/vaskerStore";
import { LANE_SIX_LEVEL } from "./levels/laneSix";
import { PELL_CORDON_LEVEL } from "./levels/pellCordon";

export type {
  FacilityLoadout,
  GasConduitLoadout,
  LevelDefinition,
  LiquidConduitLoadout,
  RoundDefinition,
  ScenarioRoomEquipment,
} from "../definitionTypes";

/** Explicit order keeps campaign progression independent from module discovery or file names. */
export const LEVEL_DEFINITIONS: Record<LevelId, LevelDefinition> = {
  flash_point: FLASH_POINT_LEVEL,
  make_the_reagent: MAKE_THE_REAGENT_LEVEL,
  stored_chlorine: STORED_CHLORINE_LEVEL,
  morrow_pocket: MORROW_POCKET_LEVEL,
  kettleblack: KETTLEBLACK_LEVEL,
  cordon_41: CORDON_41_LEVEL,
  junction_l6: JUNCTION_L6_LEVEL,
  pell_cut: PELL_CUT_LEVEL,
  station_14: STATION_14_LEVEL,
  vasker_store: VASKER_STORE_LEVEL,
  lane_six: LANE_SIX_LEVEL,
  pell_cordon: PELL_CORDON_LEVEL,
};

export const CAMPAIGN_LEVELS: LevelDefinition[] = LEVEL_IDS.map((id) => LEVEL_DEFINITIONS[id]);

export const currentLevel = (levelId: LevelId): LevelDefinition => LEVEL_DEFINITIONS[levelId];

export const currentRound = (levelId: LevelId, roundIndex: number): RoundDefinition => {
  const level = currentLevel(levelId);
  return level.rounds[Math.min(roundIndex, level.rounds.length - 1)] as RoundDefinition;
};

export const nextLevelId = (levelId: LevelId): LevelId | null => {
  const index = LEVEL_IDS.indexOf(levelId);
  return LEVEL_IDS[index + 1] ?? null;
};
