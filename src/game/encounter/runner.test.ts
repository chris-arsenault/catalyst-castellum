import { describe, expect, it } from "vitest";
import { createNamedEncounterFixture } from "./fixtures";
import { DEFAULT_ENCOUNTER_RUN_OPTIONS, runEncounter } from "./runner";
import { createEncounterRuntime } from "./runtime";
import type { OrderedEncounterCommand } from "./types";

const fixture = createNamedEncounterFixture("corridor", "paired");

describe("bounded encounter experiments", () => {
  it("matches individual and batched ticks in every observer mode", () => {
    const baseline = runEncounter(fixture.context, fixture.commands, {
      ...DEFAULT_ENCOUNTER_RUN_OPTIONS,
      batchSize: 1,
      observer: "off",
    });
    for (const observer of ["summary", "trace"] as const) {
      const observed = runEncounter(fixture.context, fixture.commands, {
        ...DEFAULT_ENCOUNTER_RUN_OPTIONS,
        batchSize: 37,
        observer,
        traceLimit: 2,
      });
      expect(observed.state).toEqual(baseline.state);
      expect(observed.summary).toEqual(baseline.summary);
      expect(observed.commands).toEqual(baseline.commands);
      expect(observed.trace.length).toBeLessThanOrEqual(2);
      if (observer === "trace") expect(observed.traceDropped).toBeGreaterThan(0);
    }
  });

  it("continues a mid-assault snapshot with each remaining scheduled command once", () => {
    const commands: OrderedEncounterCommand[] = [
      ...fixture.commands,
      {
        tick: 12,
        sequence: 0,
        command: { type: "set_tower_targeting", towerId: "tower:isolated:1", policy: "strongest" },
      },
    ];
    const first = runEncounter(fixture.context, commands, {
      ...DEFAULT_ENCOUNTER_RUN_OPTIONS,
      ticks: 10,
    });
    expect(first.summary.termination).toBe("tick_limit");
    const runtime = createEncounterRuntime(fixture.context);
    const snapshot = runtime.load(runtime.save(first.state));
    expect(snapshot).not.toBeNull();
    const resumed = runEncounter(
      fixture.context,
      commands,
      { ...DEFAULT_ENCOUNTER_RUN_OPTIONS, ticks: 290 },
      snapshot
    );
    const whole = runEncounter(fixture.context, commands);
    expect(resumed.state).toEqual(whole.state);
    expect([...first.commands, ...resumed.commands]).toEqual(whole.commands);
    expect(resumed.commands.map(({ input }) => input.tick)).toEqual([12]);
  });
});

describe("command decisions and equal budgets", () => {
  it("records a denied purchase once even when later refunds make it affordable", () => {
    const commands: OrderedEncounterCommand[] = [
      ...fixture.commands,
      {
        tick: 1,
        sequence: 0,
        command: {
          type: "place_tower",
          chassisId: "flash_chamber",
          anchor: { column: 1, elevation: 2 },
          mountFace: "left_wall",
          orientation: "right",
        },
      },
      { tick: 2, sequence: 0, command: { type: "dismantle_tower", towerId: "tower:isolated:1" } },
      { tick: 2, sequence: 1, command: { type: "dismantle_tower", towerId: "tower:isolated:2" } },
    ];
    const result = runEncounter(fixture.context, commands, {
      ...DEFAULT_ENCOUNTER_RUN_OPTIONS,
      ticks: 20,
      batchSize: 3,
    });
    expect(result.commands.filter(({ decision }) => !decision.allowed)).toMatchObject([
      { input: { tick: 1 }, decision: { code: "insufficient_matter" } },
    ]);
    expect(result.state.matter).toBe(10);
    expect(result.state.towers).toEqual({});
  });

  it("validates both equal-cost defenses and exposes the idle control's losses", () => {
    for (const variant of ["paired", "calibrated"] as const) {
      const selected = createNamedEncounterFixture("corridor", variant);
      const result = runEncounter(selected.context, selected.commands);
      expect(result.summary.matterInvested).toBe(20);
      expect(result.summary.rejectedCommands).toBe(0);
      expect(result.state.process).toBeNull();
      expect(result.state).not.toHaveProperty("campaign");
    }
    const idle = createNamedEncounterFixture("corridor", "idle");
    const result = runEncounter(idle.context, idle.commands);
    expect(result.summary.termination).toBe("defeat");
    expect(result.summary.breached).toBe(5);
  });
});
