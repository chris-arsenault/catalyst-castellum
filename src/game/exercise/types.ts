import type { CommandDecision } from "../types";
import type { CatalystReport } from "../encounter/catalystTypes";
import type {
  EncounterCommand,
  EncounterContext,
  EncounterDefinition,
  EncounterResult,
  EncounterState,
} from "../encounter/types";

export interface ExerciseState {
  version: 1;
  exerciseId: string;
  contentVersion: number;
  waveIndex: number;
  encounter: EncounterState;
  reports: EncounterResult[];
  settledEncounterIds: string[];
  checkpoint: string | null;
  discardedReports: {
    encounterId: string;
    tick: number;
    reason: "retry" | "restart";
    report: CatalystReport;
  }[];
}
export type ExerciseCommand =
  | EncounterCommand
  | { type: "continue_wave" }
  | { type: "retry_wave" }
  | { type: "restart_exercise" };
export interface ExerciseRuntime {
  definition: { id: string; contentVersion: number; waves: readonly EncounterDefinition[] };
  create(): ExerciseState;
  execute(
    state: ExerciseState,
    command: ExerciseCommand
  ): { state: ExerciseState; decision: CommandDecision };
  executeOrdered(
    state: ExerciseState,
    input: import("../encounter/types").OrderedEncounterCommand
  ): { state: ExerciseState; decision: CommandDecision };
  advanceTicks(state: ExerciseState, count: number): ExerciseState;
  context(state: ExerciseState): EncounterContext;
  save(state: ExerciseState): string;
  load(raw: string): ExerciseState | null;
}
