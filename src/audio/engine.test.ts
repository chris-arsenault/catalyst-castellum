// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioEngine, type AudioEngine, type StemEntry } from "./engine";
import { MUSIC_TRACKS } from "./tracks";

interface ParamEvent {
  kind: "set" | "target" | "curveIn" | "curveOut" | "cancel";
  value: number;
  time: number;
}

interface FakeParam {
  value: number;
  events: ParamEvent[];
  setValueAtTime: (value: number, time: number) => void;
  setTargetAtTime: (value: number, time: number, timeConstant: number) => void;
  setValueCurveAtTime: (curve: Float32Array, time: number, duration: number) => void;
  cancelScheduledValues: (time: number) => void;
}

const fakeParam = (initial: number): FakeParam => {
  const param: FakeParam = {
    value: initial,
    events: [],
    setValueAtTime: (value, time) => {
      param.value = value;
      param.events.push({ kind: "set", value, time });
    },
    setTargetAtTime: (value, time) => {
      param.value = value;
      param.events.push({ kind: "target", value, time });
    },
    setValueCurveAtTime: (curve, time) => {
      const last = curve[curve.length - 1] ?? 0;
      param.events.push({
        kind: last > (curve[0] ?? 0) ? "curveIn" : "curveOut",
        value: last,
        time,
      });
    },
    cancelScheduledValues: (time) => {
      param.events.push({ kind: "cancel", value: 0, time });
    },
  };
  return param;
};

interface FakeNode {
  kind: string;
  gain: FakeParam;
  connections: FakeNode[];
  connect: (target: FakeNode) => void;
  disconnect: () => void;
  disconnected: boolean;
  // Source-only fields, harmlessly present everywhere.
  buffer: unknown;
  loop: boolean;
  playbackRate: FakeParam;
  startedAt: number[];
  stopped: boolean;
  onended: (() => void) | null;
  start: (when?: number) => void;
  stop: (when?: number) => void;
  // FX-only fields.
  delayTime: FakeParam;
  frequency: FakeParam;
  type: string;
}

const fakeNode = (kind: string): FakeNode => {
  const node: FakeNode = {
    kind,
    gain: fakeParam(1),
    connections: [],
    connect: (target) => node.connections.push(target),
    disconnect: () => {
      node.disconnected = true;
    },
    disconnected: false,
    buffer: null,
    loop: false,
    playbackRate: fakeParam(1),
    startedAt: [],
    stopped: false,
    onended: null,
    start: (when = 0) => node.startedAt.push(when),
    stop: () => {
      node.stopped = true;
    },
    delayTime: fakeParam(0),
    frequency: fakeParam(0),
    type: "",
  };
  return node;
};

interface FakeContextHarness {
  nodes: Record<string, FakeNode[]>;
  destination: FakeNode;
  setTime: (time: number) => void;
  instance: Record<string, unknown>;
}

const createFakeContext = (): FakeContextHarness => {
  const nodes: Record<string, FakeNode[]> = {
    gain: [],
    source: [],
    convolver: [],
    delay: [],
    filter: [],
  };
  const destination = fakeNode("destination");
  const make = (kind: string): FakeNode => {
    const node = fakeNode(kind);
    nodes[kind]?.push(node);
    return node;
  };
  const instance: Record<string, unknown> = {
    currentTime: 0,
    state: "suspended",
    sampleRate: 1000,
    destination,
    resume: () => {
      instance["state"] = "running";
      return Promise.resolve();
    },
    createGain: () => make("gain"),
    createBufferSource: () => make("source"),
    createConvolver: () => make("convolver"),
    createDelay: () => make("delay"),
    createBiquadFilter: () => make("filter"),
    createBuffer: (channels: number, length: number, sampleRate: number) => ({
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length),
    }),
    decodeAudioData: () => Promise.resolve({ duration: 10 }),
  };
  return {
    nodes,
    destination,
    instance,
    setTime: (time) => {
      instance["currentTime"] = time;
    },
  };
};

const stemEntry = (overrides: Partial<StemEntry>): StemEntry => ({
  voice: "pulse1",
  buffer: { duration: 10 } as AudioBuffer,
  entryOffset: 0,
  fadeSeconds: 0,
  layerLevel: 1,
  reverbSend: 0.2,
  delaySend: 0.1,
  ...overrides,
});

const asParam = (param: AudioParam | undefined): FakeParam => param as unknown as FakeParam;
const asSource = (source: AudioBufferSourceNode | undefined): FakeNode =>
  source as unknown as FakeNode;

let context: FakeContextHarness;
let engine: AudioEngine;

const unlockedEngine = async (): Promise<AudioEngine> => {
  const built = createAudioEngine();
  await built.unlock();
  return built;
};

beforeEach(async () => {
  context = createFakeContext();
  // Must be constructible (`new window.AudioContext()`), so no arrow here.
  vi.stubGlobal("AudioContext", function AudioContextStub(this: unknown) {
    return context.instance;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) })
    )
  );
  engine = await unlockedEngine();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("audio engine lifecycle", () => {
  it("builds the bus graph and FX rack on unlock", () => {
    expect(engine.unlocked()).toBe(true);
    // Master bus reaches the destination; convolver and delay exist.
    expect(context.destination.kind).toBe("destination");
    expect(context.nodes["convolver"]).toHaveLength(1);
    expect(context.nodes["delay"]).toHaveLength(1);
    expect(context.nodes["convolver"]?.[0]?.buffer).not.toBeNull();
  });

  it("caches decoded buffers by url", async () => {
    const first = await engine.loadBuffer("a.ogg");
    const second = await engine.loadBuffer("a.ogg");
    expect(first).toBe(second);
    expect(vi.mocked(window.fetch)).toHaveBeenCalledTimes(1);
  });

  it("retunes the shared delay to the beat", () => {
    engine.setDelayForBeat(0.5);
    const delay = context.nodes["delay"]?.[0];
    expect(delay?.delayTime.events.at(-1)?.value).toBeCloseTo(0.375, 6);
  });
});

const CHIP_MENU = MUSIC_TRACKS.menu.renditions.chip;
const CHIP_ASSAULT = MUSIC_TRACKS.assault.renditions.chip;
const MIX_BOSS = MUSIC_TRACKS.boss.renditions.orchestral!;

describe("audio engine voice groups", () => {
  it("starts all voices sample-aligned with layer and send levels applied", () => {
    const entries = [
      stemEntry({ voice: "pulse1", layerLevel: 0, delaySend: 0.2 }),
      stemEntry({ voice: "triangle", layerLevel: 1, delaySend: 0 }),
    ];
    const group = engine.startTrackVoices("menu", CHIP_MENU, 2, entries);
    expect(group).not.toBeNull();
    const sources = context.nodes["source"] ?? [];
    expect(sources).toHaveLength(2);
    expect(sources[0]?.startedAt).toEqual([2]);
    expect(sources[1]?.startedAt).toEqual([2]);
    expect(sources[0]?.loop).toBe(true);
    expect(group?.grid.secondsPerBeat).toBeCloseTo(10 / (24 * 4), 6);
    const lead = group?.stems[0];
    expect(lead?.layer.gain.value).toBe(0);
    expect(lead?.delaySend.gain.value).toBeCloseTo(0.2, 6);
  });

  it("delays the lead entry with a fade-in curve at its offset", () => {
    const group = engine.startTrackVoices("menu", CHIP_MENU, 1, [
      stemEntry({ voice: "pulse1", entryOffset: 3, fadeSeconds: 0.5 }),
    ]);
    const envelope = asParam(group?.stems[0]?.envelope.gain);
    const curve = envelope.events.find((event) => event.kind === "curveIn");
    expect(envelope.events[0]).toMatchObject({ kind: "set", value: 0 });
    expect(curve?.time).toBeCloseTo(4, 6);
  });

  it("releases lead fast and bed slow, washing the bed into the reverb", () => {
    const group = engine.startTrackVoices("assault", CHIP_ASSAULT, 0, [
      stemEntry({ voice: "pulse1" }),
      stemEntry({ voice: "noise" }),
    ]);
    if (!group) throw new Error("group missing");
    engine.releaseTrackVoices(group, 1, 0.2, 1.5, 0.5);
    const leadOut = asParam(group.stems[0]?.envelope.gain).events.find(
      (e) => e.kind === "curveOut"
    );
    const bedOut = asParam(group.stems[1]?.envelope.gain).events.find((e) => e.kind === "curveOut");
    expect(leadOut?.time).toBeCloseTo(1, 6);
    expect(bedOut?.time).toBeCloseTo(1, 6);
    expect(asParam(group.stems[1]?.reverbSend.gain).events.at(-1)).toMatchObject({
      kind: "target",
      value: 0.5,
    });
  });
});

describe("audio engine release lifecycle", () => {
  it("revives a released group when the cancel function runs in time", () => {
    vi.useFakeTimers();
    try {
      const group = engine.startTrackVoices("menu", CHIP_MENU, 0, [stemEntry({})]);
      if (!group) throw new Error("group missing");
      const cancel = engine.releaseTrackVoices(group, 1, 0.2, 0.4, 0);
      cancel();
      vi.runAllTimers();
      expect(asSource(group.stems[0]?.source).stopped).toBe(false);
      const events = asParam(group.stems[0]?.envelope.gain).events;
      expect(events.at(-1)).toMatchObject({ kind: "set", value: 1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops and disconnects the group after the release completes", () => {
    vi.useFakeTimers();
    try {
      const group = engine.startTrackVoices("menu", CHIP_MENU, 0, [stemEntry({})]);
      if (!group) throw new Error("group missing");
      engine.releaseTrackVoices(group, 0.5, 0.2, 0.4, 0);
      vi.runAllTimers();
      expect(asSource(group.stems[0]?.source).stopped).toBe(true);
      expect(asSource(group.stems[0]?.source).disconnected).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ramps mood levels onto layers and sends, lead-only delay", () => {
    const group = engine.startTrackVoices("assault", CHIP_ASSAULT, 0, [
      stemEntry({ voice: "pulse1" }),
      stemEntry({ voice: "pulse2" }),
    ]);
    if (!group) throw new Error("group missing");
    engine.rampGroupMood(
      group,
      {
        levels: { pulse1: 1, pulse2: 0.5, triangle: 1, noise: 1, mix: 1 },
        reverb: 0.3,
        leadDelay: 0.15,
      },
      1.2
    );
    expect(asParam(group.stems[1]?.layer.gain).events.at(-1)).toMatchObject({
      kind: "target",
      value: 0.5,
    });
    expect(asParam(group.stems[0]?.delaySend.gain).events.at(-1)).toMatchObject({
      kind: "target",
      value: 0.15,
    });
    expect(asParam(group.stems[1]?.delaySend.gain).events.at(-1)).toMatchObject({
      kind: "target",
      value: 0,
    });
  });
});

describe("audio engine pre-rendered renditions", () => {
  it("grids a single-voice rendition on its own bar count", () => {
    const group = engine.startTrackVoices("boss", MIX_BOSS, 0, [stemEntry({ voice: "mix" })]);
    expect(group?.rendition.rendition).toBe("orchestral");
    expect(group?.grid.secondsPerBeat).toBeCloseTo(10 / (MIX_BOSS.bars * 4), 6);
  });

  it("treats the mix voice as the lead for delay and release", () => {
    const group = engine.startTrackVoices("boss", MIX_BOSS, 0, [stemEntry({ voice: "mix" })]);
    if (!group) throw new Error("group missing");
    engine.rampGroupMood(
      group,
      {
        levels: { pulse1: 0, pulse2: 0, triangle: 0, noise: 0, mix: 0.8 },
        reverb: 0.25,
        leadDelay: 0.16,
      },
      1.2
    );
    expect(asParam(group.stems[0]?.layer.gain).events.at(-1)).toMatchObject({
      kind: "target",
      value: 0.8,
    });
    expect(asParam(group.stems[0]?.delaySend.gain).events.at(-1)).toMatchObject({
      kind: "target",
      value: 0.16,
    });

    // The lone voice takes the lead fade, never the slow bed fade: a zero
    // lead fade cuts it outright instead of scheduling a bed-length curve.
    engine.releaseTrackVoices(group, 1, 0, 1.5, 0);
    const events = asParam(group.stems[0]?.envelope.gain).events;
    expect(events.some((event) => event.kind === "curveOut")).toBe(false);
    expect(events.at(-1)).toMatchObject({ kind: "set", value: 0, time: 1 });
  });
});

describe("audio engine buffer residency", () => {
  it("reports a url as resident only once its decode has finished", async () => {
    expect(engine.isBufferResident("late.ogg")).toBe(false);
    const pending = engine.loadBuffer("late.ogg");
    expect(engine.isBufferResident("late.ogg")).toBe(false);
    await pending;
    expect(engine.isBufferResident("late.ogg")).toBe(true);
  });

  it("leaves a failed fetch out of residency", async () => {
    vi.mocked(window.fetch).mockResolvedValueOnce({ ok: false } as Response);
    expect(await engine.loadBuffer("missing.ogg")).toBeNull();
    expect(engine.isBufferResident("missing.ogg")).toBe(false);
  });
});

describe("audio engine sound effects", () => {
  it("plays one-shots through the SFX bus with a reverb send", async () => {
    await engine.playSfx("sfx.ogg", 0.6, 1.2, 0.25);
    const source = context.nodes["source"]?.at(-1);
    expect(source?.startedAt).toHaveLength(1);
    expect(source?.playbackRate.value).toBeCloseTo(1.2, 6);
    source?.onended?.();
    expect(source?.disconnected).toBe(true);
  });

  it("does nothing before unlock", async () => {
    const locked = createAudioEngine();
    await locked.playSfx("sfx.ogg", 1, 1, 0);
    expect(locked.unlocked()).toBe(false);
    expect(locked.now()).toBe(0);
  });
});
