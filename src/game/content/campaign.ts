import type { LevelDefinition, RoundDefinition } from "../definitionTypes";
import { LEVEL_IDS, type LevelId } from "../types";
import { COMMISSIONING_EXAM_LEVEL } from "./levels/commissioningExam";
import { FLASH_POINT_LEVEL } from "./levels/flashPoint";
import { MAKE_THE_REAGENT_LEVEL } from "./levels/makeTheReagent";
import { STORED_CHLORINE_LEVEL } from "./levels/storedChlorine";

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
  commissioning_exam: COMMISSIONING_EXAM_LEVEL,
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
