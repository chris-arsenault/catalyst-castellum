/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useGameStore } from "../application/store";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { FeedstockStrip } from "./FeedstockStrip";

afterEach(cleanup);

describe("site supply controls", () => {
  it("renders the current site's offers and charges their authored packet", () => {
    const game = DEFAULT_GAME_RUNTIME.execute(
      DEFAULT_GAME_RUNTIME.createScenario("morrow_pocket"),
      { type: "begin_level" }
    ).state;
    const water = game.liquidSources.liquid_reservoir_a;
    if (!water) throw new Error("Morrow Pocket liquid reservoir is missing.");
    water.liquid.water = 0;
    act(() => useGameStore.setState({ game, activeSlotId: "slot-1" }));

    render(<FeedstockStrip />);

    expect(screen.getByTestId("supply-dock").textContent).toContain("Gas reservoir");
    expect(screen.getByTestId("supply-dock").textContent).toContain("H₂ + O₂");
    fireEvent.click(screen.getByRole("button", { name: "Restock Liquid reservoir A" }));

    expect(useGameStore.getState().game.liquidSources.liquid_reservoir_a?.liquid.water).toBe(28);
    expect(useGameStore.getState().game.matter).toBe(game.matter - 7);
  });
});
