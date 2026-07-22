import { ArrowRight, Gauge, Play } from "lucide-react";
import { useCallback } from "react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import { levelDefinitionFor, roundDefinitionFor } from "../../game/queries";
import type { GameState } from "../../game/types";
import {
  narrativeSiteForLevel,
  nextLevelId,
  type NarrativeActId,
  type NarrativeSiteDefinition,
} from "../../presentation/defaultGame";
import { CampaignRouteMap } from "../CampaignRouteMap";
import { NarrativeDialogue } from "../NarrativeDialogue";
import { ReportStats, roundReportStats } from "../WaveReport";

const RoundObjective = ({ game }: { game: GameState }) => {
  const { formatters, levelCopy, translator } = useGamePresentation();
  const round = roundDefinitionFor(game);
  const level = levelDefinitionFor(game);
  return (
    <div className="briefing-objective">
      <div>
        <Gauge size={19} />
        <span>{translator.text("ui.briefing.roundObjective")}</span>
      </div>
      <p>
        {translator.text("ui.briefing.objective", {
          objective: levelCopy.round(level, round).objective,
          duration: formatters.duration(round.primeSeconds),
        })}
      </p>
    </div>
  );
};

const SiteHeader = ({ site, number }: { site: NarrativeSiteDefinition; number: number }) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const copy = narrativeCopy.site(site);
  const actCopy = narrativeCopy.act({ id: site.actId });
  return (
    <header className="logbook-entry-head">
      <div className="eyebrow">
        <span /> {actCopy.name} · {copy.code}
      </div>
      <h1>
        <span>
          {translator.text("ui.briefing.checkpoint", { number: String(number).padStart(2, "0") })}
        </span>{" "}
        {copy.name}
      </h1>
      <div className="contract-context">
        <span>{copy.contract}</span>
        <strong>{copy.region}</strong>
      </div>
      <p className="briefing-lede">{copy.briefing}</p>
    </header>
  );
};

/** The filing the crew can still act on: read the channel, then take the contract. */
const BriefingEntry = ({ game, site }: { game: GameState; site: NarrativeSiteDefinition }) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const level = levelDefinitionFor(game);
  const play = useCallback(() => dispatch({ type: "begin_level" }), [dispatch]);
  return (
    <>
      <SiteHeader site={site} number={level.number} />
      <NarrativeDialogue key={`${site.id}.briefing`} phase="briefing" site={site} />
      <RoundObjective game={game} />
      <footer className="logbook-entry-actions">
        <button
          className="logbook-primary-action"
          type="button"
          data-testid="enter-control-room"
          onClick={play}
        >
          <Play size={18} /> {translator.text("ui.briefing.beginCheckpoint")}
        </button>
      </footer>
    </>
  );
};

/** A cleared site: the after-action channel, the record, and the next filing. */
const SecuredEntry = ({ game, site }: { game: GameState; site: NarrativeSiteDefinition }) => {
  const { formatters, narrativeCopy, roundReportCopy, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const setGraftMode = useGameStore((state) => state.setGraftMode);
  const level = levelDefinitionFor(game);
  const report = game.lastReport ? roundReportCopy(game.lastReport) : null;
  const nextId = nextLevelId(level.id);
  const nextSite = nextId ? narrativeSiteForLevel(nextId) : null;
  const depart = useCallback(() => {
    setGraftMode(false);
    dispatch({ type: "start_next_level" });
  }, [dispatch, setGraftMode]);
  return (
    <>
      <SiteHeader site={site} number={level.number} />
      <div className="logbook-record">
        <span className="logbook-record-seal">{translator.text("ui.logbook.entrySecured")}</span>
        <p>{report?.detail ?? translator.text("ui.progress.level.securedRecord")}</p>
        <ReportStats entries={roundReportStats(game, translator, formatters)} />
      </div>
      <NarrativeDialogue key={`${site.id}.debrief`} phase="debrief" site={site} />
      {nextSite && (
        <footer className="logbook-entry-actions">
          <button
            className="logbook-primary-action"
            type="button"
            data-testid="travel-to-next-site"
            onClick={depart}
          >
            <ArrowRight size={18} />{" "}
            {translator.text("ui.logbook.depart", { site: narrativeCopy.site(nextSite).name })}
          </button>
        </footer>
      )}
    </>
  );
};

export const SiteEntry = ({ game, site }: { game: GameState; site: NarrativeSiteDefinition }) =>
  game.phase === "level_complete" ? (
    <SecuredEntry game={game} site={site} />
  ) : (
    <BriefingEntry game={game} site={site} />
  );

export const ActEntry = ({
  actId,
  currentSite,
  onOpenContract,
  openable,
}: {
  actId: NarrativeActId;
  currentSite: NarrativeSiteDefinition;
  onOpenContract: () => void;
  openable: boolean;
}) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const copy = narrativeCopy.act({ id: actId });
  return (
    <>
      <header className="logbook-entry-head">
        <div className="eyebrow">
          <span /> {translator.text("narrative.ui.act.eyebrow")}
        </div>
        <h1>{copy.name}</h1>
        <strong className="act-summary">{copy.summary}</strong>
      </header>
      <div className="act-setting">
        {copy.introduction.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <CampaignRouteMap currentSite={currentSite} />
      {openable && (
        <footer className="logbook-entry-actions">
          <button
            className="logbook-primary-action"
            type="button"
            data-testid="act-continue"
            onClick={onOpenContract}
          >
            {translator.text("ui.logbook.openContract", {
              site: narrativeCopy.site(currentSite).name,
            })}{" "}
            <ArrowRight size={18} />
          </button>
        </footer>
      )}
    </>
  );
};
