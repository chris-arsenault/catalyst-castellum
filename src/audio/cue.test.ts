import { describe, expect, it } from "vitest";
import {
  DANGER_INTEGRITY_FRACTION,
  STRAIN_INTEGRITY_FRACTION,
  selectMusicCue,
  type MusicCueInputs,
} from "./cue";
import { transitionPolicyFor } from "./director";

const inputs = (overrides: Partial<MusicCueInputs>): MusicCueInputs => ({
  inSession: true,
  phase: "build",
  assaultTheme: "standard",
  coreIntegrityFraction: 1,
  ...overrides,
});

describe("selectMusicCue", () => {
  it("plays the menu title on the save-slot screen", () => {
    expect(selectMusicCue(inputs({ inSession: false }))).toEqual({
      track: "menu",
      mood: "title",
    });
  });

  it("keeps the planning bed sparse and brings the lead in for priming", () => {
    for (const phase of ["level_briefing", "build", "round_result"] as const) {
      expect(selectMusicCue(inputs({ phase }))).toEqual({ track: "interlude", mood: "planning" });
    }
    expect(selectMusicCue(inputs({ phase: "prime" }))).toEqual({
      track: "interlude",
      mood: "priming",
    });
  });

  it("escalates vertically to strained before switching tracks to danger", () => {
    expect(selectMusicCue(inputs({ phase: "assault" }))).toEqual({
      track: "assault",
      mood: "steady",
    });
    expect(
      selectMusicCue(
        inputs({ phase: "assault", coreIntegrityFraction: STRAIN_INTEGRITY_FRACTION - 0.01 })
      )
    ).toEqual({ track: "assault", mood: "strained" });
    expect(
      selectMusicCue(
        inputs({ phase: "assault", coreIntegrityFraction: DANGER_INTEGRITY_FRACTION - 0.01 })
      )
    ).toEqual({ track: "danger", mood: "full" });
  });

  it("plays the boss track for boss-level assaults regardless of integrity", () => {
    expect(
      selectMusicCue(inputs({ phase: "assault", assaultTheme: "boss", coreIntegrityFraction: 0.1 }))
    ).toEqual({ track: "boss", mood: "full" });
  });

  it("resolves the end phases to afterglow and defeat moods", () => {
    expect(selectMusicCue(inputs({ phase: "level_complete" }))).toEqual({
      track: "interlude",
      mood: "afterglow",
    });
    expect(selectMusicCue(inputs({ phase: "victory" }))).toEqual({
      track: "interlude",
      mood: "afterglow",
    });
    expect(selectMusicCue(inputs({ phase: "defeat" }))).toEqual({
      track: "interlude",
      mood: "defeat",
    });
  });
});

describe("transitionPolicyFor", () => {
  it("starts immediately out of silence", () => {
    expect(transitionPolicyFor(null, "menu").quantize).toBe("immediate");
  });

  it("keeps the danger escalation the tightest transition of all", () => {
    const policy = transitionPolicyFor("assault", "danger");
    expect(policy.quantize).toBe("bar");
    expect(policy.outBedFade).toBeLessThan(0.6);
    expect(policy.washOut).toBeGreaterThan(0);
    expect(policy.inFade).toBeLessThan(transitionPolicyFor("menu", "assault").inFade);
  });

  it("builds slowly into combat from calm places", () => {
    for (const from of ["menu", "interlude"] as const) {
      const policy = transitionPolicyFor(from, "assault");
      expect(policy.inFade, `${from}>assault`).toBeGreaterThanOrEqual(1.5);
      expect(policy.outBedFade, `${from}>assault`).toBeGreaterThanOrEqual(1.5);
    }
    expect(transitionPolicyFor("menu", "boss").inFade).toBeGreaterThanOrEqual(1.5);
  });

  it("de-escalates on the beat with a long bed fade and a held-back lead", () => {
    const policy = transitionPolicyFor("assault", "interlude");
    expect(policy.quantize).toBe("beat");
    expect(policy.outBedFade).toBeGreaterThan(3);
    expect(policy.inFade).toBeGreaterThan(2);
    expect(policy.leadEntryBars).toBeGreaterThan(0);
    expect(transitionPolicyFor("boss", "menu").washOut).toBeGreaterThan(0);
  });
});
