import type { GameDefinition } from "../definitionTypes";
import type { CombatIncident, GameEvent, GamePhase, GameState, RoundReport } from "../types";
import type { EncounterPhase } from "../encounter/types";

const campaignIdentity = (encounterId: string, definition: GameDefinition) => {
  for (const level of Object.values(definition.levels)) {
    const index = level.rounds.findIndex((round) => `${level.id}:${round.id}` === encounterId);
    if (index >= 0) return { levelId: level.id, round: index + 1 };
  }
  throw new Error(`Unknown campaign encounter ${encounterId}`);
};

const campaignPhase = (phase: EncounterPhase): GamePhase => {
  if (phase === "complete") return "round_result";
  if (phase === "timeout") return "defeat";
  return phase;
};

export const eventsFor = (state: GameState, definition: GameDefinition): GameEvent[] =>
  [
    ...state.events,
    ...state.encounter.events.map(
      ({ encounterId, phase, ...event }) =>
        ({
          ...event,
          ...campaignIdentity(encounterId, definition),
          phase: campaignPhase(phase),
        }) as GameEvent
    ),
  ]
    .sort((a, b) => b.id - a.id)
    .slice(0, 48);

export const incidentsFor = (state: GameState, definition: GameDefinition): CombatIncident[] =>
  state.encounter.incidents.map(({ encounterId, phase, ...incident }) => ({
    ...incident,
    ...campaignIdentity(encounterId, definition),
    phase: campaignPhase(phase),
  }));

export const reportFor = (state: GameState, definition: GameDefinition): RoundReport | null => {
  const result = state.encounter.result;
  return result ? { ...result.report, ...campaignIdentity(result.encounterId, definition) } : null;
};
