import type { EncounterState } from "./types";

export const cloneEncounter = <State extends EncounterState>(state: State): State => {
  const { map, ...durable } = state;
  return { ...structuredClone(durable), map } as State;
};
