import { getAudioEngine, type AudioEngine, type MusicVoiceGroup, type StemEntry } from "./engine";
import { moodSpec, MOOD_RAMP_SECONDS } from "./moods";
import { nextBoundary } from "./quantize";
import { createRenditionRandom, pickRendition } from "./renditions";
import { MUSIC_TRACKS, SFX_DEFINITIONS, voiceUrl } from "./tracks";
import type { RandomSource } from "../game/world/seededRandom";
import type {
  MusicCue,
  MusicCueState,
  MusicTrackName,
  StemMood,
  TrackRendition,
  TransitionPolicy,
} from "./types";

/**
 * Track-to-track handover policies. The switch snaps to a musical boundary
 * of the OUTGOING track; the outgoing lead drops fast while its bed lingers
 * (washing into the shared reverb on dramatic exits), and on de-escalations
 * the incoming lead holds back a couple of its own bars so the new bed
 * establishes first. Mood changes within one track never come through
 * here - they ramp in place.
 */
const DEFAULT_POLICY: TransitionPolicy = {
  quantize: "bar",
  outLeadFade: 0.6,
  outBedFade: 1.2,
  washOut: 0,
  inFade: 1,
  leadEntryBars: 0,
};

const FROM_SILENCE: TransitionPolicy = {
  quantize: "immediate",
  outLeadFade: 0,
  outBedFade: 0,
  washOut: 0,
  inFade: 1.2,
  leadEntryBars: 0,
};

/** Combat arriving from a calm place builds in rather than slamming in. */
const INTO_COMBAT: TransitionPolicy = {
  quantize: "bar",
  outLeadFade: 0.8,
  outBedFade: 2,
  washOut: 0.3,
  inFade: 1.8,
  leadEntryBars: 0,
};

const SPECIFIC_POLICIES: Record<string, TransitionPolicy> = {
  // The one moment that should still snap: the fight tipping into crisis.
  "assault>danger": {
    quantize: "bar",
    outLeadFade: 0.3,
    outBedFade: 0.45,
    washOut: 0.25,
    inFade: 0.4,
    leadEntryBars: 0,
  },
  "interlude>assault": INTO_COMBAT,
  "interlude>boss": INTO_COMBAT,
  "menu>assault": INTO_COMBAT,
  "menu>danger": INTO_COMBAT,
  "menu>boss": INTO_COMBAT,
};

const DE_ESCALATION_TARGETS: ReadonlySet<MusicTrackName> = new Set(["menu", "interlude"]);
const DE_ESCALATION: TransitionPolicy = {
  quantize: "beat",
  outLeadFade: 0.8,
  outBedFade: 3.5,
  washOut: 0.5,
  inFade: 2.5,
  leadEntryBars: 2,
};

export const transitionPolicyFor = (
  from: MusicTrackName | null,
  to: MusicTrackName
): TransitionPolicy => {
  if (from === null) return FROM_SILENCE;
  const specific = SPECIFIC_POLICIES[`${from}>${to}`];
  if (specific) return specific;
  if (DE_ESCALATION_TARGETS.has(to)) return DE_ESCALATION;
  return DEFAULT_POLICY;
};

const sameCue = (left: MusicCue, right: MusicCue): boolean =>
  left?.track === right?.track && left?.mood === right?.mood;

const stemEntriesFor = (
  rendition: TrackRendition,
  buffers: Map<string, AudioBuffer>,
  mood: StemMood,
  policy: TransitionPolicy
): StemEntry[] => {
  const entries: StemEntry[] = [];
  for (const voice of rendition.voices) {
    const buffer = buffers.get(voice);
    if (!buffer) continue;
    const isLead = voice === rendition.leadVoice;
    const barSeconds =
      (buffer.duration / (rendition.bars * rendition.beatsPerBar)) * rendition.beatsPerBar;
    entries.push({
      voice,
      buffer,
      entryOffset: isLead ? policy.leadEntryBars * barSeconds : 0,
      fadeSeconds: policy.inFade,
      layerLevel: mood.levels[voice],
      reverbSend: mood.reverb,
      delaySend: isLead ? mood.leadDelay : 0,
    });
  }
  return entries;
};

interface PendingTransition {
  toCue: MusicCueState;
  incoming: MusicVoiceGroup;
  boundary: number;
  /** Revives the outgoing group if the transition is abandoned in time. */
  cancelOutgoingRelease: () => void;
}

interface VoiceKeeper {
  currentCue(): MusicCue;
  activeGroup(): MusicVoiceGroup | null;
  /** Resolve any in-flight transition so `activeGroup` reports the truth. */
  settle(): void;
  fadeToSilence(): void;
  begin(
    cue: MusicCueState,
    rendition: TrackRendition,
    buffers: Map<string, AudioBuffer>,
    stillWanted: () => boolean
  ): void;
  noteMood(cue: MusicCueState): void;
}

/** Owns the active stem group and the one pending quantized transition. */
const createVoiceKeeper = (engine: AudioEngine): VoiceKeeper => {
  let active: MusicVoiceGroup | null = null;
  let activeCue: MusicCueState | null = null;
  let pending: PendingTransition | null = null;

  const promotePending = (): void => {
    if (!pending) return;
    active = pending.incoming;
    activeCue = pending.toCue;
    pending = null;
  };

  const settle = (): void => {
    if (!pending) return;
    if (engine.now() < pending.boundary) {
      // Not started yet: absorb it and revive the outgoing group. The
      // caller re-applies the current mood, which restores any sends the
      // cancelled wash-out touched.
      engine.cancelScheduledGroup(pending.incoming);
      pending.cancelOutgoingRelease();
      pending = null;
    } else {
      // The boundary already passed: the incoming group is now the music.
      promotePending();
    }
  };

  const begin = (
    cue: MusicCueState,
    rendition: TrackRendition,
    buffers: Map<string, AudioBuffer>,
    stillWanted: () => boolean
  ): void => {
    const from = active;
    const policy = transitionPolicyFor(from?.track ?? null, cue.track);
    const now = engine.now();
    const boundary = from ? nextBoundary(from.grid, now, policy.quantize) : now;
    const mood = moodSpec(cue.track, cue.mood);

    const incoming = engine.startTrackVoices(
      cue.track,
      rendition,
      boundary,
      stemEntriesFor(rendition, buffers, mood, policy)
    );
    if (!incoming) return;
    engine.setDelayForBeat(60 / rendition.bpm);
    if (!from) {
      active = incoming;
      activeCue = cue;
      return;
    }
    const cancelOutgoingRelease = engine.releaseTrackVoices(
      from,
      boundary,
      policy.outLeadFade,
      policy.outBedFade,
      policy.washOut
    );
    pending = { toCue: cue, incoming, boundary, cancelOutgoingRelease };
    const waitMs = Math.max(0, (boundary - engine.now()) * 1000) + 50;
    window.setTimeout(() => {
      if (stillWanted() && pending) promotePending();
    }, waitMs);
  };

  return {
    currentCue: () => pending?.toCue ?? activeCue,
    activeGroup: () => active,
    settle,
    fadeToSilence: () => {
      if (!active) return;
      // Wash the whole soundtrack into the hall on the way out.
      engine.releaseTrackVoices(active, engine.now(), 0.8, 1.8, 0.45);
      active = null;
      activeCue = null;
    },
    begin,
    noteMood: (cue) => {
      activeCue = cue;
    },
  };
};

export interface MusicDirector {
  currentCue(): MusicCue;
  /** Ask for a cue; repeated identical requests are free. */
  setCue(cue: MusicCue): void;
  /** Called once the AudioContext is unlocked; plays the queued cue. */
  onUnlocked(): void;
  /** Warm the chip stems so track handovers never wait on the network. */
  preloadAll(): void;
  playSfx(name: string): void;
}

const loadVoiceBuffers = async (
  engine: AudioEngine,
  track: MusicTrackName,
  rendition: TrackRendition
): Promise<Map<string, AudioBuffer> | null> => {
  const loaded = await Promise.all(
    rendition.voices.map(
      async (voice) =>
        [voice, await engine.loadBuffer(voiceUrl(track, rendition.rendition, voice))] as const
    )
  );
  const buffers = new Map<string, AudioBuffer>();
  for (const [voice, buffer] of loaded) {
    if (buffer === null) return null;
    buffers.set(voice, buffer);
  }
  return buffers;
};

const isResident = (
  engine: AudioEngine,
  track: MusicTrackName,
  rendition: TrackRendition
): boolean =>
  rendition.voices.every((voice) =>
    engine.isBufferResident(voiceUrl(track, rendition.rendition, voice))
  );

/**
 * Decide which realization of `track` this entry plays. The roll happens
 * every time, but a pre-rendered rendition only sounds once its bounce is
 * decoded and cached - so the first roll that wants one warms it in the
 * background and plays chip, and a later entry gets the higher-fidelity
 * version with no wait at the cue. That bounds the fetch to one rendition
 * per entry rather than pulling every bounce on load.
 */
const chooseRendition = (
  engine: AudioEngine,
  track: MusicTrackName,
  random: RandomSource
): TrackRendition => {
  const definition = MUSIC_TRACKS[track];
  const rolled = pickRendition(definition, random);
  if (rolled.rendition === "chip") return rolled;
  if (isResident(engine, track, rolled)) return rolled;
  loadVoiceBuffers(engine, track, rolled).catch(() => {});
  return definition.renditions.chip;
};

/**
 * Adaptive music director combining horizontal resequencing (quantized,
 * staggered track handovers) with vertical layering (mood ramps on the
 * playing track's voices). The game states a cue; the director owns how the
 * soundtrack gets there - including which rendition of the track it is,
 * rolled once per entry and held for as long as that track plays. Cue
 * changes are idempotent, pending transitions are replaced when the game
 * changes its mind before the boundary, and everything queues until the
 * browser lets audio start.
 */
export const createMusicDirector = (
  engine: AudioEngine = getAudioEngine(),
  random: RandomSource = createRenditionRandom()
): MusicDirector => {
  let targetCue: MusicCue = null;
  let requestSequence = 0;
  const voices = createVoiceKeeper(engine);

  const applyTargetCue = async (): Promise<void> => {
    requestSequence += 1;
    const sequence = requestSequence;
    const cue = targetCue;

    voices.settle();
    if (cue === null) {
      voices.fadeToSilence();
      return;
    }

    const activeGroup = voices.activeGroup();
    if (activeGroup && activeGroup.track === cue.track) {
      // Same track: this is a vertical move, and the rendition stays put.
      // Ramp the playing voices in place.
      engine.rampGroupMood(activeGroup, moodSpec(cue.track, cue.mood), MOOD_RAMP_SECONDS);
      voices.noteMood(cue);
      return;
    }

    const rendition = chooseRendition(engine, cue.track, random);
    const buffers = await loadVoiceBuffers(engine, cue.track, rendition);
    // A newer request superseded this one while the buffers decoded.
    if (buffers === null || sequence !== requestSequence) return;
    voices.begin(cue, rendition, buffers, () => sequence === requestSequence);
  };

  const requestApply = (): void => {
    applyTargetCue().catch(() => {});
  };

  return {
    currentCue: voices.currentCue,
    setCue: (cue) => {
      if (sameCue(cue, targetCue)) return;
      targetCue = cue;
      if (!engine.unlocked()) return;
      requestApply();
    },
    onUnlocked: () => {
      if (targetCue !== null || voices.currentCue() !== null) requestApply();
    },
    preloadAll: () => {
      if (!engine.unlocked()) return;
      // Chip stems only: they are small, they are what every cue falls back
      // to, and every track has them. Pre-rendered bounces are minutes of
      // stereo audio and warm themselves the first time their track comes up.
      for (const definition of Object.values(MUSIC_TRACKS)) {
        const { chip } = definition.renditions;
        for (const voice of chip.voices) {
          engine.loadBuffer(voiceUrl(definition.name, "chip", voice)).catch(() => {});
        }
      }
    },
    playSfx: (name) => {
      const definition = SFX_DEFINITIONS[name];
      if (!definition) return;
      engine.playSfx(definition.url, definition.gain, 1, definition.reverb).catch(() => {});
    },
  };
};

let sharedDirector: MusicDirector | null = null;

export const getMusicDirector = (): MusicDirector => {
  sharedDirector ??= createMusicDirector();
  return sharedDirector;
};
