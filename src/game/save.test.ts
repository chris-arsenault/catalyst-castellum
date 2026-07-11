import { describe, expect, it } from "vitest";
import { createInitialGame } from "./simulation";
import { decodeGame, encodeGame } from "./save";

describe("versioned save boundary", () => {
  it("round-trips a valid game state", () => {
    const game = createInitialGame();
    game.rooms.reservoir.liquid.acid = 31;
    const restored = decodeGame(encodeGame(game));

    expect(restored).not.toBeNull();
    expect(restored?.rooms.reservoir.liquid.acid).toBe(31);
    expect(restored?.version).toBe(1);
  });

  it("rejects malformed or incompatible saves", () => {
    expect(decodeGame("{broken")).toBeNull();
    expect(
      decodeGame(
        JSON.stringify({ format: "catalyst-castellum-save", savedAt: "now", game: { version: 2 } })
      )
    ).toBeNull();
  });
});
