"""NES-style (2A03) MIDI renderer: MIDI -> WAV with square/triangle/noise voices.

Voice convention (matches the sigillum-library `dsl:chip` cards):
  - Pitched MIDI channels are assigned by track order:
      1st pitched track -> pulse 1 (50% duty square)
      2nd pitched track -> pulse 2 (25% duty square)
      3rd pitched track -> triangle (4-bit quantized)
      further tracks cycle the same three voices
  - MIDI channel 10 (drums) -> noise channel, keyed by GM pitch:
      kick 36 (C2), snare 38 (D2), closed hat 42 (F#2), open hat 46 (A#2)

Usage: python3 tooling/nes_render.py IN.mid OUT.wav
Requires: mido, numpy. Convert onward with ffmpeg (e.g. -c:a libvorbis).
"""
import sys
import wave

import mido
import numpy as np

SR = 44100


def square(freq, dur, duty=0.5, vol=0.35):
    t = np.arange(int(dur * SR)) / SR
    phase = (t * freq) % 1.0
    w = np.where(phase < duty, 1.0, -1.0) * vol
    env = np.minimum(1.0, t / 0.005) * np.exp(-t * 1.2)
    return w * env


def triangle(freq, dur, vol=0.5):
    t = np.arange(int(dur * SR)) / SR
    phase = (t * freq) % 1.0
    w = 4 * np.abs(phase - 0.5) - 1.0
    # quantize to the 2A03 triangle's coarse steps
    w = np.round(w * 7) / 7 * vol
    env = np.minimum(1.0, t / 0.005)
    return w * env


# GM drum pitch -> (sample-hold period, decay rate, volume), imitating the
# 2A03 noise channel's period register: longer hold = darker noise.
NOISE_VOICES = {
    36: (40, 25.0, 0.50),  # kick: dark thump
    38: (8, 18.0, 0.35),   # snare: mid burst
    42: (2, 35.0, 0.15),   # closed hat: short bright tick
    46: (2, 8.0, 0.20),    # open hat: bright sizzle
}


def noise(dur, note):
    hold, decay, vol = NOISE_VOICES.get(note, (8, 18.0, 0.3))
    n = int(dur * SR)
    steps = n // hold + 1
    w = np.repeat(np.random.default_rng(note).choice([-1.0, 1.0], steps), hold)[:n]
    t = np.arange(n) / SR
    return w * vol * np.exp(-t * decay)


def tick_clock(mid):
    tempos = []
    for track in mid.tracks:
        abs_t = 0
        for msg in track:
            abs_t += msg.time
            if msg.type == "set_tempo":
                tempos.append((abs_t, msg.tempo))
    tempos.sort(key=lambda pair: pair[0])
    if not tempos or tempos[0][0] > 0:
        tempos.insert(0, (0, 500000))
    tpb = mid.ticks_per_beat

    def tick_to_sec(tick):
        sec, last_tick, last_tempo = 0.0, 0, 500000
        for at, tempo in tempos:
            if at >= tick:
                break
            sec += (at - last_tick) * last_tempo / tpb / 1e6
            last_tick, last_tempo = at, tempo
        return sec + (tick - last_tick) * last_tempo / tpb / 1e6

    return tick_to_sec


def track_notes(track):
    abs_t, active, notes = 0, {}, []
    for msg in track:
        abs_t += msg.time
        if msg.type == "note_on" and msg.velocity > 0:
            active[msg.note] = (abs_t, msg.velocity)
        elif msg.type in ("note_off", "note_on") and msg.note in active:
            start, vel = active.pop(msg.note)
            notes.append((start, abs_t, msg.note, vel, msg.channel))
    return notes


def render_stems_data(midi_path):
    mid = mido.MidiFile(midi_path)
    t2s = tick_clock(mid)
    tracks = [notes for notes in (track_notes(t) for t in mid.tracks) if notes]
    if not tracks:
        raise SystemExit("no notes in " + midi_path)

    # End exactly at the last note-off: the voices carry no release tail, so
    # any padding is silence that would gap a seamless game loop.
    end = max(t2s(stop) for tr in tracks for _, stop, *_ in tr)
    samples = int(end * SR) + 1
    voices = [
        ("pulse1", lambda f, d: square(f, d, duty=0.5)),
        ("pulse2", lambda f, d: square(f, d, duty=0.25)),
        ("triangle", triangle),
    ]
    stems = {}
    pitched_seen = 0
    for tr in tracks:
        is_drums = tr[0][4] == 9
        if is_drums:
            name, voice = "noise", None
        else:
            name, voice = voices[pitched_seen % 3]
            pitched_seen += 1
        stem = stems.setdefault(name, np.zeros(samples))
        for start, stop, note, vel, channel in tr:
            s = t2s(start)
            dur = max(t2s(stop) - s, 0.02)
            if is_drums:
                w = noise(min(dur, 0.25), note)
            else:
                freq = 440.0 * 2 ** ((note - 69) / 12)
                w = voice(freq, dur) * (vel / 127)
            idx = int(s * SR)
            stem[idx:idx + len(w)] += w[: len(stem) - idx]
    return stems, end


def write_wav(path, samples):
    pcm = (samples * 32767).astype(np.int16)
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def render(midi_path, wav_path):
    stems, end = render_stems_data(midi_path)
    mix = sum(stems.values())
    peak = np.max(np.abs(mix))
    if peak > 0:
        mix = mix / peak * 0.85
    write_wav(wav_path, mix)
    print(f"wrote {wav_path} ({end:.1f}s)")


def render_stems(midi_path, out_dir):
    """One WAV per NES voice, all exactly the same length so the game can
    start them sample-aligned and mix layers live. Stems share one global
    normalization factor so their in-game sum matches the offline mix."""
    import os

    stems, end = render_stems_data(midi_path)
    os.makedirs(out_dir, exist_ok=True)
    peak = np.max(np.abs(sum(stems.values())))
    scale = 0.85 / peak if peak > 0 else 1.0
    for name, samples in sorted(stems.items()):
        path = os.path.join(out_dir, f"{name}.wav")
        write_wav(path, samples * scale)
        print(f"wrote {path} ({end:.1f}s)")


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[2] == "--stems":
        render_stems(sys.argv[1], sys.argv[3])
    elif len(sys.argv) == 3:
        render(sys.argv[1], sys.argv[2])
    else:
        raise SystemExit(
            "usage: nes_render.py IN.mid OUT.wav | nes_render.py IN.mid --stems OUT_DIR"
        )
