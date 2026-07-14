import { ArrowLeft, ArrowRight, Biohazard, Droplets, Gauge } from "lucide-react";
import { useState } from "react";
import { LEVEL_DEFINITIONS, ROOM_DEFINITIONS } from "../game/config";
import { levelDefinitionFor, roundDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import type { GameState } from "../game/types";
import { guideDefinitionFor } from "../tutorial/guideModel";

const BriefingGraphic = () => (
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
    <div className="graphic-label">FLOW DEFENSE ARRAY // CASTELLUM-01</div>
  </div>
);

const BriefingObjective = ({
  game,
  tutorialSkipped,
}: {
  game: GameState;
  tutorialSkipped: boolean;
}) => {
  const round = roundDefinitionFor(game);
  const nextLevel = LEVEL_DEFINITIONS.make_the_reagent;
  const nextRoom = ROOM_DEFINITIONS[nextLevel.focusRoomId];
  let detail = `${round.objective} You have ${round.primeSeconds} seconds of live priming before the configuration locks automatically.`;
  let label = "Round 1 objective";
  if (tutorialSkipped) {
    detail = `${nextLevel.name} begins immediately in frozen planning at ${nextRoom.code}.`;
    label = "Starting at Lesson 02";
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
}) => (
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
      <strong>Play Flash Point field drill</strong>
      <small id="tutorial-choice-detail">
        Clear the checkbox to begin with Lesson 02 · Make the Reagent.
      </small>
    </label>
  </div>
);

const actionLabel = (offersOpeningDrill: boolean, tutorialEnabled: boolean): string => {
  if (!offersOpeningDrill) return "Begin checkpoint";
  return tutorialEnabled ? "Begin field drill" : "Begin lesson 2";
};

const hint = (game: GameState, offersOpeningDrill: boolean, tutorialEnabled: boolean): string => {
  const level = levelDefinitionFor(game);
  if (!offersOpeningDrill)
    return `Start at ${ROOM_DEFINITIONS[level.focusRoomId].code}. ${level.lesson}`;
  if (!tutorialEnabled)
    return "Lesson 02 opens in frozen planning at R-05. Restart the campaign to replay Flash Point.";
  return `Enter the checkpoint to receive the field assignment at ${ROOM_DEFINITIONS[level.focusRoomId].code}.`;
};

const BriefingContent = ({ game }: { game: GameState }) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const dismissTutorialGuide = useGameStore((state) => state.dismissTutorialGuide);
  const restartTutorialGuide = useGameStore((state) => state.restartTutorialGuide);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const level = levelDefinitionFor(game);
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
            <span /> {level.kicker}
          </div>
          <h1 id="briefing-title">
            <span>Checkpoint {String(level.number).padStart(2, "0")}</span> {level.name}
          </h1>
          <p className="briefing-lede">{level.briefing}</p>
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
              <ArrowLeft size={16} /> Save slots
            </button>
            <button
              className="enter-button"
              type="button"
              data-testid="enter-control-room"
              onClick={begin}
            >
              {actionLabel(offersOpeningDrill, tutorialEnabled)} <ArrowRight size={18} />
            </button>
          </div>
          <small className="briefing-hint">{hint(game, offersOpeningDrill, tutorialEnabled)}</small>
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
