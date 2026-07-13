/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../application/store";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { commandDecision } from "../presentation/selectors";
import { NoticeToast } from "./Modals";
import { PhaseBanner } from "./PhaseBanner";
import { EquipmentSocket } from "./processControls/EquipmentControls";

const buildState = () =>
  DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("flash_point"), {
    type: "begin_level",
  }).state;

const publish = (game = buildState()): void => {
  act(() => {
    useGameStore.setState({
      initialized: true,
      activeSlotId: "slot-1",
      game,
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(game).focusRoomId,
      notice: null,
    });
  });
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("application decision and phase rendering", () => {
  it("renders and executes the phase action through the authoritative command path", () => {
    vi.useFakeTimers();
    publish();
    render(<PhaseBanner />);

    const button = screen.getByTestId("begin-prime") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(useGameStore.getState().game.phase).toBe("prime");
    expect(screen.getByTestId("start-assault")).toBeTruthy();
  });

  it("renders the same rejection reason and availability produced by command evaluation", () => {
    const game = buildState();
    game.matter = 0;
    publish(game);
    const command = {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    } as const;
    const decision = commandDecision(game, command);
    render(<EquipmentSocket roomId="furnace" socketId="socket_a" />);

    const button = screen.getByTestId("install-furnace-socket_a-gas_agitator") as HTMLButtonElement;
    expect(decision.allowed).toBe(false);
    expect(button.disabled).toBe(true);
    expect(button.title).toBe(decision.reason);
  });

  it("surfaces and dismisses rejected-command notices", () => {
    publish();
    act(() => useGameStore.setState({ notice: "Test rejection" }));
    render(<NoticeToast />);

    const notice = screen.getByRole("button", { name: "Test rejection. Dismiss" });
    fireEvent.click(notice);
    expect(useGameStore.getState().notice).toBeNull();
    expect(screen.queryByRole("button", { name: "Test rejection. Dismiss" })).toBeNull();
  });
});
