import type { GameState } from "../game/types";
import {
  coreFurnaceFeedEnabled,
  furnaceAgitatorRunning,
  furnaceAgitatorUpgraded,
  primeFlashIncident,
  secondChamberRunning,
  secondFeedEnabled,
} from "./flashPointGuideState";
import { firstSparkGuide, storedMomentumGuide } from "./flashPointOpeningGuides";
import {
  corridorExamGuide,
  higherCadenceGuide,
  secondChamberGuide,
} from "./flashPointReinforcementGuides";
import type { GuideDefinition, TutorialCopyKey } from "./guideModel";

export {
  assaultFlashIncident,
  furnaceAgitatorRunning,
  primeFlashIncident,
} from "./flashPointGuideState";

/** One guide per authored round: full guidance, retained state, then three reinforcement drills. */
const ROUND_GUIDES: readonly GuideDefinition[] = [
  firstSparkGuide,
  storedMomentumGuide,
  secondChamberGuide,
  higherCadenceGuide,
  corridorExamGuide,
];

export const flashPointGuideFor = (game: GameState): GuideDefinition | null =>
  ROUND_GUIDES[game.campaign.roundIndex] ?? null;

const firstSparkReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (action === "start_prime") {
    if (!furnaceAgitatorRunning(game)) return "tutorial.flash.reason.agitator";
    if (!coreFurnaceFeedEnabled(game)) return "tutorial.flash.reason.feed";
    return null;
  }
  return primeFlashIncident(game) ? null : "tutorial.flash.reason.flash";
};

const secondChamberReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (action !== "start_prime") return null;
  if (!secondFeedEnabled(game)) return "tutorial.flash.reason.secondFeed";
  if (!secondChamberRunning(game)) return "tutorial.flash.reason.secondChamber";
  return null;
};

const higherCadenceReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (action !== "start_prime") return null;
  return furnaceAgitatorUpgraded(game) ? null : "tutorial.flash.reason.upgrade";
};

export const flashPointPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  switch (game.campaign.roundIndex) {
    case 0:
      return firstSparkReason(game, action);
    case 2:
      return secondChamberReason(game, action);
    case 3:
      return higherCadenceReason(game, action);
    default:
      return null;
  }
};
