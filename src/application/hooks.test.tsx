/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "./store";
import { useSimulationClock } from "./hooks";

const initial = useGameStore.getState();
afterEach(() => {
  cleanup();
  useGameStore.setState(initial, true);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("browser simulation clock", () => {
  it("forwards wall time and restarts its timestamp after pause or speed changes", () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const tick = vi.fn();
    useGameStore.setState({
      game: { ...initial.game, phase: "assault" },
      initialized: true,
      activeSlotId: "slot-1",
      paused: false,
      speed: 1,
      tick,
    });
    renderHook(useSimulationClock);
    act(() => {
      now = 50;
      vi.advanceTimersByTime(50);
    });
    expect(tick).toHaveBeenLastCalledWith(0.05);
    act(() => useGameStore.setState({ paused: true }));
    act(() => {
      now = 5050;
      vi.advanceTimersByTime(5000);
    });
    expect(tick).toHaveBeenCalledTimes(1);
    act(() => useGameStore.setState({ paused: false, speed: 2 }));
    act(() => {
      now = 5100;
      vi.advanceTimersByTime(50);
    });
    expect(tick).toHaveBeenCalledTimes(2);
    expect(tick).toHaveBeenLastCalledWith(0.05);
  });
});
