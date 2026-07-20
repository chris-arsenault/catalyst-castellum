import { Navigation, NotebookPen } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useExpandSet } from "../../application/hooks";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import type { GameState } from "../../game/types";
import {
  narrativeSiteForLevel,
  NARRATIVE_SITES_BY_ID,
  nextLevelId,
} from "../../presentation/defaultGame";
import { CampaignRouteMap } from "../CampaignRouteMap";
import { ClaimRigGraphic } from "../ClaimRigGraphic";
import { GraftBoard } from "../GraftBoard";
import { FacilityManual } from "../manual/FacilityManual";
import { NoticeToast } from "../Modals";
import { AudioControls, BrandLockup, EncyclopediaButton, SaveSlotsButton } from "../ShellControls";
import { ActEntry, SiteEntry } from "./LogbookEntries";
import { HangarButton, LogbookNav } from "./LogbookNav";
import { defaultLogbookSelection, logbookGroups, type LogbookSelection } from "./logbookModel";

/** Transit plays as a timed transition; docking needs no extra click. */
const TRAVEL_TRANSIT_MS = 2600;

const LogbookHeader = () => {
  const { translator } = useGamePresentation();
  return (
    <header className="logbook-header">
      <BrandLockup />
      <div className="logbook-header-title">
        <NotebookPen size={16} />
        <span>{translator.text("ui.logbook.title")}</span>
      </div>
      <div className="logbook-header-controls">
        <AudioControls />
        <SaveSlotsButton />
        <EncyclopediaButton />
      </div>
    </header>
  );
};

const TransitView = ({ game }: { game: GameState }) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const site = narrativeSiteForLevel(game.campaign.levelId);
  const nextId = nextLevelId(game.campaign.levelId);
  const nextSite = nextId ? narrativeSiteForLevel(nextId) : null;
  const docked = useRef(false);
  const dock = useCallback(() => {
    if (docked.current) return;
    docked.current = true;
    dispatch({ type: "dock_at_site" });
  }, [dispatch]);
  useEffect(() => {
    const timer = window.setTimeout(dock, TRAVEL_TRANSIT_MS);
    return () => window.clearTimeout(timer);
  }, [dock]);
  return (
    <main className="logbook-transit" data-testid="travel-intermission">
      <button className="logbook-transit-skip" type="button" onClick={dock}>
        <div className="intermission-visual">
          <ClaimRigGraphic />
          <CampaignRouteMap currentSite={site} />
          <div className="intermission-motion-copy">
            <Navigation size={18} />
            <div>
              <strong>{translator.text("narrative.ui.transit.title")}</strong>
              <span>
                {translator.text("narrative.ui.transit.detail", {
                  site: narrativeCopy.site(nextSite ?? site).name,
                })}
              </span>
            </div>
          </div>
        </div>
      </button>
    </main>
  );
};

const LogbookBody = ({ game }: { game: GameState }) => {
  const groups = logbookGroups(game);
  const currentSite = narrativeSiteForLevel(game.campaign.levelId);
  const graftReady = game.phase === "level_complete";
  const setGraftMode = useGameStore((state) => state.setGraftMode);
  const [selection, setSelection] = useState<LogbookSelection>(() => defaultLogbookSelection(game));
  const acts = useExpandSet([currentSite.actId]);
  const openCurrentContract = useCallback(
    () => setSelection({ kind: "site", siteId: currentSite.id }),
    [currentSite.id]
  );
  const openHangar = useCallback(() => setGraftMode(true), [setGraftMode]);

  return (
    <div className="logbook-body">
      <aside className="logbook-sidebar">
        <LogbookNav
          groups={groups}
          expandedActIds={acts.expanded}
          selection={selection}
          onSelect={setSelection}
          onToggleAct={acts.toggle}
        />
        <HangarButton ready={graftReady} onOpen={openHangar} />
      </aside>
      <main className="logbook-entry" data-testid="logbook-entry">
        {selection.kind === "act" ? (
          <ActEntry
            actId={selection.actId}
            currentSite={currentSite}
            onOpenContract={openCurrentContract}
            openable={game.phase === "level_briefing"}
          />
        ) : (
          <SiteEntry game={game} site={NARRATIVE_SITES_BY_ID[selection.siteId]} />
        )}
      </main>
    </div>
  );
};

/**
 * The captain's log: the campaign's meta surface. Acts and their sites read as
 * entries, the hangar opens from the same page, and play starts from the
 * current filing.
 */
export const Logbook = () => {
  const game = useGameStore((state) => state.game);
  const graftMode = useGameStore((state) => state.graftMode);
  if (graftMode) return <GraftBoard />;
  return (
    <div className="logbook-shell" data-simulation-clock="static" data-testid="captains-logbook">
      <LogbookHeader />
      {game.phase === "travel" ? (
        <TransitView game={game} />
      ) : (
        <LogbookBody key={`${game.campaign.levelId}:${game.phase}`} game={game} />
      )}
      <FacilityManual />
      <NoticeToast />
    </div>
  );
};
