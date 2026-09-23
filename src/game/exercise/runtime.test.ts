import { describe, expect, it } from "vitest";
import { createCatalystExerciseRuntime } from "../exercise";
import type { ExerciseState } from "./types";

const runtime = createCatalystExerciseRuntime();
const defended = (): ExerciseState => {
  let state = runtime.create();
  for (const column of [7, 20]) {
    const placed = runtime.execute(state, {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    });
    expect(placed.decision.allowed).toBe(true);
    state = placed.state;
  }
  return state;
};
const finish = (state: ExerciseState): ExerciseState =>
  runtime.advanceTicks(runtime.execute(state, { type: "start_assault" }).state, 1800);

describe("five-wave exercise lifecycle", () => {
  it("opens with direct defenses and validates all five process-free waves", () => {
    const state = runtime.create();
    expect(state.encounter.process).toBeNull();
    expect(state.encounter.availability.towers).toEqual(["flash_chamber", "carbon_burner"]);
    expect(runtime.definition.waves).toHaveLength(5);
    expect(runtime.load(runtime.save(state))).toEqual(state);
  });

  it("settles an ordinary defense once, carries paid towers, and unlocks the catalyst pair", () => {
    const finished = finish(defended());
    expect(finished.encounter.phase).toBe("complete");
    expect(finished.encounter.coreIntegrity).toBe(100);
    expect(finished.encounter.stats.killed).toBe(4);
    expect(finished.encounter.matter).toBe(65);
    const resumed = runtime.load(runtime.save(finished))!;
    const repeated = runtime.advanceTicks(resumed, 10);
    expect(repeated.encounter.matter).toBe(65);
    expect(repeated.settledEncounterIds).toHaveLength(1);
    const next = runtime.execute(repeated, { type: "continue_wave" }).state;
    expect(next.waveIndex).toBe(1);
    expect(next.encounter.tick).toBe(0);
    expect(Object.keys(next.encounter.towers)).toEqual(Object.keys(finished.encounter.towers));
    expect(next.encounter.availability.towers).toContain("caustic_jet");
    expect(next.encounter.availability.towers).toContain("carbonyl_marker");
    expect(next.checkpoint).toBeNull();
    expect(runtime.load(runtime.save(next))).toEqual(next);
  });

  it("restores the pre-assault economy and removes a retry's settlement receipt", () => {
    const before = defended();
    const finished = finish(before);
    const retry = runtime.execute(finished, { type: "retry_wave" });
    expect(retry.decision.allowed).toBe(true);
    expect(retry.state.encounter).toEqual(before.encounter);
    expect(retry.state.reports).toEqual([]);
    expect(retry.state.settledEncounterIds).toEqual([]);
    expect(finish(retry.state).encounter.matter).toBe(65);
  });

  it("idle play loses and retry restores the current wave rather than earlier purchases", () => {
    let state = runtime.create();
    state = finish(state);
    expect(state.encounter.coreIntegrity).toBe(60);
    state = runtime.execute(state, { type: "continue_wave" }).state;
    const before = state.encounter;
    state = finish(state);
    expect(state.encounter.phase).toBe("defeat");
    expect(runtime.execute(state, { type: "continue_wave" }).decision.allowed).toBe(false);
    const retry = runtime.execute(state, { type: "retry_wave" }).state;
    expect(retry.waveIndex).toBe(1);
    expect(retry.encounter).toEqual(before);
    expect(retry.settledEncounterIds).toHaveLength(1);
  });
});

describe("exercise snapshots", () => {
  it("saves a build timeout and preserves independent wave damage reports", () => {
    const timeout = runtime.advanceTicks(runtime.create(), 1800);
    expect(timeout.encounter.phase).toBe("timeout");
    expect(runtime.load(runtime.save(timeout))).toEqual(timeout);
    const first = finish(defended());
    const next = runtime.execute(first, { type: "continue_wave" }).state;
    const second = finish(next);
    for (const report of second.reports) {
      const direct = Object.values(report.report.catalyst!.directBySource).reduce(
        (sum, source) => sum + source.damage,
        0
      );
      expect(direct).toBeCloseTo(report.report.damageDealt, 9);
    }
    expect(second.reports[0]).toEqual(first.reports[0]);
  });

  it("replays a saved midpoint exactly", () => {
    const assault = runtime.execute(defended(), { type: "start_assault" }).state;
    const midpoint = runtime.advanceTicks(assault, 35);
    const restored = runtime.load(runtime.save(midpoint))!;
    expect(runtime.advanceTicks(restored, 1800)).toEqual(runtime.advanceTicks(assault, 1835));
  });

  it("rejects mismatched receipts, reports, charge creation, and checkpoint identities", () => {
    const state = finish(defended());
    const corruptions = [
      (value: ExerciseState) => {
        value.settledEncounterIds.push(value.settledEncounterIds[0]!);
      },
      (value: ExerciseState) => {
        value.reports[0] = {
          ...value.reports[0]!,
          pendingMatter: value.reports[0]!.pendingMatter + 10,
        };
      },
      (value: ExerciseState) => {
        value.encounter.catalyst!.accounting.accepted += 10;
      },
      (value: ExerciseState) => {
        value.checkpoint = runtime.save(runtime.create());
      },
      (value: ExerciseState) => {
        value.contentVersion += 1;
      },
    ];
    for (const mutate of corruptions) {
      const value = structuredClone(state);
      mutate(value);
      expect(runtime.load(JSON.stringify(value))).toBeNull();
    }
  });
});

describe("exercise discarded charge", () => {
  it("records cleanup when a charged running wave is restarted", () => {
    let state = runtime.execute(finish(defended()), { type: "continue_wave" }).state;
    state = runtime.execute(state, {
      type: "move_tower",
      towerId: "tower:harker-catalyst:1",
      anchor: { column: 31, elevation: 5 },
      mountFace: "left_wall",
      orientation: "right",
    }).state;
    state = runtime.execute(state, {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 7, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    }).state;
    state = runtime.advanceTicks(runtime.execute(state, { type: "start_assault" }).state, 30);
    const charge = Object.values(state.encounter.catalyst!.chargeByEnemy).reduce(
      (sum, entry) => sum + entry.amount,
      0
    );
    expect(charge).toBeGreaterThan(0);
    const restarted = runtime.execute(state, { type: "restart_exercise" }).state;
    expect(restarted.waveIndex).toBe(0);
    expect(restarted.discardedReports).toHaveLength(1);
    expect(restarted.discardedReports[0]!.report.accounting.cleanup).toBeCloseTo(charge, 9);
    expect(restarted.discardedReports[0]!.report.remainingCharge).toBe(0);
    expect(runtime.load(runtime.save(restarted))).toEqual(restarted);
  });
});
