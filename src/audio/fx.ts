/**
 * Shared master effects rack: one convolution reverb and one tempo-synced
 * feedback delay, fed by per-stem (and per-SFX) send gains. Sends are
 * wet-only; the dry path always runs straight through the music/SFX buses.
 */
export interface FxRack {
  reverbInput: GainNode;
  delayInput: GainNode;
  /** Retune the delay to a new tempo (dotted-eighth of the beat). */
  setDelayForBeat(secondsPerBeat: number): void;
}

const REVERB_SECONDS = 2.2;
const REVERB_DECAY_SHAPE = 2.6;
const DELAY_FEEDBACK = 0.35;
const DELAY_TONE_HZ = 2400;
const MAX_DELAY_SECONDS = 1.5;

/** Deterministic xorshift noise: the hall sounds identical every session. */
const createNoiseSource = (seed: number): (() => number) => {
  let value = seed;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    value >>>= 0;
    return (value / 0xffffffff) * 2 - 1;
  };
};

/**
 * Procedural impulse response: exponentially decaying noise with a one-pole
 * smoother so the tail darkens like a real room. No asset required, and a
 * hint of pitch-independent shimmer suits the chip aesthetic.
 */
const buildImpulseResponse = (context: AudioContext): AudioBuffer => {
  const length = Math.floor(REVERB_SECONDS * context.sampleRate);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    const noise = createNoiseSource(0x2a03 + channel * 0x1051);
    let smoothed = 0;
    for (let i = 0; i < length; i += 1) {
      const envelope = (1 - i / length) ** REVERB_DECAY_SHAPE;
      const raw = noise() * envelope;
      smoothed = 0.55 * raw + 0.45 * smoothed;
      data[i] = smoothed;
    }
  }
  return impulse;
};

export const createFxRack = (context: AudioContext, destination: AudioNode): FxRack => {
  const reverbInput = context.createGain();
  const convolver = context.createConvolver();
  convolver.buffer = buildImpulseResponse(context);
  const reverbReturn = context.createGain();
  reverbReturn.gain.value = 0.8;
  reverbInput.connect(convolver);
  convolver.connect(reverbReturn);
  reverbReturn.connect(destination);

  const delayInput = context.createGain();
  const delay = context.createDelay(MAX_DELAY_SECONDS);
  delay.delayTime.value = 0.3;
  const feedback = context.createGain();
  feedback.gain.value = DELAY_FEEDBACK;
  const tone = context.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = DELAY_TONE_HZ;
  const delayReturn = context.createGain();
  delayReturn.gain.value = 0.9;
  delayInput.connect(delay);
  delay.connect(tone);
  tone.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayReturn);
  delayReturn.connect(destination);

  return {
    reverbInput,
    delayInput,
    setDelayForBeat: (secondsPerBeat) => {
      // Dotted eighth: the classic echo that lands inside the groove.
      const dotted = Math.min(MAX_DELAY_SECONDS, secondsPerBeat * 0.75);
      delay.delayTime.setTargetAtTime(dotted, context.currentTime, 0.08);
    },
  };
};
