import { describe, expect, it } from "vitest";
import { applyFixtureCommand, firstWaveFixture } from "./__fixtures__/postM1Scenarios";
import { campaignEncounterContext } from "./engine/campaignEncounter";
import { completeAssault } from "./engine/phases";
import { addEncounterEvent } from "./encounter/events";
import { finishEncounter } from "./encounter/reports";
import { createEncounterRuntime } from "./encounter/runtime";
import type { GameRuntime } from "./runtime";
import type { GameState } from "./types";

/** A terminal wave boundary exercises settlement without simulating a campaign. */
const settleRound = (runtime: GameRuntime, source: GameState): GameState => {
  const state = applyFixtureCommand(runtime, source, { type: "start_assault" });
  const wave = campaignEncounterContext(state, runtime.definition).definition.wave;
  state.encounter.spawnCursor = wave.length;
  state.encounter.stats.spawned = wave.length;
  state.encounter.stats.killed = wave.length;
  state.encounter.pendingMatter = 7;
  state.encounter.stats.matterHarvested = 7;
  addEncounterEvent(state.encounter, "good", "assault_started");
  finishEncounter(state.encounter, "complete");
  completeAssault(state, runtime.definition);
  return state;
};

const completedRound = () => {
  const fixture = firstWaveFixture();
  return { ...fixture, state: settleRound(fixture.runtime, fixture.state) };
};

describe("campaign settlement boundaries", () => {
  it("grants a terminal reward once across save/load and keeps prior round event identities", () => {
    const { runtime, state } = completedRound();
    const saved = runtime.save.decode(runtime.save.encode(state));
    expect(saved).not.toBeNull();
    if (!saved) throw new Error("Expected a valid settled checkpoint.");
    const before = structuredClone(saved);
    completeAssault(saved, runtime.definition);
    expect(saved).toEqual(before);

    const advanced = applyFixtureCommand(runtime, saved, { type: "continue_round" });
    expect(advanced.encounter.result).toBeNull();
    expect(advanced.encounter.tick).toBe(0);
    expect(advanced.encounter.commandCursor).toEqual({ tick: 0, sequence: -1 });
    expect(advanced.encounter.events).toEqual(before.encounter.events);
    expect(advanced.encounter.definition.id).not.toBe(before.encounter.definition.id);
    expect(advanced.campaign.settledEncounterIds).toEqual([before.encounter.definition.id]);
    expect(runtime.save.decode(runtime.save.encode(advanced))).not.toBeNull();
  });

  it("rejects a receipt for the live encounter before it can suppress settlement", () => {
    const { runtime, state } = firstWaveFixture();
    state.campaign.settledEncounterIds.push(state.encounter.definition.id);
    expect(runtime.save.decode(runtime.save.encode(state))).toBeNull();
  });

  it("rejects a settled result whose reward receipt is missing", () => {
    const { runtime, state } = completedRound();
    state.campaign.settledEncounterIds = [];
    expect(runtime.save.decode(runtime.save.encode(state))).toBeNull();
  });

  it("rejects future authored encounter identities in tactical history", () => {
    const { runtime, state } = completedRound();
    const level = runtime.definition.levels.harkers_brace;
    state.encounter.events[0]!.encounterId = `${level.id}:${level.rounds[0]!.id}`;
    expect(runtime.save.decode(runtime.save.encode(state))).toBeNull();
  });

  it("rejects nonfinite result rewards before standalone serialization", () => {
    const { runtime, state } = completedRound();
    state.encounter.result = {
      ...state.encounter.result!,
      pendingMatter: Number.POSITIVE_INFINITY,
    };
    const core = createEncounterRuntime(campaignEncounterContext(state, runtime.definition));
    expect(() => core.save(state.encounter)).toThrow(/non-finite/);
    expect(runtime.save.decode(runtime.save.encode(state))).toBeNull();
  });
});

describe("campaign retry identity", () => {
  it("restores the current round and retains earlier settlement receipts", () => {
    const { runtime, state } = completedRound();
    const build = applyFixtureCommand(runtime, state, { type: "continue_round" });
    const assault = applyFixtureCommand(runtime, build, { type: "start_assault" });
    assault.encounter.coreIntegrity = 0;
    finishEncounter(assault.encounter, "defeat");
    assault.phase = "defeat";
    const retry = applyFixtureCommand(runtime, assault, { type: "retry_level" });
    expect(retry.phase).toBe("build");
    expect(retry.campaign.roundIndex).toBe(1);
    expect(retry.campaign.settledEncounterIds).toEqual(state.campaign.settledEncounterIds);
    expect(retry.encounter.matter).toBe(build.encounter.matter);
    expect(retry.campaign.retryCount).toBe(1);
    expect(runtime.save.decode(runtime.save.encode(retry))).not.toBeNull();
  });

  it("rejects a checkpoint from another site before retry can replace campaign progress", () => {
    const { runtime, state } = firstWaveFixture();
    const assault = applyFixtureCommand(runtime, state, { type: "start_assault" });
    const otherSite = applyFixtureCommand(runtime, runtime.createScenario("harkers_brace"), {
      type: "begin_level",
    });
    assault.campaign.operationCheckpoint = runtime.save.encode(otherSite);
    assault.encounter.coreIntegrity = 0;
    finishEncounter(assault.encounter, "defeat");
    assault.phase = "defeat";
    expect(runtime.save.decode(runtime.save.encode(assault))).toBeNull();
  });
});

describe("campaign departure", () => {
  it("keeps a travel save valid when the final site tower attack is still visible", () => {
    const fixture = firstWaveFixture();
    const { runtime } = fixture;
    let state = applyFixtureCommand(runtime, fixture.state, {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    });
    state = settleRound(runtime, state);
    while (state.phase === "round_result") {
      state = settleRound(runtime, applyFixtureCommand(runtime, state, { type: "continue_round" }));
    }
    expect(state.phase).toBe("level_complete");
    const tower = Object.values(state.encounter.towers)[0]!;
    state.encounter.towerAttacks.push({
      id: state.encounter.nextTowerAttackId++,
      towerId: tower.id,
      strategy: "hitscan",
      source: tower.placement.firingOrigin,
      target: tower.placement.firingOrigin,
      targetEnemyIds: [],
      startedAt: state.encounter.elapsed,
      expiresAt: state.encounter.elapsed + 0.2,
      damage: 0,
      killedEnemyIds: [],
    });
    expect(runtime.validate(state)).toEqual([]);
    const travel = applyFixtureCommand(runtime, state, { type: "start_next_level" });
    expect(travel.encounter.towers[tower.id]).toBeUndefined();
    expect(runtime.validate(travel)).toEqual([]);
    expect(runtime.save.decode(runtime.save.encode(travel))).not.toBeNull();
  });
});
