import type { GameState } from "../types";
import { cloneEncounter } from "../encounter/clone";

export const cloneGame = (state: GameState): GameState => ({
  ...state,
  pack: { ...state.pack },
  campaign: {
    ...state.campaign,
    completedLevelIds: [...state.campaign.completedLevelIds],
    settledEncounterIds: [...state.campaign.settledEncounterIds],
  },
  encounter: cloneEncounter(state.encounter),
  events: structuredClone(state.events),
});
