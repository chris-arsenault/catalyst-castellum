// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMusicDirector } from "./director";
import type { AudioEngine, MusicVoiceGroup, StemEntry } from "./engine";
import { MUSIC_TRACKS, SFX_DEFINITIONS, voiceUrl } from "./tracks";
import type { MusicTrackName, StemMood, TrackRendition } from "./types";
import type { RandomSource } from "../game/world/seededRandom";

interface EngineLog {
  groups: { track: string; rendition: string; when: number; entries: StemEntry[] }[];
  releases: { track: string; when: number; leadFade: number; bedFade: number; washOut: number }[];
  cancelledGroups: string[];
  cancelledReleases: string[];
  moodRamps: { track: string; mood: StemMood }[];
  delayBeats: number[];
  loaded: string[];
  sfx: { url: string; gain: number; reverb: number }[];
}

interface FakeEngineHarness {
  engine: AudioEngine;
  log: EngineLog;
  setTime: (time: number) => void;
  setUnlocked: (unlocked: boolean) => void;
  makeResident: (track: MusicTrackName, rendition: TrackRendition) => void;
}

const BUFFER_SECONDS = 10;

/** Always rolls into the first pre-rendered rendition a track declares. */
const ALWAYS_HI_FI: RandomSource = { next: () => 0 };
/** Never clears any track's hi-fi chance. */
const ALWAYS_CHIP: RandomSource = { next: () => 0.999 };

const makeGroup = (
  track: MusicTrackName,
  rendition: TrackRendition,
  when: number,
  entries: StemEntry[]
): MusicVoiceGroup => ({
  track,
  rendition,
  grid: {
    startTime: when,
    secondsPerBeat: BUFFER_SECONDS / (rendition.bars * rendition.beatsPerBar),
    beatsPerBar: rendition.beatsPerBar,
  },
  startsAt: when,
  stems: entries.map((entry) => ({
    voice: entry.voice,
    source: {} as AudioBufferSourceNode,
    envelope: {} as GainNode,
    layer: {} as GainNode,
    reverbSend: {} as GainNode,
    delaySend: {} as GainNode,
  })),
});

const emptyLog = (): EngineLog => ({
  groups: [],
  releases: [],
  cancelledGroups: [],
  cancelledReleases: [],
  moodRamps: [],
  delayBeats: [],
  loaded: [],
  sfx: [],
});

const createFakeEngine = (): FakeEngineHarness => {
  let time = 0;
  let unlockedFlag = true;
  const resident = new Set<string>();
  const log = emptyLog();

  const engine: AudioEngine = {
    supported: true,
    unlocked: () => unlockedFlag,
    now: () => time,
    unlock: () => {
      unlockedFlag = true;
      return Promise.resolve(true);
    },
    loadBuffer: (url) => {
      log.loaded.push(url);
      return Promise.resolve({ duration: BUFFER_SECONDS } as AudioBuffer);
    },
    isBufferResident: (url) => resident.has(url),
    startTrackVoices: (track, rendition, when, entries) => {
      log.groups.push({ track, rendition: rendition.rendition, when, entries });
      return makeGroup(track, rendition, when, entries);
    },
    releaseTrackVoices: (group, when, leadFade, bedFade, washOut) => {
      log.releases.push({ track: group.track, when, leadFade, bedFade, washOut });
      return () => log.cancelledReleases.push(group.track);
    },
    cancelScheduledGroup: (group) => {
      log.cancelledGroups.push(group.track);
    },
    rampGroupMood: (group, mood) => {
      log.moodRamps.push({ track: group.track, mood });
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
    makeResident: (track, rendition) => {
      for (const voice of rendition.voices) {
        resident.add(voiceUrl(track, rendition.rendition, voice));
      }
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
  it("starts every voice of the first cue from silence", async () => {
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
    director.setCue({ track: "menu", mood: "title" });
    await flushAsync();

    expect(harness.log.groups).toHaveLength(1);
    const group = harness.log.groups[0]!;
    expect(group.track).toBe("menu");
    expect(group.entries.map((entry) => entry.voice)).toEqual(["pulse1", "pulse2", "triangle"]);
    expect(harness.log.delayBeats[0]).toBeCloseTo(60 / MUSIC_TRACKS.menu.renditions.chip.bpm, 6);
  });

  it("queues the cue while locked and plays it on unlock", async () => {
    harness.setUnlocked(false);
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
    director.setCue({ track: "interlude", mood: "planning" });
    await flushAsync();
    expect(harness.log.groups).toHaveLength(0);

    harness.setUnlocked(true);
    director.onUnlocked();
    await flushAsync();
    expect(harness.log.groups[0]?.track).toBe("interlude");
  });

  it("treats a mood change on the same track as an in-place ramp", async () => {
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
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
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
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
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();

    harness.setTime(0.1);
    director.setCue({ track: "danger", mood: "full" });
    await flushAsync();

    const barSeconds = (BUFFER_SECONDS / MUSIC_TRACKS.assault.renditions.chip.bars / 4) * 4;
    expect(harness.log.groups[1]?.track).toBe("danger");
    expect(harness.log.groups[1]?.when).toBeCloseTo(barSeconds, 6);
    expect(harness.log.releases[0]?.track).toBe("assault");
    expect(harness.log.releases[0]?.washOut).toBeGreaterThan(0);
    expect(director.currentCue()).toEqual({ track: "danger", mood: "full" });
  });

  it("holds the incoming lead back on de-escalations", async () => {
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();

    harness.setTime(0.1);
    director.setCue({ track: "interlude", mood: "planning" });
    await flushAsync();

    const interlude = MUSIC_TRACKS.interlude.renditions.chip;
    const entries = harness.log.groups[1]?.entries ?? [];
    const lead = entries.find((entry) => entry.voice === "pulse1");
    const bed = entries.find((entry) => entry.voice === "triangle");
    const interludeBar = (BUFFER_SECONDS / (interlude.bars * 4)) * interlude.beatsPerBar;
    expect(lead?.entryOffset).toBeCloseTo(2 * interludeBar, 6);
    expect(bed?.entryOffset).toBe(0);
    // Planning mood keeps the lead layer silent even after it enters.
    expect(lead?.layerLevel).toBe(0);
    expect(harness.log.releases[0]?.bedFade).toBeGreaterThan(1);
  });

  it("abandons a pending transition when the game changes its mind in time", async () => {
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
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

describe("createMusicDirector rendition selection", () => {
  it("plays the chip stems and warms the bounce when a hi-fi roll finds nothing cached", async () => {
    const director = createMusicDirector(harness.engine, ALWAYS_HI_FI);
    director.setCue({ track: "boss", mood: "full" });
    await flushAsync();

    expect(harness.log.groups[0]?.rendition).toBe("chip");
    expect(harness.log.loaded).toContain(voiceUrl("boss", "orchestral", "mix"));
  });

  it("takes the pre-rendered rendition once its bounce is cached", async () => {
    harness.makeResident("boss", MUSIC_TRACKS.boss.renditions.orchestral!);
    const director = createMusicDirector(harness.engine, ALWAYS_HI_FI);
    director.setCue({ track: "boss", mood: "full" });
    await flushAsync();

    const group = harness.log.groups[0]!;
    expect(group.rendition).toBe("orchestral");
    expect(group.entries.map((entry) => entry.voice)).toEqual(["mix"]);
    // The single voice is the lead, so it carries the mood's delay send.
    expect(group.entries[0]?.delaySend).toBeGreaterThan(0);
    // The bounce is longer than the chip loop, and the grid follows it.
    expect(harness.log.delayBeats[0]).toBeCloseTo(60 / MUSIC_TRACKS.boss.renditions.chip.bpm, 6);
  });

  it("stays on the chip stems for tracks without an extended score", async () => {
    harness.makeResident("assault", MUSIC_TRACKS.assault.renditions.orchestral!);
    const director = createMusicDirector(harness.engine, ALWAYS_HI_FI);
    director.setCue({ track: "danger", mood: "full" });
    await flushAsync();

    expect(harness.log.groups[0]?.rendition).toBe("chip");
    expect(harness.log.loaded).not.toContain(voiceUrl("danger", "orchestral", "mix"));
  });

  it("re-rolls the rendition on every entry, not on a mood change", async () => {
    harness.makeResident("assault", MUSIC_TRACKS.assault.renditions.orchestral!);
    const director = createMusicDirector(harness.engine, ALWAYS_HI_FI);
    director.setCue({ track: "assault", mood: "steady" });
    await flushAsync();
    director.setCue({ track: "assault", mood: "strained" });
    await flushAsync();

    // One group, one mood ramp: the rendition never changes underneath a
    // playing track.
    expect(harness.log.groups).toHaveLength(1);
    expect(harness.log.groups[0]?.rendition).toBe("orchestral");
    expect(harness.log.moodRamps).toHaveLength(1);
    expect(harness.log.moodRamps[0]?.mood.levels.mix).toBe(1);
  });

  it("fades between renditions of different tracks on the outgoing grid", async () => {
    harness.makeResident("boss", MUSIC_TRACKS.boss.renditions.orchestral!);
    const director = createMusicDirector(harness.engine, ALWAYS_HI_FI);
    director.setCue({ track: "menu", mood: "title" });
    await flushAsync();

    harness.setTime(0.1);
    director.setCue({ track: "boss", mood: "full" });
    await flushAsync();

    const menuBar = (BUFFER_SECONDS / MUSIC_TRACKS.menu.renditions.chip.bars / 4) * 4;
    expect(harness.log.groups[0]?.rendition).toBe("chip");
    expect(harness.log.groups[1]?.rendition).toBe("orchestral");
    expect(harness.log.groups[1]?.when).toBeCloseTo(menuBar, 6);
    expect(harness.log.releases[0]?.track).toBe("menu");
  });
});

describe("createMusicDirector silence and sound effects", () => {
  it("fades to silence with a reverb wash on a null cue", async () => {
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
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
      const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
      director.playSfx("test_blip");
      director.playSfx("unregistered");
      await flushAsync();
      expect(harness.log.sfx).toEqual([{ url: "blip.ogg", gain: 0.5, reverb: 0.3 }]);
    } finally {
      delete SFX_DEFINITIONS["test_blip"];
    }
  });

  it("preloads the chip stems of every track once unlocked", () => {
    const spy = vi.spyOn(harness.engine, "loadBuffer");
    const director = createMusicDirector(harness.engine, ALWAYS_CHIP);
    director.preloadAll();
    const chipVoiceCount = Object.values(MUSIC_TRACKS).reduce(
      (total, definition) => total + definition.renditions.chip.voices.length,
      0
    );
    expect(spy).toHaveBeenCalledTimes(chipVoiceCount);
  });
});
