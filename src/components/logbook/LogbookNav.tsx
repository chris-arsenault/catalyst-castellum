import { BookMarked, ChevronDown, ChevronRight, CircleDot, Lock, Ship } from "lucide-react";
import { useGamePresentation } from "../../application/presentationContext";
import type { NarrativeActId } from "../../presentation/defaultGame";
import {
  selectionMatches,
  type LogbookActGroup,
  type LogbookEntryStatus,
  type LogbookSelection,
  type LogbookSiteEntry,
} from "./logbookModel";

const StatusMark = ({ status }: { status: LogbookEntryStatus }) => {
  if (status === "current") return <CircleDot size={13} />;
  if (status === "secured") return <BookMarked size={13} />;
  return <Lock size={12} />;
};

const STATUS_KEYS = {
  current: "ui.logbook.status.current",
  secured: "ui.logbook.status.secured",
  sealed: "ui.logbook.status.sealed",
} as const;

const statusLabel = (
  status: LogbookEntryStatus,
  translator: ReturnType<typeof useGamePresentation>["translator"]
): string => translator.text(STATUS_KEYS[status]);

const SiteRow = ({
  entry,
  selected,
  onSelect,
}: {
  entry: LogbookSiteEntry;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const copy = narrativeCopy.site(entry.site);
  const sealed = entry.status === "sealed";
  return (
    <li>
      <button
        type="button"
        className={`logbook-site-row ${entry.status}${selected ? " selected" : ""}`}
        data-testid={`logbook-site-${entry.site.id}`}
        aria-current={selected}
        disabled={!entry.readable}
        title={statusLabel(entry.status, translator)}
        onClick={onSelect}
      >
        <span className="logbook-site-mark">
          <StatusMark status={entry.status} />
        </span>
        <span className="logbook-site-copy">
          <strong>{sealed ? translator.text("ui.logbook.status.sealed") : copy.name}</strong>
          <small>{sealed ? translator.text("ui.logbook.sealedCode") : copy.code}</small>
        </span>
      </button>
    </li>
  );
};

interface LogbookNavProps {
  groups: readonly LogbookActGroup[];
  expandedActIds: ReadonlySet<NarrativeActId>;
  selection: LogbookSelection;
  onSelect: (selection: LogbookSelection) => void;
  onToggleAct: (actId: NarrativeActId) => void;
}

export const LogbookNav = ({
  groups,
  expandedActIds,
  selection,
  onSelect,
  onToggleAct,
}: LogbookNavProps) => {
  const { narrativeCopy, translator } = useGamePresentation();
  return (
    <nav className="logbook-nav" aria-label={translator.text("ui.logbook.title")}>
      <ol className="logbook-act-list">
        {groups.map((group) => {
          const expanded = expandedActIds.has(group.actId);
          const actCopy = narrativeCopy.act({ id: group.actId });
          const selected = selectionMatches(selection, { kind: "act", actId: group.actId });
          return (
            <li key={group.actId} className={`logbook-act ${group.status}`}>
              <div className="logbook-act-head">
                <button
                  type="button"
                  className="logbook-act-toggle"
                  data-testid={`logbook-act-toggle-${group.actId}`}
                  aria-expanded={expanded}
                  aria-label={translator.text("ui.logbook.actContents", { act: actCopy.name })}
                  onClick={() => onToggleAct(group.actId)}
                >
                  {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <button
                  type="button"
                  className={`logbook-act-entry${selected ? " selected" : ""}`}
                  data-testid={`logbook-act-${group.actId}`}
                  aria-current={selected}
                  disabled={!group.readable}
                  onClick={() => onSelect({ kind: "act", actId: group.actId })}
                >
                  <em>{translator.text("ui.logbook.act", { number: group.order })}</em>
                  <strong>
                    {group.readable ? actCopy.name : translator.text("ui.logbook.status.sealed")}
                  </strong>
                </button>
              </div>
              {expanded && (
                <ol className="logbook-site-list">
                  {group.sites.map((entry) => (
                    <SiteRow
                      key={entry.site.id}
                      entry={entry}
                      selected={selectionMatches(selection, {
                        kind: "site",
                        siteId: entry.site.id,
                      })}
                      onSelect={() => onSelect({ kind: "site", siteId: entry.site.id })}
                    />
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export const HangarButton = ({ ready, onOpen }: { ready: boolean; onOpen: () => void }) => {
  const { translator } = useGamePresentation();
  return (
    <button
      type="button"
      className="logbook-hangar-button"
      data-testid="logbook-hangar"
      disabled={!ready}
      onClick={onOpen}
    >
      <Ship size={19} />
      <span>
        <strong>{translator.text("ui.logbook.hangar")}</strong>
        <small>
          {translator.text(ready ? "ui.logbook.hangarReady" : "ui.logbook.hangarSecuredOnly")}
        </small>
      </span>
    </button>
  );
};
