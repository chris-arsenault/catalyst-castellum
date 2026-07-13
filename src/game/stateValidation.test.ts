import { describe, expect, it } from "vitest";
import { encodeGame, decodeGame } from "./save";
import { createScenarioGame } from "./simulation";
import { validateGameState } from "./engine/stateValidation";
import { DEFAULT_GAME_RUNTIME } from "./runtime";

describe("semantic game-state validation", () => {
  it("accepts every authored scenario", () => {
    const levelIds = [
      "flash_point",
      "make_the_reagent",
      "acid_line",
      "stored_chlorine",
      "commissioning_exam",
    ] as const;
    for (const levelId of levelIds) {
      expect(validateGameState(createScenarioGame(levelId))).toEqual([]);
    }
  });

  it("rejects empty, disconnected, and out-of-bounds conduit routes", () => {
    const empty = createScenarioGame("flash_point");
    empty.gasConduits.core_furnace.route = [];
    expect(decodeGame(encodeGame(empty))).toBeNull();

    const disconnected = createScenarioGame("flash_point");
    disconnected.gasConduits.core_furnace.route.splice(1, 0, {
      column: 0,
      elevation: 0,
    });
    expect(decodeGame(encodeGame(disconnected))).toBeNull();

    const outOfBounds = createScenarioGame("flash_point");
    outOfBounds.gasConduits.core_furnace.route[0] = { column: -1, elevation: 0 };
    expect(decodeGame(encodeGame(outOfBounds))).toBeNull();
  });

  it("rejects cross-field campaign and room identity mismatches", () => {
    const campaign = createScenarioGame("flash_point");
    campaign.campaign.levelIndex = 4;
    expect(decodeGame(encodeGame(campaign))).toBeNull();

    const room = createScenarioGame("flash_point");
    room.rooms.furnace.id = "washlock";
    expect(decodeGame(encodeGame(room))).toBeNull();
  });

  it("rejects enabled uninstalled conduits and invalid next identities", () => {
    const conduit = createScenarioGame("flash_point");
    conduit.gasConduits.core_furnace.installed = false;
    conduit.gasConduits.core_furnace.enabled = true;
    expect(decodeGame(encodeGame(conduit))).toBeNull();

    const identity = createScenarioGame("flash_point");
    identity.nextEventId = 1;
    expect(decodeGame(encodeGame(identity))).toBeNull();
  });

  it("rejects wave state in phases that cannot own spawned enemies", () => {
    const invalidPrime = createScenarioGame("flash_point");
    invalidPrime.phase = "prime";
    invalidPrime.spawnCursor = 1;
    expect(validateGameState(invalidPrime)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "phase_invariant_invalid", path: "phase" }),
      ])
    );

    let assault = DEFAULT_GAME_RUNTIME.execute(createScenarioGame("flash_point"), {
      type: "begin_level",
    }).state;
    assault = DEFAULT_GAME_RUNTIME.execute(assault, { type: "start_prime" }).state;
    assault = DEFAULT_GAME_RUNTIME.execute(assault, { type: "start_assault" }).state;
    assault = DEFAULT_GAME_RUNTIME.step(assault, 1);
    expect(assault.enemies.length).toBeGreaterThan(0);
    assault.phase = "build";
    expect(validateGameState(assault)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "phase_invariant_invalid", path: "enemies" }),
      ])
    );
  });
});
