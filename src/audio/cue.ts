import type { GamePhase } from "../game/types";
import type { MusicCue, MusicCueState } from "./types";

/**
 * Below this fraction of the level's starting core integrity, an assault is
 * scored with the danger track. Core integrity never recovers mid-level, so
 * the escalation is naturally one-way - no flapping hysteresis needed.
 */
export const DANGER_INTEGRITY_FRACTION = 0.5;

/**
 * Between this fraction and the danger threshold the assault track stays
 * but its held-back comp layer joins and the lead picks up its echo - a
 * vertical escalation with no track switch at all.
 */
export const STRAIN_INTEGRITY_FRACTION = 0.8;

export interface MusicCueInputs {
  /** False on the save-slot screen (no session running). */
  inSession: boolean;
  phase: GamePhase | null;
  /** From the level definition; the campaign marks its boss levels. */
  assaultTheme: "standard" | "boss";
  /** Current core integrity / the level's starting integrity, 0..1. */
  coreIntegrityFraction: number;
}

const PLANNING: MusicCueState = { track: "interlude", mood: "planning" };
const AFTERGLOW: MusicCueState = { track: "interlude", mood: "afterglow" };

const PHASE_CUES: Record<Exclude<GamePhase, "assault">, MusicCueState> = {
  level_briefing: PLANNING,
  build: PLANNING,
  round_result: PLANNING,
  prime: { track: "interlude", mood: "priming" },
  level_complete: AFTERGLOW,
  travel: AFTERGLOW,
  victory: AFTERGLOW,
  defeat: { track: "interlude", mood: "defeat" },
};

const assaultCue = (inputs: MusicCueInputs): MusicCueState => {
  if (inputs.assaultTheme === "boss") return { track: "boss", mood: "full" };
  if (inputs.coreIntegrityFraction < DANGER_INTEGRITY_FRACTION)
    return { track: "danger", mood: "full" };
  if (inputs.coreIntegrityFraction < STRAIN_INTEGRITY_FRACTION)
    return { track: "assault", mood: "strained" };
  return { track: "assault", mood: "steady" };
};

/**
 * Pure mapping from game state to the desired music cue (track + mood).
 * The director owns HOW to get there (quantization, staggered stem entries,
 * mood ramps); this owns only WHAT should be playing.
 */
export const selectMusicCue = (inputs: MusicCueInputs): MusicCue => {
  if (!inputs.inSession || inputs.phase === null) return { track: "menu", mood: "title" };
  if (inputs.phase === "assault") return assaultCue(inputs);
  return PHASE_CUES[inputs.phase];
};
