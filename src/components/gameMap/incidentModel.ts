import type { CombatIncident, GameState, RoomId } from "../../game/types";
import { roomMapRect } from "./mapGeometry";

export const INCIDENT_VISIBLE_SECONDS = 5;

export interface IncidentAggregate {
  age: number;
  count: number;
  height: number;
  kills: number;
  pressureDamage: number;
  pressureImpulse: number;
  roomId: RoomId;
  width: number;
  x: number;
  y: number;
}

type IncidentTimeline = Pick<GameState, "elapsed" | "incidents">;

const recentCombustionIncidents = (game: IncidentTimeline): CombatIncident[] =>
  game.incidents.filter(
    (incident) =>
      incident.sourceId === "hydrogen_oxygen_combustion" &&
      game.elapsed - incident.elapsed >= 0 &&
      game.elapsed - incident.elapsed <= INCIDENT_VISIBLE_SECONDS
  );

export const incidentMapAggregates = (game: IncidentTimeline): IncidentAggregate[] => {
  const grouped = new Map<RoomId, CombatIncident[]>();
  for (const incident of recentCombustionIncidents(game)) {
    const incidents = grouped.get(incident.roomId) ?? [];
    incidents.push(incident);
    grouped.set(incident.roomId, incidents);
  }
  return [...grouped.entries()].map(([roomId, incidents]) => {
    const room = roomMapRect(roomId);
    const latestElapsed = Math.max(...incidents.map((incident) => incident.elapsed));
    return {
      age: game.elapsed - latestElapsed,
      count: incidents.length,
      height: room.height,
      kills: incidents.reduce(
        (total, incident) => total + incident.targets.filter((target) => target.killed).length,
        0
      ),
      pressureDamage: incidents.reduce(
        (total, incident) => total + incident.damageByChannel.pressure,
        0
      ),
      pressureImpulse: Math.max(...incidents.map((incident) => incident.pressureImpulse)),
      roomId,
      width: room.width,
      x: room.center.x,
      y: room.center.y,
    };
  });
};
