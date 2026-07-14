import { Activity } from "lucide-react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import { TUTORIAL_ANCHORS } from "../../tutorial/anchors";

export const RecentIncidents = () => {
  const { formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const incidents = game.incidents.filter((incident) => incident.roomId === roomId).slice(0, 1);
  return (
    <section
      className="effects-panel recent-incidents"
      data-testid={`recent-incidents-${roomId}`}
      data-tutorial-anchor={roomId === "furnace" ? TUTORIAL_ANCHORS.furnaceIncidents : undefined}
    >
      <div className="section-title-row">
        <h3>{translator.text("ui.room.incidents")}</h3>
        <Activity size={15} />
      </div>
      {incidents.length === 0 ? (
        <p className="no-reaction">{translator.text("ui.room.incidentsClear")}</p>
      ) : (
        <div className="recent-incident-list">
          {incidents.map((incident) => {
            const killed = incident.targets.filter((target) => target.killed).length;
            return (
              <article key={incident.id}>
                <strong>
                  {translator.text("ui.room.incident.title", {
                    id: incident.id,
                    targets: incident.targets.length,
                    killed,
                  })}
                </strong>
                <span>
                  {translator.text("ui.room.incident.damage", {
                    impulse: formatters.number(incident.pressureImpulse, 0),
                    pressure: formatters.number(incident.damageByChannel.pressure, 0),
                    heat: formatters.number(incident.damageByChannel.heat, 0),
                  })}
                </span>
                <small>
                  {translator.text("ui.room.incident.recorded", {
                    phase: translator.text(
                      incident.phase === "prime"
                        ? "ui.room.incident.phase.prime"
                        : "ui.room.incident.phase.assault"
                    ),
                    time: formatters.duration(Number(incident.elapsed.toFixed(1))),
                  })}
                </small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
