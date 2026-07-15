import { describe, expect, it } from "vitest";
import { createScenarioGame } from "../simulation";
import { gasConduitState, instance, roomState } from "./instances";

describe("instance-keyed world access", () => {
  it("returns present instances", () => {
    const game = createScenarioGame("flash_point");
    expect(roomState(game, "furnace").id).toBe("furnace");
    expect(gasConduitState(game, "gas:core__furnace").installed).toBe(true);
    expect(instance({ a: 1 }, "a", "sample")).toBe(1);
  });

  it("throws loudly for unknown instance ids", () => {
    const game = createScenarioGame("flash_point");
    expect(() => roomState(game, "no-such-room")).toThrow("Unknown room instance: no-such-room");
    expect(() => instance({}, "ghost", "sample")).toThrow("Unknown sample instance: ghost");
  });
});
