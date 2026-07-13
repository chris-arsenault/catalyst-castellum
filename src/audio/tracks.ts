import type { MusicTrackDefinition, MusicTrackName, SfxDefinition, StemName } from "./types";

/**
 * Track metadata mirrors the authored sources in music/*.rb. The bpm/bars
 * values drive beat- and bar-quantized transitions, so they must match the
 * Partitura sources exactly. Each track ships one OGG per NES voice
 * (rendered by music/build.sh); stems end exactly at the final note-off and
 * are sample-aligned, so the game starts them together and mixes live.
 */
export const MUSIC_TRACKS: Record<MusicTrackName, MusicTrackDefinition> = {
  menu: {
    name: "menu",
    bpm: 104,
    beatsPerBar: 4,
    bars: 24,
    stems: ["pulse1", "pulse2", "triangle"],
  },
  interlude: {
    name: "interlude",
    bpm: 92,
    beatsPerBar: 4,
    bars: 20,
    stems: ["pulse1", "pulse2", "triangle"],
  },
  assault: {
    name: "assault",
    bpm: 132,
    beatsPerBar: 4,
    bars: 32,
    stems: ["pulse1", "pulse2", "triangle", "noise"],
  },
  danger: {
    name: "danger",
    bpm: 160,
    beatsPerBar: 4,
    bars: 40,
    stems: ["pulse1", "pulse2", "triangle", "noise"],
  },
  boss: {
    name: "boss",
    bpm: 168,
    beatsPerBar: 4,
    bars: 40,
    stems: ["pulse1", "pulse2", "triangle", "noise"],
  },
};

export const stemUrl = (track: MusicTrackName, stem: StemName): string =>
  `${import.meta.env.BASE_URL}audio/${track}/${stem}.ogg`;

/**
 * Sound-effect registry. Add entries here as effect assets land in
 * public/audio/sfx/; playback plumbing (bus, caching, one-shot voices,
 * reverb send into the shared FX rack) is already in place.
 */
export const SFX_DEFINITIONS: Record<string, SfxDefinition> = {};
