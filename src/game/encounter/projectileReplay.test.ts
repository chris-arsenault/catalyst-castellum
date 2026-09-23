import { describe, expect, it } from "vitest";
import { physicalCombat } from "./__fixtures__/physical";
import { corridorEncounter } from "./__fixtures__/corridor";
import { createEncounter } from "./create";
import { createEncounterRuntime } from "./runtime";
import { runEncounter } from "./runner";
import type { OrderedEncounterCommand } from "./types";
import { enemyWorldPosition } from "../engine/enemyPosition";

const combat = physicalCombat("projectile", 1);
const context = { combat, definition: corridorEncounter, process: null };
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

describe("physical encounter snapshots", () => {
  it("expires prior effects before impact and preserves a new projectile effect's full duration", () => {
    const mid = runtime.advanceTicks(createEncounter(combat, corridorEncounter), 1, commands).state;
    const attack = mid.pendingAttacks[0]!;
    const enemy = mid.enemies[0]!;
    enemy.effects.push({
      sourceTowerId: attack.source.towerId,
      kind: "armor_break",
      magnitude: 1,
      remaining: 0.05,
      stacking: "strongest",
      floor: 0,
    });
    attack.target = enemyWorldPosition(enemy);
    attack.speed = 100;
    attack.travelSeconds =
      Math.hypot(
        attack.target.x - attack.source.origin.x,
        attack.target.elevation - attack.source.origin.elevation
      ) / attack.speed;
    attack.source.controlEffects = [
      {
        kind: "slow",
        magnitude: 0.5,
        duration: 0.2,
        stacking: "strongest",
        refresh: "replace",
        floor: 0.35,
      },
    ];
    mid.towers[attack.source.towerId]!.cooldown = 100;
    const result = runtime.advanceTicks(mid, 1).state;
    expect(result.stats.damageDealt).toBe(5);
    expect(result.enemies[0]!.effects).toEqual([
      {
        sourceTowerId: attack.source.towerId,
        kind: "slow",
        magnitude: 0.5,
        remaining: 0.2,
        stacking: "strongest",
        floor: 0.35,
      },
    ]);
  });
});

describe("physical snapshot replay", () => {
  it("resumes in-flight attacks with exact command, batching, and observer parity", () => {
    const initial = createEncounter(combat, corridorEncounter);
    const mid = runtime.advanceTicks(initial, 1, commands).state;
    expect(mid.pendingAttacks).toHaveLength(1);
    expect(mid.stats.damageDealt).toBe(0);
    const saved = runtime.save(mid);
    const restored = runtime.load(saved);
    expect(restored).toEqual(mid);
    const whole = runEncounter(
      context,
      commands,
      { ticks: 100, batchSize: 50, observer: "off", traceLimit: 2 },
      initial
    );
    const resumed = runEncounter(
      context,
      commands,
      { ticks: 99, batchSize: 1, observer: "trace", traceLimit: 2 },
      restored!
    );
    expect(resumed.state).toEqual(whole.state);
  });

  it("rejects forged flight position, duration, source identity, and damage", () => {
    const mid = runtime.advanceTicks(createEncounter(combat, corridorEncounter), 1, commands).state;
    for (const corrupt of [
      (state: typeof mid) => {
        state.pendingAttacks[0]!.position.x += 1;
      },
      (state: typeof mid) => {
        state.pendingAttacks[0]!.travelSeconds += 1;
      },
      (state: typeof mid) => {
        state.pendingAttacks[0]!.source.sourceId = "missing";
      },
      (state: typeof mid) => {
        state.pendingAttacks[0]!.source.packets[0]!.channels.heat = -1;
      },
    ]) {
      const changed = structuredClone(mid);
      corrupt(changed);
      expect(runtime.validate(changed).length).toBeGreaterThan(0);
    }
  });
});
