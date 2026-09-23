import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../config";
import { cloneGame } from "../engine/gameState";
import { createScenarioGame } from "../engine/scenarioState";
import { decodeGame, encodeGame } from "../persistence/saveCodec";
import { facilityModelFor } from "./derivedModel";

const freshGame = () => createScenarioGame("claim_8_delta", [], DEFAULT_GAME_DEFINITION);

describe("map-derived facility geometry", () => {
  it("carries only physical process topology on state at revision zero", () => {
    const state = freshGame();
    expect(state.encounter.map).not.toBe(DEFAULT_GAME_DEFINITION.map);
    expect(Object.keys(state.encounter.process.gasConduits)).toEqual([]);
    expect(state.encounter.mapRevision).toBe(0);
  });

  it("shares one derived model across clones because the map reference is shared", () => {
    const state = freshGame();
    const clone = cloneGame(state);
    expect(clone.encounter.map).toBe(state.encounter.map);
    expect(facilityModelFor(clone)).toBe(facilityModelFor(state));
  });

  it("round-trips the state's own map through the current save", () => {
    const state = freshGame();
    const decoded = decodeGame(encodeGame(state, DEFAULT_GAME_DEFINITION), DEFAULT_GAME_DEFINITION);
    expect(decoded).not.toBeNull();
    expect(decoded?.encounter.map).toEqual(state.encounter.map);
    expect(decoded?.encounter.mapRevision).toBe(0);
  });
});
