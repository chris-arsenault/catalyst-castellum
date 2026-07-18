import { ArrowLeft, ArrowRight, Biohazard, Droplets, Gauge } from "lucide-react";
import { useCallback, useState } from "react";
import {
  LEVEL_DEFINITIONS,
  narrativeSiteForLevel,
  narrativeSiteOpensAct,
  roomDefinition,
  type NarrativeSiteDefinition,
} from "../presentation/defaultGame";
import { levelDefinitionFor, roundDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { GameState } from "../game/types";
import { guideDefinitionFor } from "../tutorial/guideModel";
import type { Translator } from "../localization/translator";
import { NarrativeDialogue } from "./NarrativeDialogue";

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

interface MechanicalBriefingCopy {
  readonly briefing: string;
  readonly kicker: string;
  readonly lesson: string;
  readonly name: string;
}

const ActIntroduction = ({
  actName,
  introduction,
  onContinue,
  onExit,
  summary,
}: {
  actName: string;
  introduction: readonly [string, string];
  onContinue: () => void;
  onExit: () => void;
  summary: string;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className="briefing-content act-introduction">
      <div className="eyebrow">
        <span /> {translator.text("narrative.ui.act.eyebrow")}
      </div>
      <h1 id="briefing-title">{actName}</h1>
      <strong className="act-summary">{summary}</strong>
      <div className="act-setting">
        {introduction.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="briefing-actions">
        <button className="menu-return-button" type="button" onClick={onExit}>
          <ArrowLeft size={16} /> {translator.text("ui.topbar.saveSlots")}
        </button>
        <button className="enter-button" type="button" onClick={onContinue}>
          {translator.text("narrative.ui.act.continue")} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

const ContractConversation = ({
  actName,
  onComplete,
  onExit,
  site,
}: {
  actName: string;
  onComplete: () => void;
  onExit: () => void;
  site: NarrativeSiteDefinition;
}) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const copy = narrativeCopy.site(site);
  return (
    <div className="briefing-content contract-conversation">
      <div className="eyebrow">
        <span /> {actName} · {copy.code}
      </div>
      <h1 id="briefing-title">{copy.name}</h1>
      <div className="contract-context">
        <span>{copy.contract}</span>
        <strong>{copy.region}</strong>
      </div>
      <p className="briefing-lede">{copy.briefing}</p>
      <NarrativeDialogue phase="briefing" site={site} onComplete={onComplete} />
      <button className="dialogue-menu-return" type="button" onClick={onExit}>
        <ArrowLeft size={15} /> {translator.text("ui.topbar.saveSlots")}
      </button>
    </div>
  );
};

const MissionBriefing = ({
  copy,
  game,
  levelNumber,
  offersOpeningDrill,
  onBegin,
  onExit,
  onTutorialChange,
  tutorialEnabled,
}: {
  copy: MechanicalBriefingCopy;
  game: GameState;
  levelNumber: number;
  offersOpeningDrill: boolean;
  onBegin: () => void;
  onExit: () => void;
  onTutorialChange: (enabled: boolean) => void;
  tutorialEnabled: boolean;
}) => {
  const { translator } = useGamePresentation();
  const tutorialSkipped = offersOpeningDrill && !tutorialEnabled;
  return (
    <div className="briefing-content mission-briefing">
      <div className="eyebrow">
        <span /> {copy.kicker}
      </div>
      <h1 id="briefing-title">
        <span>
          {translator.text("ui.briefing.checkpoint", {
            number: String(levelNumber).padStart(2, "0"),
          })}
        </span>{" "}
        {copy.name}
      </h1>
      <p className="briefing-lede">{copy.briefing}</p>
      <BriefingObjective game={game} tutorialSkipped={tutorialSkipped} />
      {offersOpeningDrill && (
        <TutorialStartChoice enabled={tutorialEnabled} onChange={onTutorialChange} />
      )}
      <div className="briefing-actions">
        <button
          className="menu-return-button"
          type="button"
          data-testid="briefing-main-menu"
          onClick={onExit}
        >
          <ArrowLeft size={16} /> {translator.text("ui.topbar.saveSlots")}
        </button>
        <button
          className="enter-button"
          type="button"
          data-testid="enter-control-room"
          onClick={onBegin}
        >
          {actionLabel(offersOpeningDrill, tutorialEnabled, translator)} <ArrowRight size={18} />
        </button>
      </div>
      <small className="briefing-hint">
        {hint(game, offersOpeningDrill, tutorialEnabled, translator, copy.lesson)}
      </small>
    </div>
  );
};

type BriefingStage = "act" | "dialogue" | "mission";

const BriefingContent = ({ game }: { game: GameState }) => {
  const { levelCopy, narrativeCopy } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const dismissTutorialGuide = useGameStore((state) => state.dismissTutorialGuide);
  const restartTutorialGuide = useGameStore((state) => state.restartTutorialGuide);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const level = levelDefinitionFor(game);
  const site = narrativeSiteForLevel(level.id);
  const actCopy = narrativeCopy.act({ id: site.actId });
  const offersOpeningDrill =
    game.campaign.levelId === "flash_point" && Boolean(guideDefinitionFor(game));
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [stage, setStage] = useState<BriefingStage>(
    narrativeSiteOpensAct(site) ? "act" : "dialogue"
  );
  const openDialogue = useCallback(() => setStage("dialogue"), []);
  const openMission = useCallback(() => setStage("mission"), []);
  const begin = useCallback(() => {
    if (offersOpeningDrill && !tutorialEnabled) {
      dismissTutorialGuide();
      dispatch({ type: "skip_tutorial" });
      return;
    }
    if (offersOpeningDrill) restartTutorialGuide();
    dispatch({ type: "begin_level" });
  }, [dismissTutorialGuide, dispatch, offersOpeningDrill, restartTutorialGuide, tutorialEnabled]);

  return (
    <div
      className="modal-backdrop briefing-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
    >
      <div className={`briefing-modal briefing-stage-${stage}`}>
        <BriefingGraphic />
        {stage === "act" && (
          <ActIntroduction
            actName={actCopy.name}
            introduction={actCopy.introduction}
            onContinue={openDialogue}
            onExit={returnToMainMenu}
            summary={actCopy.summary}
          />
        )}
        {stage === "dialogue" && (
          <ContractConversation
            actName={actCopy.name}
            onComplete={openMission}
            onExit={returnToMainMenu}
            site={site}
          />
        )}
        {stage === "mission" && (
          <MissionBriefing
            copy={levelCopy.level(level)}
            game={game}
            levelNumber={level.number}
            offersOpeningDrill={offersOpeningDrill}
            onBegin={begin}
            onExit={returnToMainMenu}
            onTutorialChange={setTutorialEnabled}
            tutorialEnabled={tutorialEnabled}
          />
        )}
      </div>
    </div>
  );
};

export const BriefingModal = () => {
  const game = useGameStore((state) => state.game);
  if (game.phase !== "level_briefing") return null;
  return <BriefingContent key={game.campaign.levelId} game={game} />;
};
