import { z } from "zod";
import { createEncounterRuntime } from "../encounter/runtime";
import { encounterResultSchema, encounterStateSchema } from "../persistence/encounterSaveSchema";
import { cloneEncounter } from "../encounter/clone";
import { catalystReportSchema } from "../persistence/catalystSaveSchema";
import type { EncounterContext } from "../encounter/types";
import type { ExerciseRuntime, ExerciseState } from "./types";

const schema = z.strictObject({
  version: z.literal(1),
  exerciseId: z.string().min(1),
  contentVersion: z.number().int().positive(),
  waveIndex: z.number().int().nonnegative(),
  encounter: encounterStateSchema,
  reports: z.array(encounterResultSchema),
  settledEncounterIds: z.array(z.string().min(1)),
  checkpoint: z.string().nullable(),
  discardedReports: z
    .array(
      z.strictObject({
        encounterId: z.string().min(1),
        tick: z.number().int().nonnegative(),
        reason: z.enum(["retry", "restart"]),
        report: catalystReportSchema,
      })
    )
    .max(64),
});
type ContextFor = (state: Pick<ExerciseState, "waveIndex">) => EncounterContext;

const validReports = (state: ExerciseState, definition: ExerciseRuntime["definition"]): boolean => {
  const terminal = state.encounter.result;
  if (state.reports.length !== state.waveIndex + Number(Boolean(terminal))) return false;
  for (const [index, report] of state.reports.entries()) {
    if (report.encounterId !== definition.waves[index]?.id) return false;
    if (index < state.waveIndex && report.termination !== "complete") return false;
    if (report.pendingMatter !== report.report.matterHarvested) return false;
  }
  return !terminal || JSON.stringify(state.reports.at(-1)) === JSON.stringify(terminal);
};

const validSettlement = (state: ExerciseState): boolean => {
  const receipts = state.reports
    .filter((report) => report.termination === "complete")
    .map((report) => report.encounterId);
  if (JSON.stringify(receipts) !== JSON.stringify(state.settledEncounterIds)) return false;
  const terminal = state.encounter.result;
  return (
    terminal?.termination !== "complete" ||
    (state.encounter.pendingMatter === 0 &&
      state.encounter.matter === terminal.matter + terminal.pendingMatter)
  );
};

const validCheckpoint = (
  state: ExerciseState,
  runtime: ReturnType<typeof createEncounterRuntime>
): boolean => {
  if (!state.checkpoint)
    return (
      state.encounter.phase === "build" ||
      (state.encounter.phase === "timeout" &&
        state.encounter.spawnCursor === 0 &&
        state.encounter.stats.spawned === 0)
    );
  const checkpoint = runtime.load(state.checkpoint);
  return Boolean(checkpoint && checkpoint.phase === "build" && !checkpoint.result);
};

const validate = (
  state: ExerciseState,
  definition: ExerciseRuntime["definition"],
  contextFor: ContextFor
): boolean => {
  if (
    state.exerciseId !== definition.id ||
    state.contentVersion !== definition.contentVersion ||
    state.waveIndex >= definition.waves.length
  )
    return false;
  const runtime = createEncounterRuntime(contextFor(state));
  if (runtime.validate(state.encounter).length) return false;
  return (
    validReports(state, definition) && validSettlement(state) && validCheckpoint(state, runtime)
  );
};

export const encodeExercise = (
  state: ExerciseState,
  definition: ExerciseRuntime["definition"],
  contextFor: ContextFor
): string => {
  if (!schema.safeParse(state).success || !validate(state, definition, contextFor))
    throw new Error("Invalid exercise snapshot");
  return JSON.stringify(state);
};
export const decodeExercise = (
  raw: string,
  definition: ExerciseRuntime["definition"],
  contextFor: ContextFor
): ExerciseState | null => {
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const state = parsed.data as ExerciseState;
    if (!validate(state, definition, contextFor)) return null;
    return { ...state, encounter: cloneEncounter(state.encounter) };
  } catch {
    return null;
  }
};
