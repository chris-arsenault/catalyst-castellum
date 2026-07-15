import { ChevronRight, ScrollText, X } from "lucide-react";
import { useCallback, useState } from "react";
import { LEVEL_DEFINITIONS } from "../presentation/defaultGame";
import type { GameEvent } from "../game/types";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { roomDefinition } from "../presentation/defaultGame";

const EventEntry = ({
  entry,
  onChoose,
}: {
  entry: GameEvent;
  onChoose: (entry: GameEvent) => void;
}) => {
  const { eventCopy } = useGamePresentation();
  const copy = eventCopy(entry);
  return (
    <button
      type="button"
      className={`event-row tone-${entry.tone}`}
      disabled={!entry.roomId}
      onClick={() => onChoose(entry)}
    >
      <span className="event-signal" />
      <span className="event-cycle">
        L{LEVEL_DEFINITIONS[entry.levelId].number}·R{entry.round}
      </span>
      <span className="event-copy">
        <strong>{copy.title}</strong>
        <small>{copy.detail}</small>
      </span>
      {entry.roomId && (
        <span className="event-room">
          {roomDefinition(entry.roomId).code} <ChevronRight size={13} />
        </span>
      )}
    </button>
  );
};

export const EventLog = () => {
  const { eventCopy, translator } = useGamePresentation();
  const events = useGameStore((state) => state.game.events);
  const selectRoom = useGameStore((state) => state.selectRoom);
  const [open, setOpen] = useState(false);
  const latest = events[0];
  const close = useCallback(() => setOpen(false), []);
  const choose = useCallback(
    (entry: GameEvent) => {
      if (entry.roomId) selectRoom(entry.roomId);
      setOpen(false);
    },
    [selectRoom]
  );
  return (
    <>
      <button
        className="battle-feed"
        type="button"
        data-testid="battle-feed"
        aria-label={translator.text("ui.eventLog.open")}
        onClick={() => setOpen(true)}
      >
        <span>
          <ScrollText size={14} /> {translator.text("ui.eventLog.recent")}
        </span>
        <strong>{latest ? eventCopy(latest).title : translator.text("ui.eventLog.ready")}</strong>
        <ChevronRight size={14} />
      </button>
      {open && (
        <div className="modal-backdrop event-log-backdrop">
          <section
            className="event-log"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-log-title"
          >
            <header className="event-log-header">
              <span id="event-log-title">
                <ScrollText size={15} /> {translator.text("ui.eventLog.title")}
              </span>
              <button
                type="button"
                className="modal-close"
                aria-label={translator.text("ui.eventLog.close")}
                onClick={close}
              >
                <X size={18} />
              </button>
            </header>
            <div className="event-row-list">
              {events.length === 0 ? (
                <p className="empty-event-log">{translator.text("ui.eventLog.empty")}</p>
              ) : (
                events
                  .slice(0, 20)
                  .map((entry) => <EventEntry key={entry.id} entry={entry} onChoose={choose} />)
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};
