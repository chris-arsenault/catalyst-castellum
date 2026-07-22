/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../application/store";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { usePipeRoomEffectHover } from "./usePipeRoomEffectHover";

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

afterEach(() => {
  cleanup();
  act(() => useGameStore.getState().setRoomEffectPreview(null));
});

describe("map pipe room-effect hover", () => {
  it("marks the target room immediately for the pipe's available toggle action", () => {
    const game = flashPointWithAgitator();
    const onHoverRun = vi.fn();
    const { result } = renderHook(() => usePipeRoomEffectHover(game, onHoverRun));

    act(() => result.current("gas:core__furnace"));

    expect(onHoverRun).toHaveBeenCalledWith("gas:core__furnace");
    expect(useGameStore.getState().roomEffectPreview).toEqual({
      connectionId: "gas:core__furnace",
      rooms: { furnace: "increase" },
    });

    act(() => result.current(null));
    expect(useGameStore.getState().roomEffectPreview).toBeNull();
  });

  it("flips to the closing effect when the hovered pipe opens", () => {
    const initialGame = flashPointWithAgitator();
    const onHoverRun = vi.fn();
    const { result, rerender } = renderHook(
      ({ game }) => usePipeRoomEffectHover(game, onHoverRun),
      { initialProps: { game: initialGame } }
    );

    act(() => result.current("gas:core__furnace"));
    expect(useGameStore.getState().roomEffectPreview).toEqual({
      connectionId: "gas:core__furnace",
      rooms: { furnace: "increase" },
    });

    const openGame = DEFAULT_GAME_RUNTIME.execute(initialGame, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    }).state;
    rerender({ game: openGame });

    expect(useGameStore.getState().roomEffectPreview).toEqual({
      connectionId: "gas:core__furnace",
      rooms: { furnace: "decrease" },
    });
  });

  it("clears the marker on unmount", () => {
    const game = flashPointWithAgitator();
    const { result, unmount } = renderHook(() => usePipeRoomEffectHover(game, vi.fn()));

    act(() => result.current("gas:core__furnace"));
    unmount();
    expect(useGameStore.getState().roomEffectPreview).toBeNull();
  });

  it("keeps room markers clear when the pipe action is unavailable", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("flash_point");
    const onHoverRun = vi.fn();
    const { result } = renderHook(() => usePipeRoomEffectHover(game, onHoverRun));

    act(() => result.current("gas:core__furnace"));

    expect(onHoverRun).toHaveBeenCalledWith("gas:core__furnace");
    expect(useGameStore.getState().roomEffectPreview).toBeNull();
  });
});
