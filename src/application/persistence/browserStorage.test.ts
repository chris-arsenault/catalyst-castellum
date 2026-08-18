/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { clearSaveSlot, loadSaveSlot, loadSaveSlots, saveGameSlot } from "./browserStorage";
import { cancelScheduledGameSave, flushScheduledGameSave, scheduleGameSave } from "./saveScheduler";

const session = (dismissedGuideIds: string[], guidanceEnabled = true) => ({
  dismissedGuideIds,
  guidanceEnabled,
});

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
    const second = DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta");
    saveGameSlot("slot-1", first, session(["guide-a"]));
    saveGameSlot("slot-2", second, session([]));

    expect(loadSaveSlot("slot-1")).toMatchObject({
      id: "slot-1",
      dismissedGuideIds: ["guide-a"],
    });
    expect(loadSaveSlot("slot-1")?.game.campaign.levelId).toBe("morrow_pocket");
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("claim_8_delta");

    clearSaveSlot("slot-1");
    expect(loadSaveSlot("slot-1")).toBeNull();
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("claim_8_delta");
  });

  it("keeps each run's guidance choice with its slot", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta");
    saveGameSlot("slot-1", game, session([], false));
    saveGameSlot("slot-2", game, session([]));

    expect(loadSaveSlot("slot-1")?.guidanceEnabled).toBe(false);
    expect(loadSaveSlot("slot-2")?.guidanceEnabled).toBe(true);
  });

  it("rejects a malformed slot without affecting valid neighboring slots", () => {
    saveGameSlot("slot-2", DEFAULT_GAME_RUNTIME.createScenario("twelve_cask"), session([]));
    window.localStorage.setItem("catalyst-castellum:save:slot-1:v2", "not-json");

    const catalog = loadSaveSlots();
    expect(catalog["slot-1"]).toBeNull();
    expect(catalog["slot-2"]?.game.campaign.levelId).toBe("twelve_cask");
  });

  it("debounces repeated snapshots and persists the latest one to its named slot", () => {
    vi.useFakeTimers();
    const first = DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta");
    const latest = DEFAULT_GAME_RUNTIME.createScenario("morrow_pocket");
    scheduleGameSave("slot-3", first, session([]));
    scheduleGameSave("slot-3", latest, session(["complete"]));
    vi.advanceTimersByTime(749);
    expect(loadSaveSlot("slot-3")).toBeNull();
    vi.advanceTimersByTime(1);
    expect(loadSaveSlot("slot-3")?.game.campaign.levelId).toBe("morrow_pocket");
    expect(loadSaveSlot("slot-3")?.dismissedGuideIds).toEqual(["complete"]);
  });

  it("cancels stale pending state before a slot reset", () => {
    vi.useFakeTimers();
    scheduleGameSave(
      "slot-1",
      DEFAULT_GAME_RUNTIME.createScenario("harkers_brace"),
      session(["old"])
    );
    cancelScheduledGameSave("slot-1");
    clearSaveSlot("slot-1");
    vi.advanceTimersByTime(1000);
    expect(loadSaveSlot("slot-1")).toBeNull();
  });

  it("flushes pending state synchronously for page and menu lifecycle events", () => {
    vi.useFakeTimers();
    const game = DEFAULT_GAME_RUNTIME.createScenario("harkers_brace");
    scheduleGameSave("slot-2", game, session([]));
    flushScheduledGameSave();
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("harkers_brace");
    vi.advanceTimersByTime(750);
    expect(loadSaveSlot("slot-2")?.game.campaign.levelId).toBe("harkers_brace");
  });
});
