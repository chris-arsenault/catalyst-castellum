export type MusicTrackName = "menu" | "interlude" | "assault" | "danger" | "boss";

/** The four NES voices; every track ships one stem OGG per voice it uses. */
export type StemName = "pulse1" | "pulse2" | "triangle" | "noise";

/**
 * A mood is a named vertical mix of one track's stems: layer levels plus
 * shared-effect sends. Mood changes ramp in place on the playing track -
 * no track switch, no seam.
 */
export type MoodName =
  "title" | "planning" | "priming" | "afterglow" | "defeat" | "steady" | "strained" | "full";

export interface MusicCueState {
  track: MusicTrackName;
  mood: MoodName;
}

/** What the game asks for; null means silence. */
export type MusicCue = MusicCueState | null;

export interface MusicTrackDefinition {
  name: MusicTrackName;
  bpm: number;
  beatsPerBar: number;
  bars: number;
  stems: readonly StemName[];
}

export interface StemMood {
  /** Per-stem layer levels 0..1; stems a track lacks are ignored. */
  levels: Readonly<Record<StemName, number>>;
  /** Shared reverb send for every stem in the group, 0..1. */
  reverb: number;
  /** Tempo-synced delay send for the lead (pulse1) only, 0..1. */
  leadDelay: number;
}

export interface SfxDefinition {
  name: string;
  url: string;
  /** Linear gain applied on top of the SFX bus. */
  gain: number;
  /** Reverb send 0..1 so effects can sit in the same space as the music. */
  reverb: number;
}

export type QuantizeUnit = "bar" | "beat" | "immediate";

/**
 * How to hand over from one track to another. The switch point snaps to a
 * musical boundary of the outgoing track; the outgoing lead drops fast
 * while its bed lingers (optionally washing into the reverb), and the
 * incoming lead can hold back for a few of its own bars so the new bed
 * establishes first.
 */
export interface TransitionPolicy {
  quantize: QuantizeUnit;
  /** Fade for the outgoing pulse1 stem. */
  outLeadFade: number;
  /** Fade for the outgoing bed (everything but pulse1). */
  outBedFade: number;
  /** Extra reverb send pushed onto the outgoing group while it fades. */
  washOut: number;
  /** Fade-in for incoming stems. */
  inFade: number;
  /** Incoming pulse1 waits this many of its own bars before entering. */
  leadEntryBars: number;
}

export interface AudioSettings {
  muted: boolean;
  /** 0..1 linear volume for the music bus. */
  musicVolume: number;
  /** 0..1 linear volume for the sound-effects bus. */
  sfxVolume: number;
}
