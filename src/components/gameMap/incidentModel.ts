import type { CombatIncident, GameState, RoomId } from "../../game/types";
import { mapViewFor } from "./mapGeometry";
import type { WorldMap } from "../../game/world/map";

export const INCIDENT_VISIBLE_SECONDS = 5;

export interface IncidentAggregate {
  age: number;
  count: number;
  height: number;
  kills: number;
  pressureDamage: number;
  heatDamage: number;
  pressureImpulse: number;
  roomId: RoomId;
  width: number;
  x: number;
  y: number;
}

type IncidentTimeline = Pick<GameState, "elapsed" | "incidents" | "phase"> & {
  campaign: Pick<GameState["campaign"], "levelId" | "roundIndex">;
};

export const transientCombatIndicatorsVisible = (game: Pick<GameState, "phase">): boolean =>
  game.phase === "prime" || game.phase === "assault";

export const transientIncidentVisible = (
  game: IncidentTimeline,
  incident: CombatIncident,
  visibleSeconds: number
): boolean => {
  const age = game.elapsed - incident.elapsed;
  return (
    transientCombatIndicatorsVisible(game) &&
    incident.levelId === game.campaign.levelId &&
    incident.round === game.campaign.roundIndex + 1 &&
    age >= 0 &&
    age <= visibleSeconds
  );
};

const recentCombustionIncidents = (game: IncidentTimeline): CombatIncident[] =>
  game.incidents.filter(
    (incident) =>
      incident.sourceId === "hydrogen_oxygen_combustion" &&
      transientIncidentVisible(game, incident, INCIDENT_VISIBLE_SECONDS)
  );

export const incidentMapAggregates = (
  game: IncidentTimeline,
  map: WorldMap
): IncidentAggregate[] => {
  const grouped = new Map<RoomId, CombatIncident[]>();
  for (const incident of recentCombustionIncidents(game)) {
    const incidents = grouped.get(incident.roomId) ?? [];
    incidents.push(incident);
    grouped.set(incident.roomId, incidents);
  }
  return [...grouped.entries()].map(([roomId, incidents]) => {
    const room = mapViewFor(map).roomMapRect(roomId);
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
      heatDamage: incidents.reduce((total, incident) => total + incident.damageByChannel.heat, 0),
      pressureImpulse: Math.max(...incidents.map((incident) => incident.pressureImpulse)),
      roomId,
      width: room.width,
      x: room.center.x,
      y: room.center.y,
    };
  });
};
