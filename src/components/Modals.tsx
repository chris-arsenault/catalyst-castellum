import {
  ArrowRight,
  Biohazard,
  CheckCircle2,
  Droplets,
  Flame,
  Gauge,
  LogOut,
  RotateCcw,
  Wind,
  X,
} from "lucide-react";
import { useCallback } from "react";
import { LEVEL_DEFINITIONS, nextLevelId } from "../game/config";
import { levelDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import { guideDefinitionFor } from "../tutorial/guideModel";
import { roundReportCopy } from "../presentation/roundReportCopy";

const ManualPhases = () => (
  <div className="manual-phases">
    <div>
      <em>01</em>
      <strong>Plan</strong>
      <p>Configure equipment, conduits, and feedstocks while simulation time is frozen.</p>
    </div>
    <div>
      <em>02</em>
      <strong>Prime</strong>
      <p>Prime the plant before the wave arrives. Feedstocks, products, and byproducts persist.</p>
    </div>
    <div>
      <em>03</em>
      <strong>Assault</strong>
      <p>
        Binary controls and routing policies lock. The plant runs autonomously through the wave.
      </p>
    </div>
    <div>
      <em>04</em>
      <strong>Analyze</strong>
      <p>The end state freezes. Harvested matter is banked before the next plan.</p>
    </div>
  </div>
);

const ManualTips = () => (
  <div className="manual-tips">
    <div>
      <Wind size={18} />
      <p>
        <strong>The membrane cell feeds three separated outlets.</strong> Cl₂, H₂, and NaOH
        accumulate separately; blocking one eventually limits the whole electrolyzer.
      </p>
    </div>
    <div>
      <Flame size={18} />
      <p>
        <strong>Equipment defines room chemistry.</strong> A thermal coil and gas agitator let R-02
        recombine routed H₂ and Cl₂ into HCl.
      </p>
    </div>
    <div>
      <Droplets size={18} />
      <p>
        <strong>NaOCl stores chlorine potential.</strong> R-03 needs Cl₂ and twice as much NaOH. In
        R-06, leftover NaOH consumes HCl before acid can release Cl₂.
      </p>
    </div>
    <div>
      <Biohazard size={18} />
      <p>
        <strong>Core recovery retains relief streams.</strong> Vents and drains create headroom by
        moving complete mixtures into persistent recovery inventories.
      </p>
    </div>
  </div>
);

export const HelpModal = () => {
  const game = useGameStore((state) => state.game);
  const show = useGameStore((state) => state.showHelp);
  const setShow = useGameStore((state) => state.setShowHelp);
  const restartTutorialGuide = useGameStore((state) => state.restartTutorialGuide);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  if (!show) return null;
  const guide = guideDefinitionFor(game);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="manual-title">
      <div className="help-modal">
        <button
          className="modal-close"
          type="button"
          aria-label="Close field manual"
          onClick={() => setShow(false)}
        >
          <X size={18} />
        </button>
        <div className="eyebrow">
          <span /> Operations field manual
        </div>
        <h2 id="manual-title">Run the defense machine</h2>
        <p>
          Each round moves through four operating moments. Process state persists within a level;
          each completed level becomes a clean retry checkpoint.
        </p>

        <ManualPhases />
        <ManualTips />

        {guide && (
          <div className="manual-guide-replay">
            <div>
              <strong>Need the pointer again?</strong>
              <span>Replay {guide.label} from the next incomplete action.</span>
            </div>
            <button type="button" data-testid="replay-guided-lesson" onClick={restartTutorialGuide}>
              Replay guidance <RotateCcw size={15} />
            </button>
          </div>
        )}

        <div className="modal-footer-actions">
          <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
            <LogOut size={15} /> Save slots
          </button>
          <button className="secondary-action wide" type="button" onClick={() => setShow(false)}>
            Return to controls
          </button>
        </div>
      </div>
    </div>
  );
};

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
    <div
      className="modal-backdrop outcome-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-title"
    >
      <div className="outcome-modal outcome-victory">
        <div className="outcome-seal">
          <CheckCircle2 size={42} />
        </div>
        <div className="eyebrow">
          <span /> {props.eyebrow}
        </div>
        <h2 id="progress-title">{props.title}</h2>
        <p>{props.detail}</p>
        <div className="outcome-stats">
          <div>
            <span>Neutralized</span>
            <strong>{game.lastReport?.killed ?? 0}</strong>
          </div>
          <div>
            <span>Breaches</span>
            <strong>{game.lastReport?.breached ?? 0}</strong>
          </div>
          <div>
            <span>Core</span>
            <strong>{Math.round(game.coreIntegrity)}%</strong>
          </div>
          <div>
            <span>Reactions</span>
            <strong>{game.lastReport?.reactions.toFixed(1) ?? "0.0"}</strong>
          </div>
        </div>
        <div className="briefing-objective">
          <div>
            <Gauge size={19} />
            <span>{props.nextLabel}</span>
          </div>
          <p>{props.nextDetail}</p>
        </div>
        <div className="modal-footer-actions">
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
        </div>
      </div>
    </div>
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
