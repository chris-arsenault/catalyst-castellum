import { describe, expect, it } from "vitest";
import {
  advanceFixtureTicks,
  applyFixtureCommand,
  combatProjection,
  directFireFixture,
  finiteProcessFixture,
  firstWaveFixture,
  measured,
  processProjection,
} from "./__fixtures__/postM1Scenarios";

describe("post-M1 direct encounter characterization", () => {
  it("preserves kills, command timing, between-tick replay, and one-time wave settlement", () => {
    const { runtime, towerId, state: build } = directFireFixture();
    let state = applyFixtureCommand(runtime, build, { type: "start_assault" });
    state = advanceFixtureTicks(runtime, state, 40);
    expect(combatProjection(state)).toMatchObject({
      phase: "assault",
      elapsed: 4,
      matter: 64,
      pendingMatter: 3,
      core: 100,
      spawned: 1,
      killed: 1,
      damage: 39.653127318,
      towers: [{ shots: 2, cooldown: 1, targetPolicy: "first", upgrades: [] }],
      enemies: [],
    });
    state = applyFixtureCommand(runtime, state, {
      type: "set_tower_targeting",
      towerId,
      policy: "strongest",
    });
    state = applyFixtureCommand(runtime, state, {
      type: "upgrade_tower",
      towerId,
      upgradeId: "flash_calibration",
    });
    state = advanceFixtureTicks(runtime, state, 40);
    expect(combatProjection(state)).toMatchObject({
      elapsed: 8,
      matter: 55,
      pendingMatter: 6,
      killed: 2,
      towers: [{ shots: 4, cooldown: 0.8, targetPolicy: "strongest" }],
    });
    const restored = runtime.save.decode(runtime.save.encode(state));
    expect(restored).not.toBeNull();
    if (!restored) throw new Error("Characterization checkpoint failed to load.");
    const resumed = restored;
    state = advanceFixtureTicks(runtime, state, 110);
    expect(combatProjection(state)).toEqual(
      combatProjection(advanceFixtureTicks(runtime, resumed, 110))
    );
    expect(state.phase).toBe("assault");
    state = advanceFixtureTicks(runtime, state, 1);
    expect(combatProjection(state)).toMatchObject({
      phase: "round_result",
      elapsed: 19.1,
      phaseTime: 0,
      matter: 70,
      pendingMatter: 0,
      core: 100,
      killed: 5,
      breached: 0,
      damage: 198.265636589,
      towers: [{ shots: 10, kills: 5 }],
      enemies: [],
    });
    expect(runtime.queries.reportFor(state)).toMatchObject({
      killed: 5,
      matterHarvested: 15,
      round: 1,
    });
    expect(advanceFixtureTicks(runtime, state, 5)).toBe(state);
    const continued = applyFixtureCommand(runtime, state, { type: "continue_round" });
    expect(continued).toMatchObject({
      phase: "build",
      encounter: { matter: 70, pendingMatter: 0 },
    });
    expect(continued.encounter.towers[towerId]!.shots).toBe(10);
    expect(continued.encounter.stats.killed).toBe(0);
  });
});

describe("post-M1 Core arrival characterization", () => {
  it("preserves Core-arrival ticks for an undefended first wave", () => {
    const { runtime, state: build } = firstWaveFixture();
    let state = applyFixtureCommand(runtime, build, { type: "start_assault" });
    const arrivals: { tick: number; core: number }[] = [];
    for (let tick = 1; tick <= 422; tick += 1) {
      const previous = state.encounter.stats.breached;
      state = advanceFixtureTicks(runtime, state, 1);
      if (state.encounter.stats.breached > previous)
        arrivals.push({ tick, core: state.encounter.coreIntegrity });
    }
    expect(arrivals).toEqual([
      { tick: 269, core: 92 },
      { tick: 307, core: 84 },
      { tick: 346, core: 76 },
      { tick: 384, core: 68 },
      { tick: 422, core: 60 },
    ]);
    expect(combatProjection(state)).toMatchObject({
      phase: "round_result",
      elapsed: 42.2,
      matter: 82,
      pendingMatter: 0,
      killed: 0,
      breached: 5,
      damage: 0,
      breachesByRoute: { entry_to_core: 5 },
    });
  });
});

describe("post-M1 process encounter characterization", () => {
  it("preserves finite supply, emission, same-tick exhaust processing, and replay", () => {
    const { runtime, towerId, state: build } = finiteProcessFixture();
    let state = applyFixtureCommand(runtime, build, { type: "start_assault" });
    expect(runtime.validate(state)).toEqual([]);
    state = advanceFixtureTicks(runtime, state, 1);
    expect(processProjection(state, towerId)).toMatchObject({
      elapsed: 0.1,
      storedHydrogen: 0,
      supplyMode: "direct",
      emitted: 0.06,
      reservoirs: [5.94],
      upperSteam: 0.4993,
      towers: [{ shots: 1, damage: 38.61 }],
      enemies: [{ health: 9961.39, pathIndex: 0, progress: 0.448 }],
      fields: [
        { id: "enemy:1:emission", remaining: 1.4, intensity: 0.24 },
        { id: `tower:${towerId}:steam-wake`, remaining: 3.2, intensity: 0.19 },
      ],
    });
    state = advanceFixtureTicks(runtime, state, 39);
    expect(processProjection(state, towerId)).toMatchObject({
      elapsed: 4,
      emitted: 2.4,
      reservoirs: [3.6],
      upperSteam: 0.386796607,
      roomHydrogen: 1.62304196,
      towers: [{ shots: 3, damage: 95.81 }],
      enemies: [{ health: 9904.19, pathIndex: 16, progress: 0.6264 }],
    });
    const restored = runtime.save.decode(runtime.save.encode(state));
    expect(restored).not.toBeNull();
    if (!restored) throw new Error("Process characterization checkpoint failed to load.");
    state = advanceFixtureTicks(runtime, state, 60);
    expect(processProjection(state, towerId)).toEqual(
      processProjection(advanceFixtureTicks(runtime, restored, 60), towerId)
    );
    expect(processProjection(state, towerId)).toMatchObject({
      elapsed: 10,
      emitted: 6,
      reservoirs: [0],
      storedHydrogen: 0,
      upperSteam: 0.313746214,
      roomHydrogen: 1.624237543,
      towers: [{ shots: 7, damage: 210.21 }],
      enemies: [{ health: 9789.79, pathIndex: 43, progress: 0.5064 }],
    });
    const exhausted = advanceFixtureTicks(runtime, state, 10);
    expect(measured(exhausted.encounter.stats.reagentEmitted)).toBe(6);
    expect(runtime.validate(exhausted)).toEqual([]);
  });
});
