import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "./runtime";

const flashPointWithAgitator = () => {
  let game = DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("flash_point"), {
    type: "begin_level",
  }).state;
  game = DEFAULT_GAME_RUNTIME.execute(game, {
    type: "install_equipment",
    roomId: "furnace",
    socketId: "socket_a",
    equipmentId: "gas_agitator",
  }).state;
  return game;
};

describe("conduit room effect", () => {
  it("reports the first-order OX-1 target response in both actuator directions", () => {
    const closed = flashPointWithAgitator();
    const opening = DEFAULT_GAME_RUNTIME.roomEffect.conduit(closed, "gas:core__furnace", true);
    const open = DEFAULT_GAME_RUNTIME.execute(closed, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    }).state;
    const closing = DEFAULT_GAME_RUNTIME.roomEffect.conduit(open, "gas:core__furnace", false);

    expect(opening).toMatchObject({ roomId: "furnace", tone: "increase" });
    expect(opening.scoreDelta).toBeGreaterThan(0);
    expect(closing).toMatchObject({ roomId: "furnace", tone: "decrease" });
    expect(closing.scoreDelta).toBeCloseTo(-opening.scoreDelta);
  });
});
