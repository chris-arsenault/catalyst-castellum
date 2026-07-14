import type {
  CommandRejectionCode,
  CommandRejectionParameters,
  CommandResult,
  GameState,
} from "../types";

export const rejectCommand = (
  state: GameState,
  code: CommandRejectionCode,
  parameters: CommandRejectionParameters
): CommandResult => ({
  state,
  accepted: false,
  code,
  parameters,
});

export const acceptCommand = (state: GameState): CommandResult => ({
  state,
  accepted: true,
  code: null,
  parameters: {},
});
