import type { GameState } from "../../game/types";
import {
  NARRATIVE_ACTS,
  NARRATIVE_SITES,
  narrativeSiteForLevel,
  narrativeSiteOpensAct,
  type NarrativeActId,
  type NarrativeSiteDefinition,
} from "../../presentation/defaultGame";

export type LogbookEntryStatus = "secured" | "current" | "sealed";

export interface LogbookSiteEntry {
  readonly site: NarrativeSiteDefinition;
  readonly status: LogbookEntryStatus;
  readonly readable: boolean;
}

export interface LogbookActGroup {
  readonly actId: NarrativeActId;
  readonly order: number;
  readonly status: LogbookEntryStatus;
  readonly readable: boolean;
  readonly sites: readonly LogbookSiteEntry[];
}

export type LogbookSelection =
  | { readonly kind: "act"; readonly actId: NarrativeActId }
  | { readonly kind: "site"; readonly siteId: NarrativeSiteDefinition["id"] };

const actStatus = (order: number, currentOrder: number): LogbookEntryStatus => {
  if (order === currentOrder) return "current";
  return order < currentOrder ? "secured" : "sealed";
};

const siteStatus = (
  site: NarrativeSiteDefinition,
  currentSite: NarrativeSiteDefinition
): LogbookEntryStatus => {
  if (site.id === currentSite.id) return "current";
  return site.order < currentSite.order ? "secured" : "sealed";
};

/**
 * The log reads as far as the route has been sailed. Sites the castellum has
 * already cleared stay listed as a record; the current filing is the one the
 * crew can still act on.
 */
export const logbookGroups = (game: GameState): readonly LogbookActGroup[] => {
  const currentSite = narrativeSiteForLevel(game.campaign.levelId);
  const currentAct = NARRATIVE_ACTS[currentSite.actId];
  return Object.values(NARRATIVE_ACTS)
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((act) => {
      const sites = NARRATIVE_SITES.filter((site) => site.actId === act.id).map((site) => {
        const status = siteStatus(site, currentSite);
        return { site, status, readable: status === "current" };
      });
      const status = actStatus(act.order, currentAct.order);
      return { actId: act.id, order: act.order, status, readable: status !== "sealed", sites };
    });
};

export const defaultLogbookSelection = (game: GameState): LogbookSelection => {
  const site = narrativeSiteForLevel(game.campaign.levelId);
  if (game.phase === "level_briefing" && narrativeSiteOpensAct(site)) {
    return { kind: "act", actId: site.actId };
  }
  return { kind: "site", siteId: site.id };
};

export const selectionMatches = (
  selection: LogbookSelection,
  candidate: LogbookSelection
): boolean => {
  if (selection.kind === "act" && candidate.kind === "act") {
    return selection.actId === candidate.actId;
  }
  if (selection.kind === "site" && candidate.kind === "site") {
    return selection.siteId === candidate.siteId;
  }
  return false;
};
