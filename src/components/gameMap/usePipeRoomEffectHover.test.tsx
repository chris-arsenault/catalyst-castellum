/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../application/store";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { usePipeRoomEffectHover } from "./usePipeRoomEffectHover";

const processSiteWithAgitator = () => {
  let game = DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("cordon_41"), {
    type: "begin_level",
  }).state;
  const rounds = DEFAULT_GAME_RUNTIME.definition.levels.cordon_41.rounds;
  const round = rounds.at(-1)!;
  game.campaign.roundIndex = rounds.length - 1;
  game.availability = {
    towers: [...round.availability.towers],
    equipment: [...round.availability.equipment],
    gasLines: [...round.availability.gasLines],
    liquidLines: [...round.availability.liquidLines],
  };
  game.matter = 999;
  game = DEFAULT_GAME_RUNTIME.execute(game, {
    type: "build_connection",
    kind: "gas_line",
    fromRoomId: "core",
    toRoomId: "furnace",
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
    const game = processSiteWithAgitator();
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
    const initialGame = processSiteWithAgitator();
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
    const game = processSiteWithAgitator();
    const { result, unmount } = renderHook(() => usePipeRoomEffectHover(game, vi.fn()));

    act(() => result.current("gas:core__furnace"));
    unmount();
    expect(useGameStore.getState().roomEffectPreview).toBeNull();
  });

  it("keeps room markers clear when the pipe action is unavailable", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta");
    const onHoverRun = vi.fn();
    const { result } = renderHook(() => usePipeRoomEffectHover(game, onHoverRun));

    act(() => result.current("gas:core__furnace"));

    expect(onHoverRun).toHaveBeenCalledWith("gas:core__furnace");
    expect(useGameStore.getState().roomEffectPreview).toBeNull();
  });
});
