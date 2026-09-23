import type { ExerciseRuntime, ExerciseState } from "../game/exercise";
import { z } from "zod";

const sessionSchema = z.strictObject({
  version: z.literal(1),
  snapshot: z.string(),
  guidance: z.boolean(),
  evidence: z.array(z.string()),
});

export const EXERCISE_SAVE_KEY = "catalyst-castellum:exercise:harker-catalyst";
export interface ExerciseSessionSave {
  state: ExerciseState;
  guidance: boolean;
  evidence: string[];
}
export interface ExerciseStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const loadExerciseSession = (
  raw: string,
  runtime: ExerciseRuntime
): ExerciseSessionSave | null => {
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const value = parsed.data;
    const state = runtime.load(value.snapshot);
    return state ? { state, guidance: value.guidance, evidence: value.evidence } : null;
  } catch {
    return null;
  }
};

export const encodeExerciseSession = (
  session: ExerciseSessionSave,
  runtime: ExerciseRuntime
): string =>
  JSON.stringify({
    version: 1,
    snapshot: runtime.save(session.state),
    guidance: session.guidance,
    evidence: session.evidence,
  });
