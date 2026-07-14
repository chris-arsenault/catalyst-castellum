import { ArrowRight, Biohazard, CheckCircle2, Gauge, LogOut, RotateCcw, X } from "lucide-react";
import { useCallback } from "react";
import { LEVEL_DEFINITIONS, nextLevelId } from "../game/config";
import { levelDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import { roundReportCopy } from "../presentation/roundReportCopy";

interface ProgressFrameProps {
  actionLabel: string;
  detail: string;
  eyebrow: string;
  nextDetail: string;
  nextLabel: string;
  onAdvance: () => void;
  testId: string;
  title: string;
}

const ProgressFrame = (props: ProgressFrameProps) => {
  const game = useGameStore((state) => state.game);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  return (
    <section
      className="progress-dock"
      aria-live="polite"
      aria-labelledby="progress-title"
      data-testid="campaign-progress-panel"
    >
      <header>
        <div className="progress-dock-seal">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <span>{props.eyebrow}</span>
          <h2 id="progress-title">{props.title}</h2>
        </div>
      </header>
      <p>{props.detail}</p>
      <dl className="progress-dock-stats">
        <div>
          <dt>Neutralized</dt>
          <dd>{game.lastReport?.killed ?? 0}</dd>
        </div>
        <div>
          <dt>Breaches</dt>
          <dd>{game.lastReport?.breached ?? 0}</dd>
        </div>
        <div>
          <dt>Core</dt>
          <dd>{Math.round(game.coreIntegrity)}%</dd>
        </div>
        <div>
          <dt>Reactions</dt>
          <dd>{game.lastReport?.reactions.toFixed(1) ?? "0.0"}</dd>
        </div>
      </dl>
      <div className="progress-dock-next">
        <span>
          <Gauge size={15} /> {props.nextLabel}
        </span>
        <p>{props.nextDetail}</p>
      </div>
      <footer>
        <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
          <LogOut size={15} /> Save slots
        </button>
        <button
          className="enter-button"
          type="button"
          data-testid={props.testId}
          onClick={props.onAdvance}
        >
          {props.actionLabel} <ArrowRight size={17} />
        </button>
      </footer>
    </section>
  );
};

const RoundProgressModal = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const level = levelDefinitionFor(game);
  const report = game.lastReport ? roundReportCopy(game.lastReport) : null;
  const nextRound = level.rounds[game.campaign.roundIndex + 1];
  const advance = useCallback(() => dispatch({ type: "continue_round" }), [dispatch]);
  return (
    <ProgressFrame
      actionLabel="Return to planning"
      detail={report?.detail ?? "The exact process state remains frozen."}
      eyebrow="Round analysis"
      nextDetail={nextRound?.objective ?? "Continue the checkpoint."}
      nextLabel="Next round"
      onAdvance={advance}
      testId="continue-round"
      title={report?.headline ?? "Round complete"}
    />
  );
};

const LevelProgressModal = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const level = levelDefinitionFor(game);
  const report = game.lastReport ? roundReportCopy(game.lastReport) : null;
  const nextId = nextLevelId(level.id);
  const nextLevel = nextId ? LEVEL_DEFINITIONS[nextId] : null;
  const advance = useCallback(() => dispatch({ type: "start_next_level" }), [dispatch]);
  return (
    <ProgressFrame
      actionLabel={`Continue to ${nextLevel?.name ?? "campaign"}`}
      detail={report?.detail ?? "Checkpoint process record secured."}
      eyebrow="Checkpoint secured"
      nextDetail={nextLevel?.briefing ?? "The curriculum is complete."}
      nextLabel="Next checkpoint"
      onAdvance={advance}
      testId="next-level"
      title={`${level.name} complete`}
    />
  );
};

export const CampaignProgressModal = () => {
  const phase = useGameStore((state) => state.game.phase);
  if (phase === "round_result") return <RoundProgressModal />;
  if (phase === "level_complete") return <LevelProgressModal />;
  return null;
};

export const OutcomeModal = () => {
  const game = useGameStore((state) => state.game);
  const reset = useGameStore((state) => state.reset);
  const dispatch = useGameStore((state) => state.dispatch);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  if (game.phase !== "victory" && game.phase !== "defeat") return null;
  const victory = game.phase === "victory";

  return (
    <div
      className="modal-backdrop outcome-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-title"
    >
      <div className={`outcome-modal ${victory ? "outcome-victory" : "outcome-defeat"}`}>
        <div className="outcome-seal">
          {victory ? <CheckCircle2 size={42} /> : <Biohazard size={42} />}
        </div>
        <div className="eyebrow">
          <span /> Base record finalized
        </div>
        <h2 id="outcome-title">{victory ? "Castellum holds" : "Catalyst core lost"}</h2>
        <p>
          {victory
            ? `All five checkpoints and the commissioning exam are complete. The final core retained ${Math.round(game.coreIntegrity)}% integrity.`
            : `The core fell during ${levelDefinitionFor(game).name}, round ${game.campaign.roundIndex + 1}. The trace preserves the immediate cause and supports the next attempt.`}
        </p>
        <div className="outcome-stats">
          <div>
            <span>Levels cleared</span>
            <strong>{game.campaign.completedLevelIds.length} / 5</strong>
          </div>
          <div>
            <span>Core</span>
            <strong>{Math.round(game.coreIntegrity)}%</strong>
          </div>
          <div>
            <span>Final kills</span>
            <strong>{game.stats.killed}</strong>
          </div>
          <div>
            <span>Peak hazard</span>
            <strong>{Math.round(game.stats.peakHazard)}</strong>
          </div>
        </div>
        <div className="modal-footer-actions">
          <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
            <LogOut size={15} /> Save slots
          </button>
          <button
            className="enter-button"
            type="button"
            data-testid={victory ? "new-campaign" : "retry-level"}
            onClick={() => (victory ? reset() : dispatch({ type: "retry_level" }))}
          >
            <RotateCcw size={17} /> {victory ? "Begin new campaign" : "Retry checkpoint"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const NoticeToast = () => {
  const notice = useGameStore((state) => state.notice);
  const clear = useGameStore((state) => state.clearNotice);
  if (!notice) return null;
  return (
    <button
      className="notice-toast"
      type="button"
      onClick={clear}
      aria-label={`${notice}. Dismiss`}
    >
      <Biohazard size={16} /> <span>{notice}</span> <X size={14} />
    </button>
  );
};
