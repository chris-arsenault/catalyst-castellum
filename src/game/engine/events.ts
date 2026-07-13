import {
  DAMAGE_SOURCE_IDS,
  type CombatIncident,
  type CycleStats,
  type EventTone,
  type GameState,
  type RoomId,
} from "../types";
import { emptyHazardChannels } from "./damage";

const emptySourceTotals = (): CycleStats["damageBySource"] =>
  Object.fromEntries(
    DAMAGE_SOURCE_IDS.map((sourceId) => [sourceId, 0])
  ) as CycleStats["damageBySource"];

export const makeStats = (): CycleStats => ({
  spawned: 0,
  killed: 0,
  breached: 0,
  coreDamage: 0,
  damageDealt: 0,
  reactions: 0,
  combustionFlashes: 0,
  peakHazard: 0,
  matterHarvested: 0,
  damageByChannel: emptyHazardChannels(),
  damageBySource: emptySourceTotals(),
  killsBySource: emptySourceTotals(),
});

export const addEvent = (
  state: GameState,
  tone: EventTone,
  title: string,
  detail: string,
  roomId: RoomId | null = null,
  incidentId: number | null = null
): void => {
  state.events.unshift({
    id: state.nextEventId,
    levelId: state.campaign.levelId,
    round: state.campaign.roundIndex + 1,
    phase: state.phase,
    tone,
    title,
    detail,
    roomId,
    elapsed: state.elapsed,
    incidentId,
  });
  state.nextEventId += 1;
  if (state.events.length > 48) state.events.length = 48;
};

export const addCombatIncident = (
  state: GameState,
  incident: Omit<CombatIncident, "id">
): CombatIncident => {
  const recorded = { ...incident, id: state.nextIncidentId };
  state.nextIncidentId += 1;
  state.incidents.unshift(recorded);
  if (state.incidents.length > 64) state.incidents.length = 64;
  return recorded;
};
