import type { CycleStats, EventTone, GameState, RoomId } from "../types";

export const makeStats = (): CycleStats => ({
  spawned: 0,
  killed: 0,
  breached: 0,
  coreDamage: 0,
  damageDealt: 0,
  reactions: 0,
  peakHazard: 0,
});

export const addEvent = (
  state: GameState,
  tone: EventTone,
  title: string,
  detail: string,
  roomId: RoomId | null = null
): void => {
  state.events.unshift({
    id: state.nextEventId,
    cycle: state.cycle,
    phase: state.phase,
    tone,
    title,
    detail,
    ...(roomId ? { roomId } : {}),
  });
  state.nextEventId += 1;
  if (state.events.length > 48) state.events.length = 48;
};
