# Music

NES-style chip tunes for Catalyst Castellum, composed as Partitura
`production_piece` sources and rendered offline to OGG. Nothing here runs at
game runtime; the game ships only `public/audio/*.ogg`.

## Tracks

| Source         | Game state          | Character                                   |
| -------------- | ------------------- | ------------------------------------------- |
| `menu.rb`      | Title / menu        | Dignified, mysterious, sparse (no noise)    |
| `interlude.rb` | Between assaults    | Calm resolve, planning-phase breathing room |
| `assault.rb`   | Normal assault      | Driving riff engine                         |
| `danger.rb`    | Assault going badly | The assault theme, faster, minor, busier    |
| `boss.rb`      | Boss assault        | Hectic epic loop, invariant ostinato        |

## Pipeline

```bash
music/build.sh          # export MIDI + render all tracks to public/audio/
music/build.sh assault  # rebuild one track
```

Requires the sibling checkout `../sigillum-library` (Partitura), python3 with
`mido`/`numpy` (for `tooling/nes_render.py`), and `ffmpeg`. Intermediates land
in `outputs/` (gitignored).

## Runtime integration

`src/audio/` plays these tracks in-game as per-voice stems. `tracks.ts`
carries each track's bpm/bar/stem metadata (keep it in sync with the
sources). The music director switches tracks on bar/beat boundaries of the
outgoing loop (lead drops fast, bed lingers and washes into a shared
reverb; the incoming lead can hold back a couple of bars), and mood changes
on the same track ramp stem layers and effect sends in place with no
switch at all - `src/audio/moods.ts` is the mix vocabulary and
`src/audio/cue.ts` decides which track+mood each game state wants.

## Conventions

- Fixed roster order (the renderer assigns voices by pitched-track order):
  `:pulse1` (Clarinet) → 50% square lead, `:pulse2` (Oboe) → 25% square,
  `:triangle` (Violoncello) → triangle bass, `:noise` (Percussion,
  `family: :percussion`) → noise kit on MIDI channel 10.
- Noise vocabulary is GM drum pitches: kick `C2`, snare `D2`, closed hat
  `F#2`, open hat `A#2`.
- Technique references live in sigillum-library: `partitura cards chip`
  (cards `CT1`–`CT8`) and `docs/research/chiptune_nes_composition.md` there.
- Loops are seamless: every track ends on a dominant or fill resolving into
  bar 1.
- Per sigillum-library rules, note lists are written out literally — no
  helpers or loops that stamp out notes.
