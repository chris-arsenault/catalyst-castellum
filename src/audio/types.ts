export type MusicTrackName = "menu" | "interlude" | "assault" | "danger" | "boss";

/** The four NES voices; the chip rendition ships one stem OGG per voice it uses. */
export type StemName = "pulse1" | "pulse2" | "triangle" | "noise";

/** A pre-rendered rendition ships one file per voice it declares. */
export type MixVoiceName = "mix";

/** Everything a rendition can name as a separately-loaded, separately-mixed file. */
export type VoiceName = StemName | MixVoiceName;

/**
 * How a track is realized. `chip` is the authored NES stem set every track
 * ships. The others are pre-rendered bounces of the extended production
 * scores in `music/*-extended.rb`, which carry the same key, tempo and
 * beats-per-bar as the chip sources so both realizations sit on one grid.
 */
export type MusicRendition = "chip" | "orchestral" | "electronic";

/**
 * One realization of one track: its own loop length and voice list, on a
 * tempo grid shared with every other rendition of that track. `bars` and
 * `bpm` drive beat- and bar-quantized transitions, so they must match the
 * Partitura source exactly.
 */
export interface TrackRendition {
  rendition: MusicRendition;
  bpm: number;
  beatsPerBar: number;
  bars: number;
  voices: readonly VoiceName[];
  /**
   * The voice carrying the tune: it takes the tempo-synced delay send, it
   * drops fastest on the way out, and it is the one that can hold back a
   * couple of bars on the way in.
   */
  leadVoice: VoiceName;
}

/**
 * Every track ships `chip`; pre-rendered renditions are optional per track
 * and the director falls back to chip whenever one is absent or its assets
 * have not been fetched yet.
 */
export type RenditionSet = Readonly<Record<"chip", TrackRendition>> &
  Readonly<Partial<Record<MusicRendition, TrackRendition>>>;

export interface MusicTrackDefinition {
  name: MusicTrackName;
  /**
   * Chance that entering this track takes a pre-rendered rendition rather
   * than the chip stems, 0..1. Rolled once per entry from a seeded stream,
   * so a session's choices replay identically.
   */
  hiFiChance: number;
  renditions: RenditionSet;
}

/**
 * A mood is a named vertical mix of one track's voices: layer levels plus
 * shared-effect sends. Mood changes ramp in place on the playing rendition -
 * no track switch, no seam. A chip rendition can drop and add whole voices;
 * a single-file rendition reads the same mood as level and send changes on
 * its one voice.
 */
export type MoodName =
  "title" | "planning" | "priming" | "afterglow" | "defeat" | "steady" | "strained" | "full";

export interface MusicCueState {
  track: MusicTrackName;
  mood: MoodName;
}

/** What the game asks for; null means silence. */
export type MusicCue = MusicCueState | null;

export interface StemMood {
  /** Per-voice layer levels 0..1; voices a rendition lacks are ignored. */
  levels: Readonly<Record<VoiceName, number>>;
  /** Shared reverb send for every voice in the group, 0..1. */
  reverb: number;
  /** Tempo-synced delay send for the rendition's lead voice only, 0..1. */
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
  /** Fade for the outgoing lead voice. */
  outLeadFade: number;
  /** Fade for the outgoing bed (every voice but the lead). */
  outBedFade: number;
  /** Extra reverb send pushed onto the outgoing group while it fades. */
  washOut: number;
  /** Fade-in for incoming voices. */
  inFade: number;
  /** The incoming lead waits this many of its own bars before entering. */
  leadEntryBars: number;
}

export interface AudioSettings {
  muted: boolean;
  /** 0..1 linear volume for the music bus. */
  musicVolume: number;
  /** 0..1 linear volume for the sound-effects bus. */
  sfxVolume: number;
}
