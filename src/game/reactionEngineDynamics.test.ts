import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "./runtime";

const enterFlashPoint = () =>
  DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("flash_point"), {
    type: "begin_level",
  }).state;

describe("reaction-engine dynamics", () => {
  it("measures live process change without depending on an enemy outcome", () => {
    let game = enterFlashPoint();
    game = DEFAULT_GAME_RUNTIME.execute(game, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    }).state;
    game = DEFAULT_GAME_RUNTIME.execute(game, { type: "start_prime" }).state;
    const previous = DEFAULT_GAME_RUNTIME.reactionEngine.sample(game);
    const current = DEFAULT_GAME_RUNTIME.reactionEngine.sample(DEFAULT_GAME_RUNTIME.step(game, 1));
    const dynamics = DEFAULT_GAME_RUNTIME.reactionEngine.dynamics(previous, current);

    expect(dynamics).not.toBeNull();
    expect(dynamics?.changeRate).toBeGreaterThan(0);
    expect(dynamics?.homeostasis).toBeGreaterThanOrEqual(0);
    expect(dynamics?.homeostasis).toBeLessThanOrEqual(1);
    expect(dynamics?.activeRoomCount).toBeGreaterThan(0);
    expect(dynamics?.primingLineCount).toBeGreaterThan(0);
  });

  it("treats an unchanged engine sample as homeostatic", () => {
    const game = enterFlashPoint();
    const previous = DEFAULT_GAME_RUNTIME.reactionEngine.sample(game);
    const current = { ...previous, elapsed: previous.elapsed + 1 };
    const dynamics = DEFAULT_GAME_RUNTIME.reactionEngine.dynamics(previous, current);

    expect(dynamics).toMatchObject({ change: "low", changeRate: 0, homeostasis: 1 });
  });
});
