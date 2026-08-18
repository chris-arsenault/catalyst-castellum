/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../application/store";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { guideDefinitionFor } from "../tutorial/guideModel";
import { NoticeToast } from "./Modals";
import { PhaseBanner } from "./PhaseBanner";

const buildState = () =>
  DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta"), {
    type: "begin_level",
  }).state;

const publish = (game = buildState(), dismissedGuideIds: string[] = []): void => {
  act(() => {
    useGameStore.setState({
      initialized: true,
      activeSlotId: "slot-1",
      game,
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(game).focusRoomId,
      notice: null,
      dismissedGuideIds,
      showHelp: false,
      manualSection: "operations",
      equipmentBuildTarget: null,
      roomEffectPreview: null,
    });
  });
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("application decision and phase rendering", () => {
  it("starts an assault through the authoritative command path", () => {
    const game = buildState();
    const guide = guideDefinitionFor(game);
    publish(game, guide ? [guide.dismissalId] : []);
    render(<PhaseBanner />);

    const button = screen.getByTestId("start-assault") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(useGameStore.getState().game.phase).toBe("assault");
    expect(screen.queryByTestId("start-assault")).toBeNull();
  });

  it("surfaces and dismisses rejected-command notices", () => {
    publish();
    act(() => useGameStore.setState({ notice: "Test rejection" }));
    render(<NoticeToast />);

    const notice = screen.getByRole("button", { name: "Test rejection. Dismiss" });
    fireEvent.click(notice);
    expect(useGameStore.getState().notice).toBeNull();
  });

  it("shows the current formation and route during planning", () => {
    publish();
    render(<PhaseBanner />);

    const strip = screen.getByTestId("wave-forecast-strip");
    expect(within(strip).getByText("5 × Deckmouth")).toBeTruthy();
    expect(within(strip).getByText("Level 12")).toBeTruthy();
    expect(within(strip).getByText("Steady formation")).toBeTruthy();
    expect(within(strip).getByText("West Breach → Catalyst Core")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /wave forecast/i }));
    expect(screen.getByTestId("wave-forecast-details")).toBeTruthy();
    expect(screen.getByText("Enemy routes").nextElementSibling?.textContent).toBe("1");
  });
});
