import { describe, expect, it } from "vitest";
import { createScenarioGame } from "../simulation";
import { instance, roomState } from "./instances";

describe("instance-keyed world access", () => {
  it("returns present instances", () => {
    const game = createScenarioGame("claim_8_delta");
    expect(roomState(game, "furnace").id).toBe("furnace");
    expect(game.world.connections).toEqual(Object.keys(game.map.connections));
    expect(instance({ a: 1 }, "a", "sample")).toBe(1);
  });

  it("throws loudly for unknown instance ids", () => {
    const game = createScenarioGame("claim_8_delta");
    expect(() => roomState(game, "no-such-room")).toThrow("Unknown room instance: no-such-room");
    expect(() => instance({}, "ghost", "sample")).toThrow("Unknown sample instance: ghost");
  });
});
