import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import type { GameState } from "../../game/types";
import {
  INCIDENT_VISIBLE_SECONDS,
  incidentMapAggregates,
  type IncidentAggregate,
} from "./incidentModel";

const drawIncident = (graphics: Graphics, incident: IncidentAggregate): void => {
  graphics.clear();
  const progress = Math.min(1, incident.age / INCIDENT_VISIBLE_SECONDS);
  const fade = Math.max(0.08, 1 - progress);
  const baseRadius = Math.min(incident.width, incident.height) * 0.3;
  const impulseScale = Math.min(1.35, 0.85 + incident.pressureImpulse / 500);
  const radius =
    (baseRadius + progress * Math.max(incident.width, incident.height) * 0.62) * impulseScale;
  graphics
    .circle(0, 0, radius)
    .stroke({ color: 0xf7ad6a, width: 7 - progress * 3, alpha: fade * 0.88 });
  graphics
    .circle(0, 0, Math.max(5, radius - 13))
    .stroke({ color: 0xfadea8, width: 2.5, alpha: fade * 0.58 });
  graphics
    .roundRect(-145, -incident.height / 2 - 70, 290, 51, 6)
    .fill({ color: 0x130b07, alpha: 0.84 * fade })
    .stroke({ color: incident.kills > 0 ? 0xdef65d : 0xf6a358, width: 2.5, alpha: fade });
};

const IncidentMarker = ({ incident }: { incident: IncidentAggregate }) => {
  const draw = useCallback((graphics: Graphics) => drawIncident(graphics, incident), [incident]);
  const title = incident.count > 1 ? `OX-1 FLASH ×${incident.count}` : "OX-1 FLASH";
  return (
    <pixiContainer x={incident.x} y={incident.y} eventMode="none">
      <pixiGraphics draw={draw} eventMode="none" />
      <pixiText
        text={title}
        y={-incident.height / 2 - 65}
        anchor={{ x: 0.5, y: 0 }}
        eventMode="none"
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 18,
          fontWeight: "800",
          fill: "#f8c683",
          letterSpacing: 1.2,
        }}
      />
      <pixiText
        text={`−${Math.round(incident.pressureDamage)} PRESSURE · −${Math.round(incident.heatDamage)} HEAT · KILL ×${incident.kills}`}
        y={-incident.height / 2 - 43}
        anchor={{ x: 0.5, y: 0 }}
        eventMode="none"
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 17,
          fontWeight: "700",
          fill: incident.kills > 0 ? "#e8f87f" : "#fad299",
          letterSpacing: 0.4,
        }}
      />
    </pixiContainer>
  );
};

export const IncidentLayer = ({ game }: { game: GameState }) => (
  <>
    {incidentMapAggregates(game).map((incident) => (
      <IncidentMarker key={incident.roomId} incident={incident} />
    ))}
  </>
);
