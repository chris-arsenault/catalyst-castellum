/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useGameStore } from "../application/store";
import { SaveSlotScreen } from "./SaveSlotScreen";

vi.mock("./DebugCampaignLauncher", () => ({ DebugCampaignLauncher: () => null }));

beforeEach(() => useGameStore.setState(useGameStore.getInitialState(), true));
afterEach(cleanup);

describe("unavailable save recovery", () => {
  it("shows the retained slot and requires the existing replacement confirmation", () => {
    const startNewGame = vi.fn();
    useGameStore.setState({
      saveSlots: {
        "slot-1": { id: "slot-1", status: "incompatible" },
        "slot-2": null,
        "slot-3": null,
      },
      startNewGame,
    });
    render(<SaveSlotScreen />);
    expect(screen.getByText("DIFFERENT RULESET")).toBeDefined();
    expect(screen.queryByTestId("load-save-slot-1")).toBeNull();
    fireEvent.click(screen.getByTestId("overwrite-slot-1"));
    expect(startNewGame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cancel-overwrite-slot-1"));
    expect(startNewGame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("overwrite-slot-1"));
    fireEvent.click(screen.getByTestId("confirm-overwrite-slot-1"));
    expect(startNewGame).toHaveBeenCalledWith("slot-1", true);
  });

  it("selection alone keeps unavailable data and the active game unchanged", () => {
    const startNewGame = vi.fn();
    const initial = useGameStore.getState().game;
    useGameStore.setState({
      saveSlots: { "slot-1": { id: "slot-1", status: "damaged" }, "slot-2": null, "slot-3": null },
      startNewGame,
    });
    useGameStore.getState().selectSaveSlot("slot-1");
    expect(useGameStore.getState().game).toBe(initial);
    expect(useGameStore.getState().activeSlotId).toBeNull();
    expect(startNewGame).not.toHaveBeenCalled();
  });
});
