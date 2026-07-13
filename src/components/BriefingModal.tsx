import { ArrowRight, Biohazard, Droplets, Gauge } from "lucide-react";
import { useState } from "react";
import { LEVEL_DEFINITIONS, ROOM_DEFINITIONS } from "../game/config";
import { levelDefinitionFor, roundDefinitionFor } from "../game/simulation";
import { useGameStore } from "../game/store";
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
  const detail = tutorialSkipped
    ? `${nextLevel.name} begins immediately in frozen planning at ${nextRoom.code}.`
    : `${round.objective} You have ${round.primeSeconds} seconds of live priming before the configuration locks automatically.`;
  return (
    <div className="briefing-objective">
      <div>
        <Gauge size={19} />
        <span>{tutorialSkipped ? "Tutorial skipped" : "Round 1 objective"}</span>
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
      <strong>Enable guided tutorial</strong>
      <small id="tutorial-choice-detail">
        Off skips Flash Point and starts Lesson 02 · Make the Reagent.
      </small>
    </label>
  </div>
);

const actionLabel = (guided: boolean, tutorialEnabled: boolean): string => {
  if (!guided) return "Begin checkpoint";
  return tutorialEnabled ? "Begin guided tutorial" : "Skip to lesson 2";
};

const hint = (game: GameState, guided: boolean, tutorialEnabled: boolean): string => {
  const level = levelDefinitionFor(game);
  if (!guided) return `Start at ${ROOM_DEFINITIONS[level.focusRoomId].code}. ${level.lesson}`;
  if (!tutorialEnabled)
    return "Flash Point will be recorded as complete; you can replay it after restarting the campaign.";
  return `The coach will point to one live control at a time in ${ROOM_DEFINITIONS[level.focusRoomId].code}.`;
};

const BriefingContent = ({ game }: { game: GameState }) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const restartTutorialGuide = useGameStore((state) => state.restartTutorialGuide);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const level = levelDefinitionFor(game);
  const guided = Boolean(guideDefinitionFor(game));
  const tutorialSkipped = guided && !tutorialEnabled;
  const begin = () => {
    if (tutorialSkipped) {
      dispatch({ type: "skip_tutorial" });
      return;
    }
    if (guided) restartTutorialGuide();
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
            <span>Catalyst</span> Castellum
          </h1>
          <p className="briefing-lede">
            <strong>{level.name}.</strong> {level.briefing}
          </p>
          <BriefingObjective game={game} tutorialSkipped={tutorialSkipped} />
          {guided && (
            <TutorialStartChoice enabled={tutorialEnabled} onChange={setTutorialEnabled} />
          )}
          <button
            className="enter-button"
            type="button"
            data-testid="enter-control-room"
            onClick={begin}
          >
            {actionLabel(guided, tutorialEnabled)} <ArrowRight size={18} />
          </button>
          <small className="briefing-hint">{hint(game, guided, tutorialEnabled)}</small>
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
