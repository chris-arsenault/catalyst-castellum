/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { encodeGame } from "../../game/save";
import { saveDismissedGuideIds } from "../../tutorial/guideProgress";
import {
  LEGACY_UNSLOTTED_SAVE_KEYS,
  clearSaveSlot,
  loadSaveSlot,
  loadSaveSlots,
  saveGameSlot,
} from "./browserStorage";
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
    const first = DEFAULT_GAME_RUNTIME.createScenario("commissioning_exam");
    const second = DEFAULT_GAME_RUNTIME.createScenario("flash_point");
    saveGameSlot("slot-1", first, ["guide-a"]);
    saveGameSlot("slot-2", second, []);

    expect(loadSaveSlot("slot-1")).toMatchObject({
      id: "slot-1",
      dismissedGuideIds: ["guide-a"],
    });
    expect(loadSaveSlot("slot-1")?.game.campaign.levelId).toBe("commissioning_exam");
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

  it("migrates the old single save and global tutorial record into slot one once", () => {
    const legacy = DEFAULT_GAME_RUNTIME.createScenario("make_the_reagent");
    window.localStorage.setItem(LEGACY_UNSLOTTED_SAVE_KEYS[0], encodeGame(legacy));
    saveDismissedGuideIds(["legacy-guide"]);

    const catalog = loadSaveSlots();
    expect(catalog["slot-1"]?.game.campaign.levelId).toBe("make_the_reagent");
    expect(catalog["slot-1"]?.dismissedGuideIds).toEqual(["legacy-guide"]);
    expect(window.localStorage.getItem(LEGACY_UNSLOTTED_SAVE_KEYS[0])).toBeNull();
  });

  it("debounces repeated snapshots and persists the latest one to its named slot", () => {
    vi.useFakeTimers();
    const first = DEFAULT_GAME_RUNTIME.createScenario("flash_point");
    const latest = DEFAULT_GAME_RUNTIME.createScenario("commissioning_exam");
    scheduleGameSave("slot-3", first, []);
    scheduleGameSave("slot-3", latest, ["complete"]);
    vi.advanceTimersByTime(749);
    expect(loadSaveSlot("slot-3")).toBeNull();
    vi.advanceTimersByTime(1);
    expect(loadSaveSlot("slot-3")?.game.campaign.levelId).toBe("commissioning_exam");
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
