import {
  DAMAGE_SOURCE_IDS,
  type CombatIncident,
  type CombatIncidentTarget,
  type EventTone,
  type GameEventCode,
  type GameEventParameterMap,
  type GameState,
  type RoundStats,
  type RoomId,
} from "../types";
import { addChannels, emptyHazardChannels } from "./damage";

const emptySourceTotals = (): RoundStats["damageBySource"] =>
  Object.fromEntries(
    DAMAGE_SOURCE_IDS.map((sourceId) => [sourceId, 0])
  ) as RoundStats["damageBySource"];

export const makeStats = (): RoundStats => ({
  spawned: 0,
  killed: 0,
  breached: 0,
  coreDamage: 0,
  damageDealt: 0,
  reactions: 0,
  combustionFlashes: 0,
  peakHazard: 0,
  matterHarvested: 0,
  fieldDamageAbsorbed: 0,
  reagentEmitted: 0,
  armorTransitions: 0,
  protectedAllySeconds: 0,
  damageByChannel: emptyHazardChannels(),
  damageBySource: emptySourceTotals(),
  killsBySource: emptySourceTotals(),
});

export const addEvent = <Code extends GameEventCode>(
  state: GameState,
  tone: EventTone,
  code: Code,
  parameters: GameEventParameterMap[Code] = {} as GameEventParameterMap[Code],
  roomId: RoomId | null = null,
  incidentId: number | null = null
): void => {
  state.events.unshift({
    id: state.nextEventId,
    levelId: state.campaign.levelId,
    round: state.campaign.roundIndex + 1,
    phase: state.phase,
    tone,
    code,
    parameters: parameters as GameState["events"][number]["parameters"],
    roomId,
    elapsed: state.elapsed,
    incidentId,
  } as GameState["events"][number]);
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

const CONTINUOUS_INCIDENT_WINDOW = 0.75;

const mergeIncidentTarget = (
  targets: CombatIncidentTarget[],
  incoming: CombatIncidentTarget
): void => {
  const existing = targets.find((target) => target.enemyId === incoming.enemyId);
  if (!existing) {
    targets.push(incoming);
    return;
  }
  existing.worldPosition = incoming.worldPosition;
  existing.healthAfter = incoming.healthAfter;
  existing.killed ||= incoming.killed;
  addChannels(existing.damageByChannel, incoming.damageByChannel);
};

/** Coalesces sustained room exposure into readable damage activity instead of one row per tick. */
export const upsertContinuousCombatIncident = (
  state: GameState,
  incident: Omit<CombatIncident, "id">
): CombatIncident => {
  const existingIndex = state.incidents.findIndex(
    (candidate) =>
      candidate.sourceId === incident.sourceId &&
      candidate.roomId === incident.roomId &&
      candidate.levelId === incident.levelId &&
      candidate.round === incident.round &&
      candidate.phase === incident.phase &&
      incident.elapsed >= candidate.elapsed &&
      incident.elapsed - candidate.elapsed <= CONTINUOUS_INCIDENT_WINDOW
  );
  if (existingIndex < 0) return addCombatIncident(state, incident);

  const existing = state.incidents[existingIndex] as CombatIncident;
  existing.elapsed = incident.elapsed;
  addChannels(existing.damageByChannel, incident.damageByChannel);
  for (const target of incident.targets) mergeIncidentTarget(existing.targets, target);

  if (existingIndex > 0) {
    state.incidents.splice(existingIndex, 1);
    state.incidents.unshift(existing);
  }
  return existing;
};
