import { createFxRack, type FxRack } from "./fx";
import { getAudioSettings, subscribeAudioSettings } from "./settings";
import type { MusicTrackName, StemMood, TrackRendition, VoiceName } from "./types";
import type { MusicalGrid } from "./quantize";

/**
 * One playing voice: its single-use source plus three gain stages -
 * `envelope` (transition fades in/out), `layer` (vertical mood mix), and
 * the wet-only `reverbSend`/`delaySend` taps into the shared FX rack.
 * Keeping envelope and layer separate means a transition fade never fights
 * a mood ramp on the same param.
 */
export interface StemVoice {
  voice: VoiceName;
  source: AudioBufferSourceNode;
  envelope: GainNode;
  layer: GainNode;
  reverbSend: GainNode;
  delaySend: GainNode;
}

/**
 * Every voice of one rendition of one track, started sample-aligned on one
 * musical grid. A chip group carries three or four voices and a
 * pre-rendered group carries one; everything downstream reads the group's
 * rendition rather than counting voices.
 */
export interface MusicVoiceGroup {
  track: MusicTrackName;
  rendition: TrackRendition;
  grid: MusicalGrid;
  startsAt: number;
  stems: StemVoice[];
}

/** How one voice enters when its group starts. */
export interface StemEntry {
  voice: VoiceName;
  buffer: AudioBuffer;
  /** Seconds after the group start before this voice fades in. */
  entryOffset: number;
  fadeSeconds: number;
  layerLevel: number;
  reverbSend: number;
  delaySend: number;
}

export interface AudioEngine {
  readonly supported: boolean;
  unlocked(): boolean;
  now(): number;
  unlock(): Promise<boolean>;
  loadBuffer(url: string): Promise<AudioBuffer | null>;
  /**
   * True once a URL has decoded and is cached. The director gates
   * pre-rendered renditions on this so a cue never waits on a download.
   */
  isBufferResident(url: string): boolean;
  startTrackVoices(
    track: MusicTrackName,
    rendition: TrackRendition,
    when: number,
    entries: StemEntry[]
  ): MusicVoiceGroup | null;
  /**
   * Fade a group out beginning at `when` (lead fast, bed slow, optionally
   * washing the bed into the shared reverb) and stop it afterwards. The
   * returned function cancels everything and revives the group if called
   * before the fade begins.
   */
  releaseTrackVoices(
    group: MusicVoiceGroup,
    when: number,
    leadFade: number,
    bedFade: number,
    washOut: number
  ): () => void;
  /** Cancel a group that was scheduled but has not reached its start yet. */
  cancelScheduledGroup(group: MusicVoiceGroup): void;
  /** Ramp a playing group's stem levels and sends to a mood, in place. */
  rampGroupMood(group: MusicVoiceGroup, mood: StemMood, rampSeconds: number): void;
  /** Retune the shared delay to the current track's tempo. */
  setDelayForBeat(secondsPerBeat: number): void;
  /** One-shot sound effect through the SFX bus with a reverb send. */
  playSfx(url: string, gain: number, playbackRate: number, reverbSend: number): Promise<void>;
}

interface EngineNodes {
  context: AudioContext;
  masterBus: GainNode;
  musicBus: GainNode;
  sfxBus: GainNode;
  fx: FxRack;
}

interface EngineState {
  nodes: EngineNodes | null;
  unlocked: boolean;
  buffers: Map<string, Promise<AudioBuffer | null>>;
  /** URLs whose decode has finished, so callers can avoid awaiting one. */
  resident: Set<string>;
}

const CURVE_LENGTH = 65;

const buildEqualPowerCurves = (): { in: Float32Array; out: Float32Array } => {
  const fadeIn = new Float32Array(CURVE_LENGTH);
  const fadeOut = new Float32Array(CURVE_LENGTH);
  for (let i = 0; i < CURVE_LENGTH; i += 1) {
    const t = i / (CURVE_LENGTH - 1);
    fadeIn[i] = Math.sin((t * Math.PI) / 2);
    fadeOut[i] = Math.cos((t * Math.PI) / 2);
  }
  return { in: fadeIn, out: fadeOut };
};

const CURVES = buildEqualPowerCurves();

/** Minimum lead time for value-curve automation to start cleanly. */
const SCHEDULE_PAD = 0.02;

const applySettingsTo = (nodes: EngineNodes): void => {
  const { muted, musicVolume, sfxVolume } = getAudioSettings();
  const now = nodes.context.currentTime;
  // Short ramps avoid clicks when the user drags a slider or toggles mute.
  nodes.masterBus.gain.setTargetAtTime(muted ? 0 : 1, now, 0.02);
  nodes.musicBus.gain.setTargetAtTime(musicVolume, now, 0.02);
  nodes.sfxBus.gain.setTargetAtTime(sfxVolume, now, 0.02);
};

const buildNodes = (): EngineNodes | null => {
  let context: AudioContext;
  try {
    context = new window.AudioContext();
  } catch {
    return null;
  }
  const masterBus = context.createGain();
  const musicBus = context.createGain();
  const sfxBus = context.createGain();
  musicBus.connect(masterBus);
  sfxBus.connect(masterBus);
  masterBus.connect(context.destination);
  // The FX rack returns into the master bus so music and SFX share the
  // same hall, and mute silences wet tails along with the dry signal.
  const fx = createFxRack(context, masterBus);
  const nodes = { context, masterBus, musicBus, sfxBus, fx };
  applySettingsTo(nodes);
  subscribeAudioSettings(() => applySettingsTo(nodes));
  return nodes;
};

const decode = async (context: AudioContext, url: string): Promise<AudioBuffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    return await context.decodeAudioData(bytes);
  } catch {
    return null;
  }
};

const loadBufferWith = (state: EngineState, url: string): Promise<AudioBuffer | null> => {
  const cached = state.buffers.get(url);
  if (cached) return cached;
  if (!state.nodes) return Promise.resolve(null);
  const pending = decode(state.nodes.context, url).then((buffer) => {
    if (buffer === null) state.buffers.delete(url);
    else state.resident.add(url);
    return buffer;
  });
  state.buffers.set(url, pending);
  return pending;
};

const startStemVoice = (nodes: EngineNodes, entry: StemEntry, startsAt: number): StemVoice => {
  const { context } = nodes;
  const source = context.createBufferSource();
  source.buffer = entry.buffer;
  source.loop = true;
  const envelope = context.createGain();
  const layer = context.createGain();
  const reverbSend = context.createGain();
  const delaySend = context.createGain();
  source.connect(envelope);
  envelope.connect(layer);
  layer.connect(nodes.musicBus);
  layer.connect(reverbSend);
  layer.connect(delaySend);
  reverbSend.connect(nodes.fx.reverbInput);
  delaySend.connect(nodes.fx.delayInput);

  layer.gain.setValueAtTime(entry.layerLevel, context.currentTime);
  reverbSend.gain.setValueAtTime(entry.reverbSend, context.currentTime);
  delaySend.gain.setValueAtTime(entry.delaySend, context.currentTime);
  if (entry.fadeSeconds > 0 || entry.entryOffset > 0) {
    envelope.gain.setValueAtTime(0, context.currentTime);
    const fade = Math.max(entry.fadeSeconds, 0.05);
    envelope.gain.setValueCurveAtTime(CURVES.in, startsAt + entry.entryOffset, fade);
  } else {
    envelope.gain.setValueAtTime(1, context.currentTime);
  }
  source.start(startsAt);
  return { voice: entry.voice, source, envelope, layer, reverbSend, delaySend };
};

const startTrackVoicesWith = (
  nodes: EngineNodes,
  track: MusicTrackName,
  rendition: TrackRendition,
  when: number,
  entries: StemEntry[]
): MusicVoiceGroup | null => {
  const first = entries[0];
  if (!first) return null;
  const startsAt = Math.max(when, nodes.context.currentTime + SCHEDULE_PAD);
  const stems = entries.map((entry) => startStemVoice(nodes, entry, startsAt));
  const secondsPerBeat = first.buffer.duration / (rendition.bars * rendition.beatsPerBar);
  return {
    track,
    rendition,
    grid: { startTime: startsAt, secondsPerBeat, beatsPerBar: rendition.beatsPerBar },
    startsAt,
    stems,
  };
};

const scheduleStemFade = (voice: StemVoice, at: number, fadeSeconds: number): void => {
  try {
    if (fadeSeconds > 0) {
      voice.envelope.gain.setValueCurveAtTime(CURVES.out, at, fadeSeconds);
    } else {
      voice.envelope.gain.setValueAtTime(0, at);
    }
  } catch {
    // Param automation unavailable mid-teardown; the stop timer still runs.
  }
};

const stopGroupNow = (group: MusicVoiceGroup): void => {
  for (const voice of group.stems) {
    try {
      voice.source.stop();
    } catch {
      // Never started or already stopped - fine either way.
    }
    voice.source.disconnect();
    voice.envelope.disconnect();
    voice.layer.disconnect();
    voice.reverbSend.disconnect();
    voice.delaySend.disconnect();
  }
};

const releaseTrackVoicesWith = (
  nodes: EngineNodes,
  group: MusicVoiceGroup,
  when: number,
  leadFade: number,
  bedFade: number,
  washOut: number
): (() => void) => {
  const { context } = nodes;
  const at = Math.max(when, context.currentTime + SCHEDULE_PAD);
  const { leadVoice } = group.rendition;
  for (const voice of group.stems) {
    scheduleStemFade(voice, at, voice.voice === leadVoice ? leadFade : bedFade);
    if (washOut > 0) {
      // Push the dying bed into the shared reverb so it washes out
      // instead of just getting quieter.
      voice.reverbSend.gain.setTargetAtTime(washOut, at, bedFade / 2 + 0.05);
    }
  }
  const longest = Math.max(leadFade, bedFade);
  const cleanupDelay = Math.max(0, at + longest - context.currentTime) + 0.15;
  const timer = window.setTimeout(() => stopGroupNow(group), cleanupDelay * 1000);
  return () => {
    window.clearTimeout(timer);
    for (const voice of group.stems) {
      try {
        voice.envelope.gain.cancelScheduledValues(context.currentTime);
        voice.envelope.gain.setValueAtTime(1, context.currentTime);
        voice.reverbSend.gain.cancelScheduledValues(context.currentTime);
      } catch {
        // Keep playing at whatever level it had.
      }
    }
  };
};

const rampGroupMoodWith = (
  nodes: EngineNodes,
  group: MusicVoiceGroup,
  mood: StemMood,
  rampSeconds: number
): void => {
  const now = nodes.context.currentTime;
  const { leadVoice } = group.rendition;
  // setTargetAtTime reaches ~95% of target after 3 time constants.
  const timeConstant = Math.max(rampSeconds / 3, 0.05);
  for (const voice of group.stems) {
    voice.layer.gain.setTargetAtTime(mood.levels[voice.voice], now, timeConstant);
    voice.reverbSend.gain.setTargetAtTime(mood.reverb, now, timeConstant);
    voice.delaySend.gain.setTargetAtTime(
      voice.voice === leadVoice ? mood.leadDelay : 0,
      now,
      timeConstant
    );
  }
};

const playSfxWith = async (
  state: EngineState,
  url: string,
  gainValue: number,
  playbackRate: number,
  reverbSend: number
): Promise<void> => {
  if (!state.unlocked || !state.nodes) return;
  const buffer = await loadBufferWith(state, url);
  if (!buffer || !state.nodes) return;
  const { context, sfxBus, fx } = state.nodes;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  const gain = context.createGain();
  gain.gain.value = gainValue;
  source.connect(gain);
  gain.connect(sfxBus);
  const send = context.createGain();
  send.gain.value = reverbSend;
  gain.connect(send);
  send.connect(fx.reverbInput);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
    send.disconnect();
  };
  source.start(context.currentTime + SCHEDULE_PAD);
};

/**
 * Web Audio wrapper: context lifecycle (browsers require a user gesture
 * before audio may start), master/music/sfx buses, the shared FX rack,
 * decoded-buffer cache, sample-aligned stem groups, and one-shot effects.
 * Every method no-ops safely where Web Audio is unavailable (jsdom, old
 * browsers), so callers never need to guard.
 */
export const createAudioEngine = (): AudioEngine => {
  const supported = typeof window !== "undefined" && typeof window.AudioContext === "function";
  const state: EngineState = {
    nodes: null,
    unlocked: false,
    buffers: new Map(),
    resident: new Set(),
  };

  const unlock = async (): Promise<boolean> => {
    if (!supported) return false;
    state.nodes ??= buildNodes();
    if (!state.nodes) return false;
    if (state.nodes.context.state !== "running") {
      try {
        await state.nodes.context.resume();
      } catch {
        return false;
      }
    }
    state.unlocked = state.nodes.context.state === "running";
    return state.unlocked;
  };

  return {
    supported,
    unlocked: () => state.unlocked && state.nodes?.context.state === "running",
    now: () => state.nodes?.context.currentTime ?? 0,
    unlock,
    loadBuffer: (url) => loadBufferWith(state, url),
    isBufferResident: (url) => state.resident.has(url),
    startTrackVoices: (track, rendition, when, entries) =>
      state.nodes ? startTrackVoicesWith(state.nodes, track, rendition, when, entries) : null,
    releaseTrackVoices: (group, when, leadFade, bedFade, washOut) =>
      state.nodes
        ? releaseTrackVoicesWith(state.nodes, group, when, leadFade, bedFade, washOut)
        : () => {},
    cancelScheduledGroup: stopGroupNow,
    rampGroupMood: (group, mood, rampSeconds) => {
      if (state.nodes) rampGroupMoodWith(state.nodes, group, mood, rampSeconds);
    },
    setDelayForBeat: (secondsPerBeat) => {
      state.nodes?.fx.setDelayForBeat(secondsPerBeat);
    },
    playSfx: (url, gain, playbackRate, reverbSend) =>
      playSfxWith(state, url, gain, playbackRate, reverbSend),
  };
};

let sharedEngine: AudioEngine | null = null;

export const getAudioEngine = (): AudioEngine => {
  sharedEngine ??= createAudioEngine();
  return sharedEngine;
};
