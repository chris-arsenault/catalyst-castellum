import { describe, expect, it } from "vitest";
import { createEncounter } from "./create";
import { createEncounterRuntime } from "./runtime";
import { EncounterCommandOrderError } from "./commands";
import { cloneEncounter } from "./clone";
import { corridorCombat, corridorEncounter } from "./__fixtures__/corridor";
import type { OrderedEncounterCommand } from "./types";

const context = { combat: corridorCombat, definition: corridorEncounter, process: null };
const runtime = createEncounterRuntime(context);
const commands: OrderedEncounterCommand[] = [
  {
    tick: 0,
    sequence: 0,
    command: {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 1, elevation: 1 },
      mountFace: "left_wall",
      orientation: "right",
    },
  },
  { tick: 0, sequence: 1, command: { type: "start_assault" } },
];

describe("isolated encounter kernel", () => {
  it("runs one catalog entry and one wave with no campaign or process inventory", () => {
    const initial = createEncounter(corridorCombat, corridorEncounter);
    const result = runtime.advanceTicks(initial, 100, commands);
    expect(result.termination).toBe("complete");
    expect(result.state.process).toBeNull();
    expect(result.state).not.toHaveProperty("campaign");
    expect(result.state.stats.killed).toBe(1);
    expect(result.state.stats.damageDealt).toBe(25);
    expect(result.state.pendingMatter).toBe(3);
    expect(result.state.matter).toBe(20);
    expect(result.state.towers["tower:isolated:1"]?.shots).toBe(5);
    expect(result.state.tick).toBe(14);
    expect(result.commands.map((entry) => entry.decision.allowed)).toEqual([true, true]);
    expect(runtime.validate(result.state)).toEqual([]);
    expect(initial.tick).toBe(0);
    expect(initial.towers).toEqual({});
  });

  it("advances all eighty requested ticks and matches individually advanced ticks", () => {
    const initial = createEncounter(corridorCombat, corridorEncounter);
    const bulk = runtime.advanceTicks(initial, 80);
    let individual = initial;
    for (let index = 0; index < 80; index += 1)
      individual = runtime.advanceTicks(individual, 1).state;
    expect(bulk.ticksAdvanced).toBe(80);
    expect(bulk.state.elapsed).toBeCloseTo(8, 10);
    expect(bulk.state).toEqual(individual);
  });

  it("replays commands across a cloned mid-encounter snapshot", () => {
    const start = createEncounter(corridorCombat, corridorEncounter);
    const mid = runtime.advanceTicks(start, 5, commands).state;
    const input: OrderedEncounterCommand = {
      tick: 5,
      sequence: 0,
      command: {
        type: "upgrade_tower",
        towerId: "tower:isolated:1",
        upgradeId: "flash_calibration",
      },
    };
    const loaded = runtime.load(runtime.save(mid));
    expect(loaded).not.toBeNull();
    const replay = runtime.advanceTicks(loaded!, 100, [input]);
    const direct = runtime.advanceTicks(start, 105, [...commands, input]);
    expect(replay.state).toEqual(direct.state);
    expect(replay.state.matter).toBe(15);
    expect(replay.state.stats.killed).toBe(1);
  });

  it("preserves ordered rejection decisions and rejects duplicate, past, and future commands", () => {
    const initial = createEncounter(corridorCombat, corridorEncounter);
    const input: OrderedEncounterCommand = {
      tick: 0,
      sequence: 0,
      command: { type: "upgrade_tower", towerId: "missing", upgradeId: "flash_calibration" },
    };
    const rejected = runtime.execute(initial, input);
    expect(rejected.decision.code).toBe("not_installed");
    expect(rejected.state.commandCursor).toEqual({ tick: 0, sequence: 0 });
    expect(() => runtime.execute(rejected.state, input)).toThrow(EncounterCommandOrderError);
    expect(() => runtime.execute(initial, { ...input, tick: 1 })).toThrow("tick_mismatch");
    expect(() => runtime.execute(runtime.advanceTicks(initial, 1).state, input)).toThrow(
      "tick_mismatch"
    );
  });
});

describe("encounter termination and observations", () => {
  it("returns terminal results without settling campaign rewards or advancing again", () => {
    const definition = { ...corridorEncounter, maximumTicks: 2 };
    const timed = createEncounterRuntime({ ...context, definition });
    const result = timed.advanceTicks(createEncounter(corridorCombat, definition), 80);
    expect(result.termination).toBe("timeout");
    expect(result.ticksAdvanced).toBe(2);
    expect(timed.advanceTicks(result.state, 80).ticksAdvanced).toBe(0);
  });

  it("reports a lethal Core breach on its exact arrival tick", () => {
    const definition = { ...corridorEncounter, startingCoreIntegrity: 8 };
    const battle = createEncounterRuntime({ ...context, definition });
    const result = battle.advanceTicks(createEncounter(corridorCombat, definition), 100, [
      { tick: 0, sequence: 0, command: { type: "start_assault" } },
    ]);
    expect(result.termination).toBe("defeat");
    expect(result.state.tick).toBe(57);
    expect(result.state.coreIntegrity).toBe(0);
    expect(result.state.stats.breached).toBe(1);
    expect(result.state.stats.breachesByRoute).toEqual({ lane: 1 });
  });

  it("rejects a non-monotonic stream before simulating its earlier commands", () => {
    const initial = createEncounter(corridorCombat, corridorEncounter);
    expect(() =>
      runtime.advanceTicks(initial, 1, [
        { tick: 10, sequence: 0, command: { type: "start_assault" } },
        { tick: 0, sequence: 0, command: { type: "start_assault" } },
      ])
    ).toThrow("tick_mismatch");
    expect(initial.tick).toBe(0);
    expect(initial.phase).toBe("build");
  });

  it("detaches observer events from durable simulation state", () => {
    const result = runtime.advanceTicks(
      createEncounter(corridorCombat, corridorEncounter),
      1,
      commands
    );
    const event = result.events[0]!;
    const original = structuredClone(result.state.events);
    event.tone = "danger";
    expect(result.state.events).toEqual(original);
  });

  it("rejects unknown snapshot fields and mismatched definitions", () => {
    const initial = createEncounter(corridorCombat, corridorEncounter);
    const snapshot = JSON.parse(runtime.save(initial));
    snapshot.encounter.tick = 0.5;
    expect(runtime.load(JSON.stringify(snapshot))).toBeNull();
    const altered = cloneEncounter(initial);
    altered.definition.combatVersion += 1;
    expect(() => runtime.save(altered)).toThrow("definition identity");
    expect(
      runtime.load(runtime.save(initial).replace('"process":null', '"process":null,"campaign":{}'))
    ).toBeNull();
  });
});
