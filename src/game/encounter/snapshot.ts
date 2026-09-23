import { encounterStateSchema } from "../persistence/encounterSaveSchema";
import { cloneEncounter } from "./clone";
import { validateEncounterState } from "./validation";
import type { EncounterContext, EncounterState } from "./types";

export const ENCOUNTER_SNAPSHOT_VERSION = 2;

export const encodeEncounterSnapshot = (
  state: EncounterState,
  context: EncounterContext
): string => {
  const issues = validateEncounterState(state, context);
  if (issues.length) throw new Error(`Invalid encounter snapshot: ${issues.join("; ")}`);
  return JSON.stringify({ version: ENCOUNTER_SNAPSHOT_VERSION, encounter: state });
};

export const decodeEncounterSnapshot = (
  text: string,
  context: EncounterContext
): EncounterState | null => {
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || !("version" in value) || !("encounter" in value))
      return null;
    if (value.version !== ENCOUNTER_SNAPSHOT_VERSION || Object.keys(value).length !== 2)
      return null;
    const parsed = encounterStateSchema.safeParse(value.encounter);
    if (!parsed.success) return null;
    const state = parsed.data as EncounterState;
    if (validateEncounterState(state, context).length) return null;
    return cloneEncounter(state);
  } catch {
    return null;
  }
};
