import { ArrowLeft, ArrowRight, Biohazard, Droplets, Gauge } from "lucide-react";
import { useState } from "react";
import { LEVEL_DEFINITIONS } from "../presentation/defaultGame";
import { levelDefinitionFor, roundDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { GameState } from "../game/types";
import { guideDefinitionFor } from "../tutorial/guideModel";
import type { Translator } from "../localization/translator";
import { roomDefinition } from "../presentation/defaultGame";

const BriefingGraphic = () => {
  const { translator } = useGamePresentation();
  return (
    <div className="briefing-graphic" aria-hidden="true">
      <div className="graphic-grid" />
      <div className="graphic-pipe pipe-one" />
      <div className="graphic-pipe pipe-two" />
      <div className="graphic-chamber chamber-one">
        <Biohazard />
      </div>
      <div className="graphic-chamber chamber-two">
        <Droplets />
      </div>
      <div className="graphic-core">
        <span />
        <span />
        <span />
      </div>
      <div className="graphic-enemy enemy-one" />
      <div className="graphic-enemy enemy-two" />
      <div className="graphic-label">{translator.text("ui.briefing.graphic")}</div>
    </div>
  );
};

const BriefingObjective = ({
  game,
  tutorialSkipped,
}: {
  game: GameState;
  tutorialSkipped: boolean;
}) => {
  const { formatters, levelCopy: localizedLevelCopy, translator } = useGamePresentation();
  const round = roundDefinitionFor(game);
  const level = levelDefinitionFor(game);
  const nextLevel = LEVEL_DEFINITIONS.make_the_reagent;
  const nextRoom = roomDefinition(game, nextLevel.focusRoomId);
  let detail = translator.text("ui.briefing.objective", {
    objective: localizedLevelCopy.round(level, round).objective,
    duration: formatters.duration(round.primeSeconds),
  });
  let label = translator.text("ui.briefing.roundObjective");
  if (tutorialSkipped) {
    detail = translator.text("ui.briefing.skipDetail", {
      level: localizedLevelCopy.level(nextLevel).name,
      room: nextRoom.code,
    });
    label = translator.text("ui.briefing.startingLesson");
  }
  return (
    <div className="briefing-objective">
      <div>
        <Gauge size={19} />
        <span>{label}</span>
      </div>
      <p>{detail}</p>
    </div>
  );
};

const TutorialStartChoice = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className="tutorial-start-choice">
      <input
        id="tutorial-enabled"
        type="checkbox"
        checked={enabled}
        data-testid="tutorial-enabled"
        aria-describedby="tutorial-choice-detail"
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <label htmlFor="tutorial-enabled">
        <strong>{translator.text("ui.briefing.tutorial.title")}</strong>
        <small id="tutorial-choice-detail">{translator.text("ui.briefing.tutorial.detail")}</small>
      </label>
    </div>
  );
};

const actionLabel = (
  offersOpeningDrill: boolean,
  tutorialEnabled: boolean,
  translator: Translator
): string => {
  if (!offersOpeningDrill) return translator.text("ui.briefing.beginCheckpoint");
  return translator.text(tutorialEnabled ? "ui.briefing.beginDrill" : "ui.briefing.beginLesson");
};

const hint = (
  game: GameState,
  offersOpeningDrill: boolean,
  tutorialEnabled: boolean,
  translator: Translator,
  lesson: string
): string => {
  const level = levelDefinitionFor(game);
  if (!offersOpeningDrill)
    return translator.text("ui.briefing.hint.checkpoint", {
      room: roomDefinition(game, level.focusRoomId).code,
      lesson,
    });
  if (!tutorialEnabled) return translator.text("ui.briefing.hint.lesson");
  return translator.text("ui.briefing.hint.drill", {
    room: roomDefinition(game, level.focusRoomId).code,
  });
};

const BriefingContent = ({ game }: { game: GameState }) => {
  const { levelCopy: localizedLevelCopy, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const dismissTutorialGuide = useGameStore((state) => state.dismissTutorialGuide);
  const restartTutorialGuide = useGameStore((state) => state.restartTutorialGuide);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const level = levelDefinitionFor(game);
  const copy = localizedLevelCopy.level(level);
  const guide = guideDefinitionFor(game);
  const offersOpeningDrill = game.campaign.levelId === "flash_point" && Boolean(guide);
  const tutorialSkipped = offersOpeningDrill && !tutorialEnabled;
  const begin = () => {
    if (tutorialSkipped) {
      dismissTutorialGuide();
      dispatch({ type: "skip_tutorial" });
      return;
    }
    if (offersOpeningDrill) restartTutorialGuide();
    dispatch({ type: "begin_level" });
  };

  return (
    <div
      className="modal-backdrop briefing-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
    >
      <div className="briefing-modal">
        <BriefingGraphic />
        <div className="briefing-content">
          <div className="eyebrow">
            <span /> {copy.kicker}
          </div>
          <h1 id="briefing-title">
            <span>
              {translator.text("ui.briefing.checkpoint", {
                number: String(level.number).padStart(2, "0"),
              })}
            </span>{" "}
            {copy.name}
          </h1>
          <p className="briefing-lede">{copy.briefing}</p>
          <BriefingObjective game={game} tutorialSkipped={tutorialSkipped} />
          {offersOpeningDrill && (
            <TutorialStartChoice enabled={tutorialEnabled} onChange={setTutorialEnabled} />
          )}
          <div className="briefing-actions">
            <button
              className="menu-return-button"
              type="button"
              data-testid="briefing-main-menu"
              onClick={returnToMainMenu}
            >
              <ArrowLeft size={16} /> {translator.text("ui.topbar.saveSlots")}
            </button>
            <button
              className="enter-button"
              type="button"
              data-testid="enter-control-room"
              onClick={begin}
            >
              {actionLabel(offersOpeningDrill, tutorialEnabled, translator)}{" "}
              <ArrowRight size={18} />
            </button>
          </div>
          <small className="briefing-hint">
            {hint(game, offersOpeningDrill, tutorialEnabled, translator, copy.lesson)}
          </small>
        </div>
      </div>
    </div>
  );
};

export const BriefingModal = () => {
  const game = useGameStore((state) => state.game);
  if (game.phase !== "level_briefing") return null;
  return <BriefingContent key={game.campaign.levelId} game={game} />;
};
