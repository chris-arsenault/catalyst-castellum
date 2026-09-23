import type { EventTone, GameEventCode, GameEventParameterMap, GameState, RoomId } from "../types";
export { makeStats } from "../encounter/events";

/** Campaign lifecycle records share the encounter event counter and retain their campaign identity. */
export const addEvent = <Code extends GameEventCode>(
  state: GameState,
  tone: EventTone,
  code: Code,
  parameters: GameEventParameterMap[Code] = {} as GameEventParameterMap[Code],
  roomId: RoomId | null = null,
  incidentId: number | null = null
): void => {
  state.events.unshift({
    id: state.encounter.nextEventId++,
    levelId: state.campaign.levelId,
    round: state.campaign.roundIndex + 1,
    phase: state.phase,
    tone,
    code,
    parameters,
    roomId,
    elapsed: state.encounter.elapsed,
    incidentId,
  } as GameState["events"][number]);
  if (state.events.length > 48) state.events.length = 48;
};
