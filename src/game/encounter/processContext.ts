import type { ProcessEncounterContext, ProcessEncounterState } from "./processTypes";
import type { EncounterContext, EncounterState } from "./types";

export const configuredProcess = (state: EncounterState, context: EncounterContext) => {
  if (!state.process) return null;
  if (!context.process || !context.definition.process)
    throw new Error("Encounter process definition and bridge are required");
  return {
    state: state as ProcessEncounterState,
    context: context as ProcessEncounterContext,
    bridge: context.process,
  };
};
