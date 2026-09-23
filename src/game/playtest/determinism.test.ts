import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEVEL_IDS } from "../types";
import { primaryReferencePlan } from "./policies";
import { runPlan } from "./runner";
import type { RoundReport } from "../types";

const FIXTURE_URL = new URL("./__fixtures__/intended-run-snapshot.json", import.meta.url);

type Snapshot = Record<string, { terminalPhase: string; reports: RoundReport[] }>;

/**
 * Content-version 21 behavior lock after firing/targeting repairs and exact tick advancement.
 * Every level's primary reference build reproduces this per-round report series.
 * Regenerate only for deliberate mechanics or content changes (`pnpm determinism:snapshot`).
 */
describe("primary-reference determinism snapshot", () => {
  it("reproduces the committed per-round reports for every level", () => {
    const fixture = JSON.parse(readFileSync(fileURLToPath(FIXTURE_URL), "utf8")) as Snapshot;
    for (const levelId of LEVEL_IDS) {
      const result = runPlan(levelId, primaryReferencePlan(levelId));
      const expected = fixture[levelId];
      expect(expected, levelId).toBeDefined();
      expect(result.terminalPhase, levelId).toBe(expected?.terminalPhase);
      expect(result.reports, levelId).toEqual(expected?.reports);
    }
  }, 600_000);
});
