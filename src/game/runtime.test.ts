import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { createGameRuntime } from "./runtime";

describe("game runtime", () => {
  it("binds all public transitions and queries to one immutable definition", () => {
    const alternateDefinition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "runtime-test",
      rooms: {
        ...DEFAULT_GAME_DEFINITION.rooms,
        furnace: { ...DEFAULT_GAME_DEFINITION.rooms.furnace, ambientTemperature: 44 },
      },
    });
    const runtime = createGameRuntime(alternateDefinition);
    const briefing = runtime.createScenario("flash_point");

    expect(runtime.definition.id).toBe("runtime-test");
    expect(briefing.rooms.furnace.temperature).toBe(44);
    expect(runtime.validate(briefing)).toEqual([]);
    expect(runtime.level(briefing).id).toBe("flash_point");
    expect(runtime.round(briefing).id).toBe("first_spark");
    expect(runtime.evaluate(briefing, { type: "begin_level" }).allowed).toBe(true);
    expect(runtime.execute(briefing, { type: "begin_level" }).state.phase).toBe("build");
    expect(Object.isFrozen(runtime)).toBe(true);
    expect(Object.isFrozen(runtime.definition.rooms.furnace)).toBe(true);
  });
});
