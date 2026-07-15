import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEVEL_IDS } from "../types";
import { intendedPlan } from "./policies";
import { runPlan } from "./runner";
import type { RoundReport } from "../types";

const FIXTURE_URL = new URL("./__fixtures__/intended-run-snapshot.json", import.meta.url);

type Snapshot = Record<string, { terminalPhase: string; reports: RoundReport[] }>;

/**
 * Behavior lock for the world-identity refactor (plan M1): every level's intended
 * plan must reproduce this exact per-round report series. Regenerate the fixture only
 * for deliberate balance or content changes (`pnpm determinism:snapshot`).
 */
describe("intended-run determinism snapshot", () => {
  it("reproduces the committed per-round reports for every level", () => {
    const fixture = JSON.parse(readFileSync(fileURLToPath(FIXTURE_URL), "utf8")) as Snapshot;
    for (const levelId of LEVEL_IDS) {
      const result = runPlan(levelId, intendedPlan(levelId));
      const expected = fixture[levelId];
      expect(expected, levelId).toBeDefined();
      expect(result.terminalPhase, levelId).toBe(expected?.terminalPhase);
      expect(result.reports, levelId).toEqual(expected?.reports);
    }
  }, 240_000);
});
