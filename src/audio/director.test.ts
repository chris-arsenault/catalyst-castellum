// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMusicDirector } from "./director";
import type { AudioEngine, MusicVoiceGroup, StemEntry } from "./engine";
import { MUSIC_TRACKS, SFX_DEFINITIONS } from "./tracks";
import type { MusicTrackDefinition, StemMood } from "./types";

interface EngineLog {
  groups: { track: string; when: number; entries: StemEntry[] }[];
  releases: { track: string; when: number; leadFade: number; bedFade: number; washOut: number }[];
  cancelledGroups: string[];
  cancelledReleases: string[];
  moodRamps: { track: string; mood: StemMood }[];
  delayBeats: number[];
  sfx: { url: string; gain: number; reverb: number }[];
}

interface FakeEngineHarness {
  engine: AudioEngine;
  log: EngineLog;
  setTime: (time: number) => void;
  setUnlocked: (unlocked: boolean) => void;
}

const BUFFER_SECONDS = 10;

const createFakeEngine = (): FakeEngineHarness => {
  let time = 0;
  let unlockedFlag = true;
  const log: EngineLog = {
    groups: [],
    releases: [],
    cancelledGroups: [],
    cancelledReleases: [],
    moodRamps: [],
    delayBeats: [],
    sfx: [],
  };

  const makeGroup = (
    track: MusicTrackDefinition,
    when: number,
    entries: StemEntry[]
  ): MusicVoiceGroup => ({
    track,
    grid: {
      startTime: when,
      secondsPerBeat: BUFFER_SECONDS / (track.bars * track.beatsPerBar),
      beatsPerBar: track.beatsPerBar,
    },
    startsAt: when,
    stems: entries.map((entry) => ({
      stem: entry.stem,
      source: {} as AudioBufferSourceNode,
      envelope: {} as GainNode,
      layer: {} as GainNode,
      reverbSend: {} as GainNode,
      delaySend: {} as GainNode,
    })),
  });

  const engine: AudioEngine = {
    supported: true,
    unlocked: () => unlockedFlag,
    now: () => time,
    unlock: () => {
      unlockedFlag = true;
      return Promise.resolve(true);
    },
    loadBuffer: () => Promise.resolve({ duration: BUFFER_SECONDS } as AudioBuffer),
    startTrackVoices: (track, when, entries) => {
      log.groups.push({ track: track.name, when, entries });
      return makeGroup(track, when, entries);
    },
    releaseTrackVoices: (group, when, leadFade, bedFade, washOut) => {
      log.releases.push({ track: group.track.name, when, leadFade, bedFade, washOut });
      return () => log.cancelledReleases.push(group.track.name);
    },
    cancelScheduledGroup: (group) => {
      log.cancelledGroups.push(group.track.name);
    },
    rampGroupMood: (group, mood) => {
      log.moodRamps.push({ track: group.track.name, mood });
    },
    setDelayForBeat: (secondsPerBeat) => {
      log.delayBeats.push(secondsPerBeat);
    },
    playSfx: (url, gain, _rate, reverb) => {
      log.sfx.push({ url, gain, reverb });
      return Promise.resolve();
    },
  };

  return {
    engine,
    log,
    setTime: (next) => {
      time = next;
    },
    setUnlocked: (next) => {
      unlockedFlag = next;
    },
  };
};

const flushAsync = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

let harness: FakeEngineHarness;

beforeEach(() => {
  harness = createFakeEngine();
});

describe("createMusicDirector cue lifecycle", () => {
  it("starts every stem of the first cue from silence", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "menu", mood: "title" });
    await flushAsync();

    expect(harness.log.groups).toHaveLength(1);
    const group = harness.log.groups[0]!;
    expect(group.track).toBe("menu");
    expect(group.entries.map((entry) => entry.stem)).toEqual(["pulse1", "pulse2", "triangle"]);
    expect(harness.log.delayBeats[0]).toBeCloseTo(60 / MUSIC_TRACKS.menu.bpm, 6);
  });

  it("queues the cue while locked and plays it on unlock", async () => {
    harness.setUnlocked(false);
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "interlude", mood: "planning" });
    await flushAsync();
    expect(harness.log.groups).toHaveLength(0);

    harness.setUnlocked(true);
    director.onUnlocked();
    await flushAsync();
    expect(harness.log.groups[0]?.track).toBe("interlude");
  });

  it("treats a mood change on the same track as an in-place ramp", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "interlude", mood: "planning" });
    await flushAsync();
    director.setCue({ track: "interlude", mood: "priming" });
    await flushAsync();

    expect(harness.log.groups).toHaveLength(1);
    expect(harness.log.releases).toHaveLength(0);
    expect(harness.log.moodRamps).toHaveLength(1);
    expect(harness.log.moodRamps[0]?.mood.levels.pulse1).toBe(1);
    expect(director.currentCue()).toEqual({ track: "interlude", mood: "priming" });
  });

  it("ignores repeated requests for the current cue", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();
    expect(harness.log.groups).toHaveLength(1);
    expect(harness.log.moodRamps).toHaveLength(0);
  });
});

describe("createMusicDirector transitions and effects", () => {
  it("schedules escalations on the outgoing track's bar boundary", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();

    harness.setTime(0.1);
    director.setCue({ track: "danger", mood: "full" });
    await flushAsync();

    const barSeconds = (BUFFER_SECONDS / MUSIC_TRACKS.assault.bars / 4) * 4;
    expect(harness.log.groups[1]?.track).toBe("danger");
    expect(harness.log.groups[1]?.when).toBeCloseTo(barSeconds, 6);
    expect(harness.log.releases[0]?.track).toBe("assault");
    expect(harness.log.releases[0]?.washOut).toBeGreaterThan(0);
    expect(director.currentCue()).toEqual({ track: "danger", mood: "full" });
  });

  it("holds the incoming lead back on de-escalations", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();

    harness.setTime(0.1);
    director.setCue({ track: "interlude", mood: "planning" });
    await flushAsync();

    const entries = harness.log.groups[1]?.entries ?? [];
    const lead = entries.find((entry) => entry.stem === "pulse1");
    const bed = entries.find((entry) => entry.stem === "triangle");
    const interludeBar =
      (BUFFER_SECONDS / (MUSIC_TRACKS.interlude.bars * 4)) * MUSIC_TRACKS.interlude.beatsPerBar;
    expect(lead?.entryOffset).toBeCloseTo(2 * interludeBar, 6);
    expect(bed?.entryOffset).toBe(0);
    // Planning mood keeps the lead layer silent even after it enters.
    expect(lead?.layerLevel).toBe(0);
    expect(harness.log.releases[0]?.bedFade).toBeGreaterThan(1);
  });

  it("abandons a pending transition when the game changes its mind in time", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();

    harness.setTime(0.05);
    director.setCue({ track: "danger", mood: "full" });
    await flushAsync();
    // Still before the boundary: switching again cancels the danger group
    // and revives the assault release.
    director.setCue({ track: "interlude", mood: "planning" });
    await flushAsync();

    expect(harness.log.cancelledGroups).toEqual(["danger"]);
    expect(harness.log.cancelledReleases).toEqual(["assault"]);
    expect(director.currentCue()).toEqual({ track: "interlude", mood: "planning" });
  });
});

describe("createMusicDirector silence and sound effects", () => {
  it("fades to silence with a reverb wash on a null cue", async () => {
    const director = createMusicDirector(harness.engine);
    director.setCue({ track: "menu", mood: "title" });
    await flushAsync();
    director.setCue(null);
    await flushAsync();
    expect(harness.log.releases[0]?.track).toBe("menu");
    expect(harness.log.releases[0]?.washOut).toBeGreaterThan(0);
    expect(director.currentCue()).toBeNull();
  });

  it("plays registered sound effects with their reverb send", async () => {
    SFX_DEFINITIONS["test_blip"] = { name: "test_blip", url: "blip.ogg", gain: 0.5, reverb: 0.3 };
    try {
      const director = createMusicDirector(harness.engine);
      director.playSfx("test_blip");
      director.playSfx("unregistered");
      await flushAsync();
      expect(harness.log.sfx).toEqual([{ url: "blip.ogg", gain: 0.5, reverb: 0.3 }]);
    } finally {
      delete SFX_DEFINITIONS["test_blip"];
    }
  });

  it("preloads every stem of every track once unlocked", () => {
    const spy = vi.spyOn(harness.engine, "loadBuffer");
    const director = createMusicDirector(harness.engine);
    director.preloadAll();
    const stemCount = Object.values(MUSIC_TRACKS).reduce(
      (total, track) => total + track.stems.length,
      0
    );
    expect(spy).toHaveBeenCalledTimes(stemCount);
  });
});
