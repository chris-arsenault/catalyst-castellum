import { drawIndex, seededRandom, type RandomSource } from "../game/world/seededRandom";
import { hiFiRenditions } from "./tracks";
import type { MusicTrackDefinition, TrackRendition } from "./types";

/**
 * The soundtrack's own draw stream, seeded so one session's rendition
 * choices replay identically. It is deliberately independent of the
 * simulation's seeds: which realization of a track is playing is a
 * presentation choice and never reaches game state.
 */
export const RENDITION_SEED = 0x2a03;

export const createRenditionRandom = (seed: number = RENDITION_SEED): RandomSource =>
  seededRandom(seed);

/**
 * Choose how the next entry into a track sounds. Tracks without an extended
 * score, and tracks whose chance is zero, always answer chip; otherwise the
 * roll takes a pre-rendered rendition at the track's declared chance and
 * draws evenly among the ones it declares.
 *
 * The choice is made before the assets are known to be present. The
 * director gates on residency, so a chosen-but-unfetched rendition warms
 * the cache and the entry after it gets the higher-fidelity version.
 */
export const pickRendition = (
  definition: MusicTrackDefinition,
  random: RandomSource
): TrackRendition => {
  const candidates = hiFiRenditions(definition);
  if (candidates.length === 0 || definition.hiFiChance <= 0) return definition.renditions.chip;
  if (random.next() >= definition.hiFiChance) return definition.renditions.chip;
  return candidates[drawIndex(random, candidates.length)] ?? definition.renditions.chip;
};
