/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../application/store";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { commandDecision } from "../presentation/selectors";
import { commandRejectionCopy } from "../presentation/commandCopy";
import { guideDefinitionFor } from "../tutorial/guideModel";
import { FacilityManual } from "./manual/FacilityManual";
import { NoticeToast } from "./Modals";
import { PhaseBanner } from "./PhaseBanner";
import { EquipmentSocket } from "./processControls/EquipmentControls";

const buildState = () =>
  DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("flash_point"), {
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
    const game = buildState();
    const guide = guideDefinitionFor(game);
    publish(game, guide ? [guide.dismissalId] : []);
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
    render(
      <>
        <EquipmentSocket roomId="furnace" socketId="socket_a" />
        <FacilityManual />
      </>
    );

    fireEvent.click(screen.getByTestId("open-equipment-build-furnace-socket_a"));
    const button = screen.getByTestId("install-furnace-socket_a-gas_agitator") as HTMLButtonElement;
    expect(decision.allowed).toBe(false);
    expect(button.disabled).toBe(true);
    expect(button.title).toBe(commandRejectionCopy(decision));
  });

  it("shows the complete equipment catalog with lesson choices disabled", () => {
    const game = DEFAULT_GAME_RUNTIME.execute(
      DEFAULT_GAME_RUNTIME.createScenario("make_the_reagent"),
      { type: "begin_level" }
    ).state;
    publish(game);
    render(
      <>
        <EquipmentSocket roomId="lower_intake" socketId="socket_a" />
        <FacilityManual />
      </>
    );

    fireEvent.click(screen.getByTestId("open-equipment-build-lower_intake-socket_a"));
    const membrane = screen.getByTestId(
      "install-lower_intake-socket_a-membrane_cell"
    ) as HTMLButtonElement;
    expect(membrane.disabled).toBe(false);
    for (const equipmentId of ["gas_agitator", "wet_contactor", "thermal_coil"] as const) {
      fireEvent.click(screen.getByTestId(`manual-equipment-choice-${equipmentId}`));
      const choice = screen.getByTestId(
        `install-lower_intake-socket_a-${equipmentId}`
      ) as HTMLButtonElement;
      expect(choice.disabled).toBe(true);
      expect(choice.title).toBe("The current operation keeps this option sealed.");
      expect(screen.getByText("The current operation keeps this option sealed.")).toBeTruthy();
    }
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
