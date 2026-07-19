/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { clearSaveSlot, loadSaveSlot, loadSaveSlots, saveGameSlot } from "./browserStorage";
import { cancelScheduledGameSave, flushScheduledGameSave, scheduleGameSave } from "./saveScheduler";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  flushScheduledGameSave();
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("browser save-slot persistence", () => {
  it("round-trips and clears three isolated game-and-tutorial records", () => {
    const first = DEFAULT_GAME_RUNTIME.createScenario("morrow_pocket");
    const second = DEFAULT_GAME_RUNTIME.createScenario("flash_point");
    saveGameSlot("slot-1", first, ["guide-a"]);
    saveGameSlot("slot-2", second, []);

    expect(loadSaveSlot("slot-1")).toMatchObject({
      id: "slot-1",
      dismissedGuideIds: ["guide-a"],
    });
    expect(loadSaveSlot("slot-1")?.game.campaign.levelId).toBe("morrow_pocket");
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("flash_point");

    clearSaveSlot("slot-1");
    expect(loadSaveSlot("slot-1")).toBeNull();
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("flash_point");
  });

  it("rejects a malformed slot without affecting valid neighboring slots", () => {
    saveGameSlot("slot-2", DEFAULT_GAME_RUNTIME.createScenario("stored_chlorine"), []);
    window.localStorage.setItem("catalyst-castellum:save:slot-1:v1", "not-json");

    const catalog = loadSaveSlots();
    expect(catalog["slot-1"]).toBeNull();
    expect(catalog["slot-2"]?.game.campaign.levelId).toBe("stored_chlorine");
  });

  it("debounces repeated snapshots and persists the latest one to its named slot", () => {
    vi.useFakeTimers();
    const first = DEFAULT_GAME_RUNTIME.createScenario("flash_point");
    const latest = DEFAULT_GAME_RUNTIME.createScenario("morrow_pocket");
    scheduleGameSave("slot-3", first, []);
    scheduleGameSave("slot-3", latest, ["complete"]);
    vi.advanceTimersByTime(749);
    expect(loadSaveSlot("slot-3")).toBeNull();
    vi.advanceTimersByTime(1);
    expect(loadSaveSlot("slot-3")?.game.campaign.levelId).toBe("morrow_pocket");
    expect(loadSaveSlot("slot-3")?.dismissedGuideIds).toEqual(["complete"]);
  });

  it("cancels stale pending state before a slot reset", () => {
    vi.useFakeTimers();
    scheduleGameSave("slot-1", DEFAULT_GAME_RUNTIME.createScenario("make_the_reagent"), ["old"]);
    cancelScheduledGameSave("slot-1");
    clearSaveSlot("slot-1");
    vi.advanceTimersByTime(1000);
    expect(loadSaveSlot("slot-1")).toBeNull();
  });

  it("flushes pending state synchronously for page and menu lifecycle events", () => {
    vi.useFakeTimers();
    const game = DEFAULT_GAME_RUNTIME.createScenario("make_the_reagent");
    scheduleGameSave("slot-2", game, []);
    flushScheduledGameSave();
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("make_the_reagent");
    vi.advanceTimersByTime(750);
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("make_the_reagent");
  });
});
