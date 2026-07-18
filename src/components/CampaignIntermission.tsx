import { ArrowRight, Blocks, CheckCircle2, Gauge, LogOut, Navigation } from "lucide-react";
import { useCallback } from "react";
import { useGamePresentation } from "../application/presentationContext";
import { useGameStore } from "../application/store";
import {
  LEVEL_DEFINITIONS,
  narrativeSiteForLevel,
  nextLevelId,
  type NarrativeSiteDefinition,
} from "../presentation/defaultGame";
import { levelDefinitionFor } from "../game/queries";
import { GraftBoard } from "./GraftBoard";
import { CampaignRouteMap } from "./CampaignRouteMap";
import { ClaimRigGraphic } from "./ClaimRigGraphic";
import { NarrativeDialogue } from "./NarrativeDialogue";

const NarrativeTransitVisual = ({
  currentSite,
  destination,
}: {
  currentSite: NarrativeSiteDefinition;
  destination: NarrativeSiteDefinition | null;
}) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const siteName = narrativeCopy.site(destination ?? currentSite).name;
  return (
    <div className="intermission-visual">
      <ClaimRigGraphic />
      <CampaignRouteMap currentSite={currentSite} />
      <div className="intermission-motion-copy">
        <Navigation size={18} />
        <div>
          <strong>
            {translator.text(
              destination ? "narrative.ui.transit.title" : "narrative.ui.transit.holdTitle"
            )}
          </strong>
          <span>
            {destination
              ? translator.text("narrative.ui.transit.detail", { site: siteName })
              : translator.text("narrative.ui.transit.holdDetail", { site: siteName })}
          </span>
        </div>
      </div>
    </div>
  );
};

const SummaryStats = () => {
  const { formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  return (
    <dl className="intermission-stats">
      <div>
        <dt>{translator.text("ui.progress.neutralized")}</dt>
        <dd>{game.lastReport?.killed ?? 0}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.progress.breaches")}</dt>
        <dd>{game.lastReport?.breached ?? 0}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.progress.core")}</dt>
        <dd>{formatters.percent(game.coreIntegrity / 100, 0)}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.progress.reactions")}</dt>
        <dd>{formatters.number(game.lastReport?.reactions ?? 0, 1)}</dd>
      </div>
    </dl>
  );
};

const IntermissionChoices = ({
  canTravel,
  onGraft,
  onTravel,
}: {
  canTravel: boolean;
  onGraft: () => void;
  onTravel: () => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className={`intermission-choice${canTravel ? "" : " single"}`}>
      <button
        type="button"
        className="graft-choice"
        data-testid="intermission-graft"
        onClick={onGraft}
      >
        <Blocks size={20} />
        <span>
          <strong>{translator.text("ui.intermission.graft.action")}</strong>
          <small>{translator.text("ui.intermission.graft.detail")}</small>
        </span>
      </button>
      {canTravel && (
        <button
          type="button"
          className="travel-choice"
          data-testid="travel-to-next-site"
          onClick={onTravel}
        >
          <ArrowRight size={20} />
          <span>
            <strong>{translator.text("ui.intermission.travel.action")}</strong>
            <small>{translator.text("ui.intermission.travel.detail")}</small>
          </span>
        </button>
      )}
    </div>
  );
};

const NextContract = ({ site }: { site: NarrativeSiteDefinition | null }) => {
  const { narrativeCopy, translator } = useGamePresentation();
  if (!site) {
    return (
      <div className="intermission-next">
        <span>
          <Gauge size={16} /> {translator.text("narrative.ui.progress.next")}
        </span>
        <strong>{translator.text("narrative.ui.progress.campaign")}</strong>
        <p>{translator.text("narrative.ui.progress.ledger")}</p>
      </div>
    );
  }
  const copy = narrativeCopy.site(site);
  return (
    <div className="intermission-next">
      <span>
        <Gauge size={16} /> {translator.text("narrative.ui.progress.next")}
      </span>
      <strong>{copy.name}</strong>
      <p>{copy.briefing}</p>
    </div>
  );
};

const IntermissionSummary = () => {
  const { narrativeCopy, roundReportCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const setGraftMode = useGameStore((state) => state.setGraftMode);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const level = levelDefinitionFor(game);
  const report = game.lastReport ? roundReportCopy(game.lastReport) : null;
  const nextId = nextLevelId(level.id);
  const nextLevel = nextId ? LEVEL_DEFINITIONS[nextId] : null;
  const currentSite = narrativeSiteForLevel(level.id);
  const nextSite = nextLevel ? narrativeSiteForLevel(nextLevel.id) : null;
  const currentSiteCopy = narrativeCopy.site(currentSite);
  const travel = useCallback(() => {
    setGraftMode(false);
    dispatch({ type: "start_next_level" });
  }, [dispatch, setGraftMode]);
  const graft = useCallback(() => setGraftMode(true), [setGraftMode]);

  return (
    <main className="intermission-stage" data-testid="level-intermission">
      <section className="intermission-screen">
        <NarrativeTransitVisual currentSite={currentSite} destination={null} />
        <article className="intermission-summary">
          <header>
            <span className="intermission-seal">
              <CheckCircle2 size={28} />
            </span>
            <div>
              <em>{translator.text("ui.progress.level.eyebrow")}</em>
              <h1>
                {translator.text("narrative.ui.progress.complete", { site: currentSiteCopy.name })}
              </h1>
            </div>
          </header>
          <p>{report?.detail ?? translator.text("ui.progress.level.securedRecord")}</p>
          <NarrativeDialogue key={`${currentSite.id}.debrief`} phase="debrief" site={currentSite} />
          <SummaryStats />
          <NextContract site={nextSite} />
          <IntermissionChoices canTravel={Boolean(nextLevel)} onGraft={graft} onTravel={travel} />
          <footer>
            <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
              <LogOut size={15} /> {translator.text("ui.topbar.saveSlots")}
            </button>
          </footer>
        </article>
      </section>
    </main>
  );
};

const TravelRecovery = () => {
  const { narrativeCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const nextId = nextLevelId(game.campaign.levelId);
  const nextLevel = nextId ? LEVEL_DEFINITIONS[nextId] : null;
  const currentSite = narrativeSiteForLevel(game.campaign.levelId);
  const nextSite = nextLevel ? narrativeSiteForLevel(nextLevel.id) : null;
  const dock = useCallback(() => dispatch({ type: "dock_at_site" }), [dispatch]);
  return (
    <main className="intermission-stage" data-testid="travel-intermission">
      <section className="travel-recovery">
        <NarrativeTransitVisual currentSite={currentSite} destination={nextSite} />
        <em>{translator.text("ui.progress.travel.eyebrow")}</em>
        <h1>
          {translator.text("ui.progress.travel.title", {
            name: nextLevel
              ? narrativeCopy.site(narrativeSiteForLevel(nextLevel.id)).name
              : translator.text("ui.progress.level.campaign"),
          })}
        </h1>
        <p>{translator.text("ui.progress.travel.detail")}</p>
        <button
          className="travel-choice compact"
          type="button"
          data-testid="travel-to-next-site"
          onClick={dock}
        >
          <ArrowRight size={20} /> {translator.text("ui.intermission.travel.action")}
        </button>
      </section>
    </main>
  );
};

export const CampaignIntermission = () => {
  const phase = useGameStore((state) => state.game.phase);
  const graftMode = useGameStore((state) => state.graftMode);
  if (phase === "travel") return <TravelRecovery />;
  if (graftMode) return <GraftBoard />;
  return <IntermissionSummary />;
};
