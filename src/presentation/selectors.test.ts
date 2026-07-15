import { describe, expect, it } from "vitest";
import { createInitialGame } from "../game/simulation";
import { commandDecision, roomAnalysis } from "./selectors";
import { roomState } from "../game/world/instances";

describe("snapshot selectors", () => {
  it("reuses room analysis for one immutable room snapshot", () => {
    const room = roomState(createInitialGame(), "furnace");
    expect(roomAnalysis(room)).toBe(roomAnalysis(room));
  });

  it("reuses equivalent command decisions for one game snapshot", () => {
    const game = createInitialGame();
    expect(commandDecision(game, { type: "begin_level" })).toBe(
      commandDecision(game, { type: "begin_level" })
    );
  });
});
