/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../application/store";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { TopBar } from "./TopBar";

vi.mock("./ShellControls", () => ({
  AudioControls: () => null,
  BrandLockup: () => null,
  EncyclopediaButton: () => null,
  SaveSlotsButton: () => null,
}));

const initial = useGameStore.getState();
afterEach(() => {
  cleanup();
  useGameStore.setState(initial, true);
});

describe("simulation controls", () => {
  it("updates pause and speed through application commands before a simulation tick", () => {
    const ready = DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createInitial(), {
      type: "begin_level",
    }).state;
    const game = DEFAULT_GAME_RUNTIME.execute(ready, { type: "start_assault" }).state;
    useGameStore.setState({
      game,
      initialized: true,
      activeSlotId: "slot-1",
      paused: false,
      speed: 1,
    });
    render(<TopBar />);
    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(useGameStore.getState().paused).toBe(true);
    expect(screen.getByRole("button", { name: "Resume simulation" })).toBeTruthy();
    fireEvent.click(screen.getByTestId("simulation-speed"));
    expect(useGameStore.getState().speed).toBe(2);
    expect(screen.getByTestId("simulation-speed").textContent).toContain("2×");
    expect(useGameStore.getState().game).toBe(game);
  });
});
