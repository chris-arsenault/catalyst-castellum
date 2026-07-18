import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../config";
import { cloneGame } from "../engine/roomState";
import { createScenarioGame } from "../engine/scenarioState";
import { decodeGame, encodeGame } from "../persistence/saveCodec";
import { facilityModelFor } from "./derivedModel";

const freshGame = () => createScenarioGame("flash_point", [], DEFAULT_GAME_DEFINITION);

describe("map-derived facility geometry", () => {
  it("carries only physical process topology on state at revision zero", () => {
    const state = freshGame();
    expect(state.map).not.toBe(DEFAULT_GAME_DEFINITION.map);
    expect(Object.keys(state.gasConduits)).toEqual(["gas:core__furnace"]);
    expect(state.mapRevision).toBe(0);
  });

  it("shares one derived model across clones because the map reference is shared", () => {
    const state = freshGame();
    const clone = cloneGame(state);
    expect(clone.map).toBe(state.map);
    expect(facilityModelFor(clone)).toBe(facilityModelFor(state));
  });

  it("round-trips the state's own map through the current save", () => {
    const state = freshGame();
    const decoded = decodeGame(encodeGame(state, DEFAULT_GAME_DEFINITION), DEFAULT_GAME_DEFINITION);
    expect(decoded).not.toBeNull();
    expect(decoded?.map).toEqual(state.map);
    expect(decoded?.mapRevision).toBe(0);
  });
});
