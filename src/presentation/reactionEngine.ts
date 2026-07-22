import type { GameRuntime, ReactionEngineDynamics, ReactionEngineSample } from "../game/runtime";
import type { GameState } from "../game/types";
import type { LocaleFormatters } from "../localization/formatters";
import type { Translator } from "../localization/translator";

export interface ReactionEngineStatusCopy {
  homeostasis: number;
  summary: string;
}

export interface ReactionEnginePresentation {
  sample: (game: GameState) => ReactionEngineSample;
  status: (
    previous: ReactionEngineSample,
    current: ReactionEngineSample
  ) => ReactionEngineStatusCopy | null;
}

const summaryKey = (
  dynamics: ReactionEngineDynamics
):
  | "ui.reactionEngine.summary.building"
  | "ui.reactionEngine.summary.draining"
  | "ui.reactionEngine.summary.mixed"
  | "ui.reactionEngine.summary.priming"
  | "ui.reactionEngine.summary.steady" => {
  if (dynamics.buildingRoomIds.length > 0 && dynamics.drainingRoomIds.length > 0)
    return "ui.reactionEngine.summary.mixed";
  if (dynamics.buildingRoomIds.length > 0) return "ui.reactionEngine.summary.building";
  if (dynamics.drainingRoomIds.length > 0) return "ui.reactionEngine.summary.draining";
  if (dynamics.primingLineCount > 0) return "ui.reactionEngine.summary.priming";
  return "ui.reactionEngine.summary.steady";
};

export const createReactionEnginePresentation = (
  runtime: GameRuntime,
  translator: Translator,
  formatters: LocaleFormatters
): ReactionEnginePresentation => ({
  sample: runtime.reactionEngine.sample,
  status: (previous, current) => {
    const dynamics = runtime.reactionEngine.dynamics(previous, current);
    if (!dynamics) return null;
    return {
      homeostasis: dynamics.homeostasis,
      summary: translator.text(summaryKey(dynamics), {
        change: translator.text(`ui.reactionEngine.change.${dynamics.change}`),
        homeostasis: formatters.percent(dynamics.homeostasis, 0),
        building: dynamics.buildingRoomIds.length,
        draining: dynamics.drainingRoomIds.length,
        priming: dynamics.primingLineCount,
        rate: formatters.number(dynamics.activeReactionRate, 2),
      }),
    };
  },
});
