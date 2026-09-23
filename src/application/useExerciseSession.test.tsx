/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCatalystExerciseRuntime } from "../game/exercise";
import { createTranslator } from "../localization/translator";
import { EN_LOCALE } from "../localization/locales/en";
import { EXERCISE_SAVE_KEY, loadExerciseSession } from "./exerciseStorage";
import { useExerciseSession } from "./useExerciseSession";

const runtime = createCatalystExerciseRuntime();
const translator = createTranslator(EN_LOCALE);
const storageFixture = (raw: string | null = null) => {
  const values = new Map<string, string>([["campaign-sentinel", "retained"]]);
  if (raw !== null) values.set(EXERCISE_SAVE_KEY, raw);
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
};
const place = {
  type: "place_tower",
  chassisId: "flash_chamber",
  anchor: { column: 7, elevation: 7 },
  mountFace: "left_wall",
  orientation: "right",
} as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("exercise session persistence", () => {
  it("persists defenses, guidance, and durable observations under the exercise key", () => {
    const storage = storageFixture();
    const first = renderHook(() => useExerciseSession(runtime, translator, storage));
    act(() => {
      expect(first.result.current.dispatch(place)).toBe(true);
    });
    const towerId = Object.keys(first.result.current.currentEncounter().towers)[0]!;
    act(() => first.result.current.setInteraction({ kind: "inspect", towerId }));
    act(() => first.result.current.setInteraction({ kind: "inspect", towerId: null }));
    act(() => first.result.current.setGuidance(false));
    act(() => vi.advanceTimersByTime(300));
    const encoded = storage.values.get(EXERCISE_SAVE_KEY)!;
    expect(loadExerciseSession(encoded, runtime)?.evidence).toContain("coverage");
    expect(storage.values.get("campaign-sentinel")).toBe("retained");
    expect(storage.setItem.mock.calls.every(([key]) => key === EXERCISE_SAVE_KEY)).toBe(true);
    const before = first.result.current.currentEncounter();
    first.unmount();
    const restored = renderHook(() => useExerciseSession(runtime, translator, storage));
    expect(restored.result.current.currentEncounter()).toEqual(before);
    expect(restored.result.current.session?.guidance).toBe(false);
    expect(restored.result.current.session?.evidence).toContain("coverage");
  });

  it("preserves an invalid save until explicit fresh start", () => {
    const storage = storageFixture("{broken");
    const { result } = renderHook(() => useExerciseSession(runtime, translator, storage));
    expect(result.current.session).toBeNull();
    act(() => {
      expect(result.current.dispatch({ type: "start_assault" })).toBe(false);
    });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.values.get(EXERCISE_SAVE_KEY)).toBe("{broken");
    act(() => result.current.startFresh());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.session?.state.encounter.phase).toBe("build");
    expect(loadExerciseSession(storage.values.get(EXERCISE_SAVE_KEY)!, runtime)).not.toBeNull();
  });

  it("keeps accepted actions available when storage writes fail", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    const { result } = renderHook(() => useExerciseSession(runtime, translator, storage));
    act(() => {
      expect(result.current.dispatch(place)).toBe(true);
    });
    act(() => vi.advanceTimersByTime(300));
    expect(Object.keys(result.current.currentEncounter().towers)).toHaveLength(1);
    expect(result.current.saveFailed).toBe(true);
  });
});

describe("exercise application clock and retry", () => {
  it("retains fractional time across pause and applies speed only at the application boundary", () => {
    const storage = storageFixture();
    const { result } = renderHook(() => useExerciseSession(runtime, translator, storage));
    act(() => result.current.dispatch({ type: "start_assault" }));
    act(() => result.current.tick(0.05));
    expect(result.current.currentEncounter().tick).toBe(0);
    act(() => result.current.setPaused(true));
    act(() => result.current.tick(10));
    expect(result.current.currentEncounter().tick).toBe(0);
    act(() => {
      result.current.setSpeed(2);
      result.current.setPaused(false);
    });
    act(() => result.current.tick(0.025));
    expect(result.current.currentEncounter().tick).toBe(1);
    expect(result.current.currentEncounter()).not.toHaveProperty("speed");
    expect(result.current.currentEncounter()).not.toHaveProperty("paused");
  });

  it("ignores invalid wall time without poisoning later valid ticks", () => {
    const storage = storageFixture();
    const { result } = renderHook(() => useExerciseSession(runtime, translator, storage));
    act(() => result.current.dispatch({ type: "start_assault" }));
    for (const seconds of [NaN, Infinity, -Infinity, -0.1, 0])
      act(() => result.current.tick(seconds));
    expect(result.current.currentEncounter().tick).toBe(0);
    act(() => result.current.tick(0.1));
    expect(result.current.currentEncounter().tick).toBe(1);
  });

  it("retry restores purchases and clears timing debt; restart clears observations", () => {
    const storage = storageFixture();
    const { result } = renderHook(() => useExerciseSession(runtime, translator, storage));
    act(() => result.current.dispatch(place));
    const towerId = Object.keys(result.current.currentEncounter().towers)[0]!;
    act(() => result.current.setInteraction({ kind: "inspect", towerId }));
    const prepared = structuredClone(result.current.currentEncounter());
    act(() => result.current.dispatch({ type: "start_assault" }));
    act(() => result.current.tick(0.15));
    act(() => result.current.setPaused(true));
    act(() => result.current.dispatch({ type: "retry_wave" }));
    expect(result.current.currentEncounter()).toEqual(prepared);
    expect(result.current.paused).toBe(false);
    expect(result.current.interaction).toEqual({ kind: "inspect", towerId: null });
    expect(result.current.session?.evidence).toContain("coverage");
    act(() => result.current.dispatch({ type: "start_assault" }));
    act(() => result.current.tick(0.05));
    expect(result.current.currentEncounter().tick).toBe(0);
    act(() => result.current.dispatch({ type: "restart_exercise" }));
    expect(result.current.session?.evidence).toEqual([]);
    expect(Object.keys(result.current.currentEncounter().towers)).toEqual([]);
  });
});
