import { cleanupCatalystCharge } from "../encounter/catalystCharge";
import { catalystReport } from "../encounter/catalystReport";
import { cloneEncounter } from "../encounter/clone";
import type { ExerciseState } from "./types";

/** Retain bounded diagnostics for charged enemies discarded by retry or restart. */
export const recordDiscard = (
  source: ExerciseState,
  reason: "retry" | "restart"
): ExerciseState["discardedReports"] => {
  const records = structuredClone(source.discardedReports);
  const state = cloneEncounter(source.encounter);
  if (!Object.values(state.catalyst?.chargeByEnemy ?? {}).some((entry) => entry.amount > 0))
    return records;
  cleanupCatalystCharge(state);
  const report = catalystReport(state);
  if (report) records.push({ encounterId: state.definition.id, tick: state.tick, reason, report });
  return records.slice(-64);
};
