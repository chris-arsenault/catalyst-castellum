/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { clearSaveSlot, loadSaveSlots, saveGameSlot } from "./browserStorage";

beforeEach(() => window.localStorage.clear());

describe("save compatibility discovery", () => {
  it("keeps an older envelope visible and preserves its raw data", () => {
    const key = "catalyst-castellum:save:slot-1:v2";
    window.localStorage.setItem(key, '{"version":2,"game":"older game"}');
    expect(loadSaveSlots()["slot-1"]).toEqual({ id: "slot-1", status: "incompatible" });
    expect(window.localStorage.getItem(key)).toBe('{"version":2,"game":"older game"}');
  });

  it("distinguishes damaged current records from empty slots", () => {
    window.localStorage.setItem("catalyst-castellum:save:slot-1:v3", "not-json");
    expect(loadSaveSlots()["slot-1"]).toEqual({ id: "slot-1", status: "damaged" });
    expect(loadSaveSlots()["slot-2"]).toBeNull();
  });

  it("marks a different content identity as incompatible", () => {
    const game = DEFAULT_GAME_RUNTIME.createInitial();
    saveGameSlot("slot-1", game, {
      dismissedGuideIds: [],
      guidanceEnabled: true,
      guideEvidence: {},
    });
    const key = "catalyst-castellum:save:slot-1:v3";
    const stored = JSON.parse(window.localStorage.getItem(key)!);
    const encoded = JSON.parse(stored.game);
    encoded.pack.contentVersion -= 1;
    stored.game = JSON.stringify(encoded);
    window.localStorage.setItem(key, JSON.stringify(stored));
    expect(loadSaveSlots()["slot-1"]).toEqual({ id: "slot-1", status: "incompatible" });
  });

  it("explicit clearing removes every version of only the selected slot", () => {
    for (const version of [2, 3, 9])
      window.localStorage.setItem(`catalyst-castellum:save:slot-1:v${version}`, "saved");
    window.localStorage.setItem("catalyst-castellum:save:slot-2:v2", "neighbor");
    clearSaveSlot("slot-1");
    for (const version of [2, 3, 9])
      expect(window.localStorage.getItem(`catalyst-castellum:save:slot-1:v${version}`)).toBeNull();
    expect(loadSaveSlots()["slot-1"]).toBeNull();
    expect(window.localStorage.getItem("catalyst-castellum:save:slot-2:v2")).toBe("neighbor");
  });
});
