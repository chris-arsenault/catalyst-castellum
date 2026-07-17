import { Activity } from "lucide-react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "../../tutorial/anchors";
import type { RoomId } from "../../game/types";
import {
  DAMAGE_CHANNELS,
  damageSourceDisplay,
  formatDamageAmount,
} from "../../presentation/damageCopy";

const incidentsTutorialAnchor = (roomId: RoomId | null): TutorialAnchorId | undefined => {
  if (roomId === "furnace") return TUTORIAL_ANCHORS.furnaceIncidents;
  if (roomId === "gallery") return TUTORIAL_ANCHORS.galleryIncidents;
  return undefined;
};

export const RecentIncidents = () => {
  const { damage, formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const incidents = game.incidents
    .filter((incident) => incident.roomId === roomId)
    .sort((left, right) => right.elapsed - left.elapsed || right.id - left.id)
    .slice(0, 4);
  return (
    <section
      className="effects-panel recent-incidents"
      data-testid={`recent-incidents-${roomId}`}
      data-tutorial-anchor={incidentsTutorialAnchor(roomId)}
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
            const totalDamage = DAMAGE_CHANNELS.reduce(
              (total, channel) => total + incident.damageByChannel[channel],
              0
            );
            const channelSummary = DAMAGE_CHANNELS.filter(
              (channel) => incident.damageByChannel[channel] > 0
            )
              .map(
                (channel) =>
                  `${damage.channelStyle[channel].label} ${formatDamageAmount(
                    incident.damageByChannel[channel]
                  )}`
              )
              .join(" · ");
            return (
              <article key={incident.id} className={damageSourceDisplay[incident.sourceId]}>
                <strong>
                  {translator.text("ui.room.incident.title", {
                    source: damage.sourceLabel[incident.sourceId],
                    damage: formatDamageAmount(totalDamage),
                  })}
                </strong>
                <span>
                  {translator.text("ui.room.incident.targets", {
                    targets: incident.targets.length,
                    killed,
                  })}
                </span>
                <span className="incident-channels">{channelSummary}</span>
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
