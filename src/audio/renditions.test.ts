import { describe, expect, it } from "vitest";
import { createRenditionRandom, pickRendition, RENDITION_SEED } from "./renditions";
import { hiFiRenditions, MUSIC_TRACKS } from "./tracks";
import type { RandomSource } from "../game/world/seededRandom";

/** Replays a fixed roll sequence so a case states exactly what it draws. */
const rolls = (...values: number[]): RandomSource => {
  let index = 0;
  return { next: () => values[index++] ?? 0 };
};

describe("pickRendition", () => {
  it("answers chip for a track with no extended score", () => {
    const picked = pickRendition(MUSIC_TRACKS.danger, rolls(0));
    expect(picked.rendition).toBe("chip");
  });

  it("answers chip when the roll misses the track's chance", () => {
    // boss rolls hi-fi below 0.4.
    expect(pickRendition(MUSIC_TRACKS.boss, rolls(0.99)).rendition).toBe("chip");
    expect(pickRendition(MUSIC_TRACKS.boss, rolls(0.4)).rendition).toBe("chip");
  });

  it("draws evenly among the renditions a track declares", () => {
    const declared = hiFiRenditions(MUSIC_TRACKS.boss).map((entry) => entry.rendition);
    expect(declared).toEqual(["orchestral", "electronic"]);
    expect(pickRendition(MUSIC_TRACKS.boss, rolls(0.1, 0)).rendition).toBe("orchestral");
    expect(pickRendition(MUSIC_TRACKS.boss, rolls(0.1, 0.99)).rendition).toBe("electronic");
  });

  it("consumes one roll for a chip answer and two for a hi-fi one", () => {
    const stream = rolls(0.99, 0.1, 0);
    expect(pickRendition(MUSIC_TRACKS.boss, stream).rendition).toBe("chip");
    expect(pickRendition(MUSIC_TRACKS.boss, stream).rendition).toBe("orchestral");
  });

  it("replays the same sequence of choices from the same seed", () => {
    const sequence = (): string[] => {
      const random = createRenditionRandom(RENDITION_SEED);
      return Array.from({ length: 12 }, () => pickRendition(MUSIC_TRACKS.boss, random).rendition);
    };
    expect(sequence()).toEqual(sequence());
  });

  it("takes chip most of the time and hi-fi some of the time over a long session", () => {
    const random = createRenditionRandom();
    const counts = { chip: 0, hiFi: 0 };
    for (let entry = 0; entry < 400; entry += 1) {
      const picked = pickRendition(MUSIC_TRACKS.assault, random);
      if (picked.rendition === "chip") counts.chip += 1;
      else counts.hiFi += 1;
    }
    expect(counts.hiFi).toBeGreaterThan(0);
    expect(counts.chip).toBeGreaterThan(counts.hiFi);
  });
});
