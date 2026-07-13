import { ChevronRight, ScrollText } from "lucide-react";
import { LEVEL_DEFINITIONS, ROOM_DEFINITIONS } from "../game/config";
import { useGameStore } from "../game/store";

export const EventLog = () => {
  const events = useGameStore((state) => state.game.events);
  const selectRoom = useGameStore((state) => state.selectRoom);

  return (
    <section className="event-log" aria-label="System trace">
      <div className="event-log-header">
        <span>
          <ScrollText size={15} /> System trace
        </span>
        <small>Newest first · reactions, damage, and breaches</small>
      </div>
      <div className="event-row-list">
        {events.slice(0, 8).map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`event-row tone-${entry.tone}`}
            disabled={!entry.roomId}
            onClick={() => entry.roomId && selectRoom(entry.roomId)}
          >
            <span className="event-signal" />
            <span className="event-cycle">
              L{LEVEL_DEFINITIONS[entry.levelId].number}·R{entry.round}
            </span>
            <span className="event-copy">
              <strong>{entry.title}</strong>
              <small>{entry.detail}</small>
            </span>
            {entry.roomId && (
              <span className="event-room">
                {ROOM_DEFINITIONS[entry.roomId].code} <ChevronRight size={13} />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
