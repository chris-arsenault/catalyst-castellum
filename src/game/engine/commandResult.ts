import type { CommandResult, GameState } from "../types";

export const rejectCommand = (state: GameState, reason: string): CommandResult => ({
  state,
  accepted: false,
  reason,
});

export const acceptCommand = (state: GameState): CommandResult => ({
  state,
  accepted: true,
  reason: null,
});
