// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("audio settings", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  it("provides defaults when storage is empty", async () => {
    const { getAudioSettings } = await import("./settings");
    expect(getAudioSettings()).toEqual({ muted: false, musicVolume: 0.7, sfxVolume: 0.8 });
  });

  it("persists updates and notifies subscribers", async () => {
    const { getAudioSettings, setMusicVolume, setMuted, subscribeAudioSettings } =
      await import("./settings");
    const listener = vi.fn();
    subscribeAudioSettings(listener);

    setMusicVolume(0.25);
    setMuted(true);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getAudioSettings().musicVolume).toBeCloseTo(0.25, 9);
    expect(getAudioSettings().muted).toBe(true);

    const stored = JSON.parse(window.localStorage.getItem("castellum.audio.v1") ?? "{}");
    expect(stored.musicVolume).toBeCloseTo(0.25, 9);
    expect(stored.muted).toBe(true);
  });

  it("clamps volumes into the unit range", async () => {
    const { getAudioSettings, setSfxVolume } = await import("./settings");
    setSfxVolume(4);
    expect(getAudioSettings().sfxVolume).toBe(1);
    setSfxVolume(-1);
    expect(getAudioSettings().sfxVolume).toBe(0);
  });

  it("sanitizes corrupt stored values back to defaults", async () => {
    window.localStorage.setItem(
      "castellum.audio.v1",
      JSON.stringify({ muted: "yes", musicVolume: "loud", sfxVolume: 0.4 })
    );
    const { getAudioSettings } = await import("./settings");
    expect(getAudioSettings()).toEqual({ muted: false, musicVolume: 0.7, sfxVolume: 0.4 });
  });

  it("survives unparseable storage", async () => {
    window.localStorage.setItem("castellum.audio.v1", "not json");
    const { getAudioSettings } = await import("./settings");
    expect(getAudioSettings().musicVolume).toBeCloseTo(0.7, 9);
  });

  it("allows unsubscribing", async () => {
    const { setMuted, subscribeAudioSettings } = await import("./settings");
    const listener = vi.fn();
    const unsubscribe = subscribeAudioSettings(listener);
    unsubscribe();
    setMuted(true);
    expect(listener).not.toHaveBeenCalled();
  });
});
