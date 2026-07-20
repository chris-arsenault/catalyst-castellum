import { ArrowRight, Biohazard, CheckCircle2, Gauge, LogOut, RotateCcw, X } from "lucide-react";
import { useCallback } from "react";
import type { ReactNode } from "react";
import { levelDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { CAMPAIGN_LEVELS } from "../presentation/defaultGame";
import { upcomingGuideDefinitionFor } from "../tutorial/guideModel";
import { GuideIntro } from "../tutorial/GuideIntro";
import { ReportStats, roundReportStats } from "./WaveReport";

interface ProgressFrameProps {
  actionLabel: string;
  detail: string;
  eyebrow: string;
  next: ReactNode;
  onAdvance: () => void;
  testId: string;
  title: string;
}

const ProgressFrame = (props: ProgressFrameProps) => {
  const { formatters, translator } = useGamePresentation();
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
        <div className="report-seal">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <span>{props.eyebrow}</span>
          <h2 id="progress-title">{props.title}</h2>
        </div>
      </header>
      <p>{props.detail}</p>
      <ReportStats entries={roundReportStats(game, translator, formatters)} />
      {props.next}
      <footer>
        <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
          <LogOut size={15} /> {translator.text("ui.topbar.saveSlots")}
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
  const {
    levelCopy: localizedLevelCopy,
    roundReportCopy: localizedReport,
    translator,
  } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const dismissedGuideIds = useGameStore((state) => state.dismissedGuideIds);
  const level = levelDefinitionFor(game);
  const report = game.lastReport ? localizedReport(game.lastReport) : null;
  const nextRound = level.rounds[game.campaign.roundIndex + 1];
  const upcoming = upcomingGuideDefinitionFor(game);
  const upcomingGuide =
    upcoming && !dismissedGuideIds.includes(upcoming.dismissalId) ? upcoming : null;
  const advance = useCallback(() => dispatch({ type: "continue_round" }), [dispatch]);
  return (
    <ProgressFrame
      actionLabel={translator.text("ui.progress.round.action")}
      detail={report?.detail ?? translator.text("ui.progress.round.frozen")}
      eyebrow={translator.text("ui.progress.round.eyebrow")}
      next={
        upcomingGuide ? (
          <GuideIntro guide={upcomingGuide} />
        ) : (
          <div className="progress-dock-next">
            <span>
              <Gauge size={15} /> {translator.text("ui.progress.round.next")}
            </span>
            <p>
              {nextRound
                ? localizedLevelCopy.round(level, nextRound).objective
                : translator.text("ui.progress.round.continue")}
            </p>
          </div>
        )
      }
      onAdvance={advance}
      testId="continue-round"
      title={report?.headline ?? translator.text("ui.progress.round.complete")}
    />
  );
};

export const CampaignProgressModal = () => {
  const phase = useGameStore((state) => state.game.phase);
  if (phase === "round_result") return <RoundProgressModal />;
  return null;
};

const completedCampaignSites = (completedLevelIds: readonly string[]): number =>
  CAMPAIGN_LEVELS.filter(({ id }) => completedLevelIds.includes(id)).length;

export const OutcomeModal = () => {
  const { formatters, levelCopy: localizedLevelCopy, translator } = useGamePresentation();
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
        <div className="report-seal outcome-seal">
          {victory ? <CheckCircle2 size={42} /> : <Biohazard size={42} />}
        </div>
        <div className="eyebrow">
          <span /> {translator.text("ui.outcome.eyebrow")}
        </div>
        <h2 id="outcome-title">
          {translator.text(victory ? "ui.outcome.victory.title" : "ui.outcome.defeat.title")}
        </h2>
        <p>
          {victory
            ? translator.text("ui.outcome.victory.detail", {
                integrity: formatters.number(game.coreIntegrity, 0),
              })
            : translator.text("ui.outcome.defeat.detail", {
                level: localizedLevelCopy.level(levelDefinitionFor(game)).name,
                round: game.campaign.roundIndex + 1,
              })}
        </p>
        <ReportStats
          entries={[
            {
              label: translator.text("ui.outcome.levels"),
              value: `${completedCampaignSites(game.campaign.completedLevelIds)} / ${CAMPAIGN_LEVELS.length}`,
            },
            {
              label: translator.text("ui.outcome.core"),
              value: formatters.percent(game.coreIntegrity / 100, 0),
            },
            { label: translator.text("ui.outcome.kills"), value: String(game.stats.killed) },
            {
              label: translator.text("ui.outcome.hazard"),
              value: formatters.number(game.stats.peakHazard, 0),
            },
          ]}
        />
        <div className="modal-footer-actions">
          <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
            <LogOut size={15} /> {translator.text("ui.topbar.saveSlots")}
          </button>
          <button
            className="enter-button"
            type="button"
            data-testid={victory ? "new-campaign" : "retry-level"}
            onClick={() => (victory ? reset() : dispatch({ type: "retry_level" }))}
          >
            <RotateCcw size={17} />{" "}
            {translator.text(victory ? "ui.outcome.newCampaign" : "ui.outcome.retry")}
          </button>
        </div>
      </div>
    </div>
  );
};

export const NoticeToast = () => {
  const { translator } = useGamePresentation();
  const notice = useGameStore((state) => state.notice);
  const clear = useGameStore((state) => state.clearNotice);
  if (!notice) return null;
  return (
    <button
      className="notice-toast"
      type="button"
      data-testid="notice-toast"
      onClick={clear}
      aria-label={translator.text("ui.notice.dismiss", { notice })}
    >
      <Biohazard size={16} /> <span>{notice}</span> <X size={14} />
    </button>
  );
};
