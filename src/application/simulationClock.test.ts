import { createStore } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { DEFAULT_GAME_PRESENTATION } from "../presentation/services";
import { emptySaveSlotCatalog } from "./saveSlots";
import { createGameStoreState } from "./store";
import { accumulateSimulationTicks } from "./simulationClock";

const fixture = () => {
  const runtime = {
    ...DEFAULT_GAME_RUNTIME,
    advanceTicks: vi.fn(DEFAULT_GAME_RUNTIME.advanceTicks),
  };
  const scheduleSave = vi.fn();
  const store = createStore(
    createGameStoreState({
      runtime,
      presentation: DEFAULT_GAME_PRESENTATION,
      loadSlots: emptySaveSlotCatalog,
      clearSlot: vi.fn(),
      scheduleSave,
      cancelSave: vi.fn(),
      flushSave: vi.fn(),
    })
  );
  store.getState().initialize();
  store.getState().startNewGame("slot-1");
  store.getState().dispatch({ type: "begin_level" });
  store.getState().dispatch({ type: "start_assault" });
  scheduleSave.mockClear();
  return { store, runtime, scheduleSave };
};

describe("application simulation controls", () => {
  it("applies pause and speed immediately without changing or saving core state", () => {
    const { store, runtime, scheduleSave } = fixture();
    const game = store.getState().game;
    expect(store.getState().dispatch({ type: "set_pause", paused: true })).toBe(true);
    expect(store.getState().paused).toBe(true);
    store.getState().tick(0.5);
    expect(runtime.advanceTicks).not.toHaveBeenCalled();
    expect(store.getState().dispatch({ type: "set_speed", speed: 2 })).toBe(true);
    expect(store.getState().speed).toBe(2);
    expect(store.getState().game).toBe(game);
    expect(scheduleSave).not.toHaveBeenCalled();
    store.getState().dispatch({ type: "toggle_pause" });
    store.getState().tick(0.1);
    expect(runtime.advanceTicks).toHaveBeenCalledWith(game, 2);
    expect(store.getState().game.encounter.tick).toBe(game.encounter.tick + 2);
  });

  it("retains fractional active time and sends exact integer ticks", () => {
    const { store, runtime } = fixture();
    const game = store.getState().game;
    for (const dt of [0.03, 0.03, 0.03]) store.getState().tick(dt);
    expect(runtime.advanceTicks).not.toHaveBeenCalled();
    store.getState().tick(0.01);
    expect(runtime.advanceTicks).toHaveBeenCalledExactlyOnceWith(game, 1);
    expect(store.getState().simulationRemainder).toBeCloseTo(0);
    const current = store.getState().game;
    for (const dt of [Number.NaN, Infinity, -1, 0]) store.getState().tick(dt);
    expect(store.getState().game).toBe(current);
    expect(runtime.advanceTicks).toHaveBeenCalledTimes(1);
  });

  it("resets application time controls when opening another run", () => {
    const { store } = fixture();
    store.getState().tick(0.03);
    store.getState().dispatch({ type: "set_speed", speed: 2 });
    store.getState().dispatch({ type: "set_pause", paused: true });
    store.getState().startNewGame("slot-2");
    expect(store.getState()).toMatchObject({ paused: false, speed: 1, simulationRemainder: 0 });
    expect(store.getState().dispatch({ type: "toggle_pause" })).toBe(false);
    expect(store.getState().game).not.toHaveProperty("paused");
    expect(store.getState().game).not.toHaveProperty("speed");
    expect(store.getState().game.encounter).not.toHaveProperty("simulationRemainder");
  });
});

describe("wall-time conversion", () => {
  it("bounds a delayed browser callback before applying the selected speed", () => {
    expect(accumulateSimulationTicks(0, 30, 2)).toEqual({ ticks: 10, remainder: 0 });
    expect(accumulateSimulationTicks(0.09, 0.01, 1).ticks).toBe(1);
  });
});
