import type { MoodName, MusicTrackName, StemMood, StemName } from "./types";

const levels = (
  pulse1: number,
  pulse2: number,
  triangle: number,
  noise: number
): Readonly<Record<StemName, number>> => ({ pulse1, pulse2, triangle, noise });

const FULL_MIX: StemMood = { levels: levels(1, 1, 1, 1), reverb: 0.1, leadDelay: 0 };

/**
 * The vertical-mix vocabulary. Each entry is one dramatic reading of one
 * track: which voices speak, how much of the shared hall they sit in, and
 * whether the lead trails a tempo-synced echo.
 *
 * - menu/title: full statement in a stone hall.
 * - interlude/planning: the lead sits out - a sparse bed to think over.
 * - interlude/priming: the lead enters as the player commits to the round.
 * - interlude/afterglow: lead alone over a thinned bed, washed in reverb -
 *   the debrief after a won level or campaign.
 * - interlude/defeat: no lead at all, heavy wash - the empty room.
 * - assault/steady: comp (pulse2) held back so the fight can escalate.
 * - assault/strained: comp joins and the lead starts echoing.
 * - danger/full and boss/full: everything, with their own echo characters.
 */
const MOODS: Record<string, StemMood> = {
  "menu/title": { levels: levels(1, 1, 1, 1), reverb: 0.22, leadDelay: 0.12 },
  "interlude/planning": { levels: levels(0, 0.9, 1, 0), reverb: 0.18, leadDelay: 0 },
  "interlude/priming": { levels: levels(1, 1, 1, 0), reverb: 0.15, leadDelay: 0.1 },
  "interlude/afterglow": { levels: levels(1, 0.4, 0.55, 0), reverb: 0.5, leadDelay: 0.2 },
  "interlude/defeat": { levels: levels(0, 0.65, 1, 0), reverb: 0.6, leadDelay: 0.25 },
  "assault/steady": { levels: levels(1, 0, 1, 1), reverb: 0.08, leadDelay: 0 },
  "assault/strained": { levels: levels(1, 1, 1, 1), reverb: 0.08, leadDelay: 0.15 },
  "danger/full": { levels: levels(1, 1, 1, 1), reverb: 0.1, leadDelay: 0.22 },
  "boss/full": { levels: levels(1, 1, 1, 1), reverb: 0.2, leadDelay: 0.16 },
};

export const moodSpec = (track: MusicTrackName, mood: MoodName): StemMood =>
  MOODS[`${track}/${mood}`] ?? FULL_MIX;

/** Seconds over which an in-place mood change ramps its stem levels. */
export const MOOD_RAMP_SECONDS = 1.2;
