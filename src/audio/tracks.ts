import type {
  MusicRendition,
  MusicTrackDefinition,
  MusicTrackName,
  SfxDefinition,
  TrackRendition,
  VoiceName,
} from "./types";

const CHIP_PITCHED: readonly VoiceName[] = ["pulse1", "pulse2", "triangle"];
const CHIP_FULL: readonly VoiceName[] = ["pulse1", "pulse2", "triangle", "noise"];
const MIX_ONLY: readonly VoiceName[] = ["mix"];

const chip = (bpm: number, bars: number, voices: readonly VoiceName[]): TrackRendition => ({
  rendition: "chip",
  bpm,
  beatsPerBar: 4,
  bars,
  voices,
  leadVoice: "pulse1",
});

/**
 * A pre-rendered bounce of the matching `music/*-extended.rb` score. Tempo
 * and beats-per-bar match the chip rendition so both sit on one grid; only
 * the loop length differs, and it stays a whole number of bars so loop
 * restarts land on that grid too.
 */
const mix = (rendition: MusicRendition, bpm: number, bars: number): TrackRendition => ({
  rendition,
  bpm,
  beatsPerBar: 4,
  bars,
  voices: MIX_ONLY,
  leadVoice: "mix",
});

/**
 * Track metadata mirrors the authored sources in `music/`. Each track ships
 * a chip rendition - one OGG per NES voice, rendered by `music/build.sh`,
 * ending exactly at the final note-off and sample-aligned so the game
 * starts them together and mixes live. Tracks with an extended score also
 * declare pre-rendered renditions: single stereo bounces the director takes
 * occasionally in place of the stems.
 */
export const MUSIC_TRACKS: Record<MusicTrackName, MusicTrackDefinition> = {
  menu: {
    name: "menu",
    hiFiChance: 0.3,
    renditions: {
      chip: chip(104, 24, CHIP_PITCHED),
      orchestral: mix("orchestral", 104, 52),
      electronic: mix("electronic", 104, 52),
    },
  },
  interlude: {
    name: "interlude",
    hiFiChance: 0,
    renditions: { chip: chip(92, 20, CHIP_PITCHED) },
  },
  assault: {
    name: "assault",
    hiFiChance: 0.25,
    renditions: {
      chip: chip(132, 32, CHIP_FULL),
      orchestral: mix("orchestral", 132, 66),
      electronic: mix("electronic", 132, 66),
    },
  },
  danger: {
    name: "danger",
    hiFiChance: 0,
    renditions: { chip: chip(160, 40, CHIP_FULL) },
  },
  boss: {
    name: "boss",
    hiFiChance: 0.4,
    renditions: {
      chip: chip(168, 40, CHIP_FULL),
      orchestral: mix("orchestral", 168, 84),
      electronic: mix("electronic", 168, 84),
    },
  },
};

/**
 * Chip stems keep the flat `audio/<track>/<voice>.ogg` layout; pre-rendered
 * renditions sit one directory deeper under their rendition name.
 */
export const voiceUrl = (
  track: MusicTrackName,
  rendition: MusicRendition,
  voice: VoiceName
): string =>
  rendition === "chip"
    ? `${import.meta.env.BASE_URL}audio/${track}/${voice}.ogg`
    : `${import.meta.env.BASE_URL}audio/${track}/${rendition}/${voice}.ogg`;

/** Every pre-rendered rendition a track declares, in registration order. */
export const hiFiRenditions = (definition: MusicTrackDefinition): readonly TrackRendition[] =>
  Object.values(definition.renditions).filter((entry) => entry.rendition !== "chip");

/**
 * Sound-effect registry. Add entries here as effect assets land in
 * public/audio/sfx/; playback plumbing (bus, caching, one-shot voices,
 * reverb send into the shared FX rack) is already in place.
 */
export const SFX_DEFINITIONS: Record<string, SfxDefinition> = {};
