import { describe, expect, it } from "vitest";
import { moodSpec } from "./moods";
import { MUSIC_TRACKS } from "./tracks";
import type { MoodName, MusicTrackName } from "./types";

/** Every track/mood pair the cue selector can emit. */
const USED_CUES: [MusicTrackName, MoodName][] = [
  ["menu", "title"],
  ["interlude", "planning"],
  ["interlude", "priming"],
  ["interlude", "afterglow"],
  ["interlude", "defeat"],
  ["assault", "steady"],
  ["assault", "strained"],
  ["danger", "full"],
  ["boss", "full"],
];

describe("moodSpec", () => {
  it("defines every cue the selector can emit with sane ranges", () => {
    for (const [track, mood] of USED_CUES) {
      const spec = moodSpec(track, mood);
      for (const stem of MUSIC_TRACKS[track].stems) {
        const level = spec.levels[stem];
        expect(level, `${track}/${mood}/${stem}`).toBeGreaterThanOrEqual(0);
        expect(level, `${track}/${mood}/${stem}`).toBeLessThanOrEqual(1);
      }
      expect(spec.reverb).toBeGreaterThanOrEqual(0);
      expect(spec.reverb).toBeLessThanOrEqual(1);
      expect(spec.leadDelay).toBeGreaterThanOrEqual(0);
      expect(spec.leadDelay).toBeLessThanOrEqual(1);
    }
  });

  it("keeps at least one stem audible in every mood", () => {
    for (const [track, mood] of USED_CUES) {
      const spec = moodSpec(track, mood);
      const audible = MUSIC_TRACKS[track].stems.some((stem) => spec.levels[stem] > 0.3);
      expect(audible, `${track}/${mood}`).toBe(true);
    }
  });

  it("falls back to a full mix for unknown pairs", () => {
    const spec = moodSpec("assault", "afterglow");
    expect(spec.levels.pulse1).toBe(1);
    expect(spec.levels.noise).toBe(1);
  });

  it("distinguishes planning from priming by the lead layer", () => {
    expect(moodSpec("interlude", "planning").levels.pulse1).toBe(0);
    expect(moodSpec("interlude", "priming").levels.pulse1).toBe(1);
  });

  it("holds the assault comp back until strained", () => {
    expect(moodSpec("assault", "steady").levels.pulse2).toBe(0);
    expect(moodSpec("assault", "strained").levels.pulse2).toBe(1);
  });
});
