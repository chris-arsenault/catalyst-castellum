# Music

Music for Catalyst Castellum, composed as Partitura `production_piece`
sources. Nothing here runs at game runtime; the game ships only
`public/audio/`.

Every track has a chip rendition: a short NES loop rendered offline to one
OGG per voice, which the game mixes live. Three tracks also have an extended
score — a two-minute composition of the same material, at the same key and
tempo — exported as MIDI and MusicXML for production as an orchestral or
electronic version. The game plays chip most of the time and takes a
pre-rendered version occasionally.

## Chip loops

| Source         | Game state          | Character                                   |
| -------------- | ------------------- | ------------------------------------------- |
| `menu.rb`      | Title / menu        | Dignified, mysterious, sparse (no noise)    |
| `interlude.rb` | Between assaults    | Calm resolve, planning-phase breathing room |
| `assault.rb`   | Normal assault      | Driving riff engine                         |
| `danger.rb`    | Assault going badly | The assault theme, faster, minor, busier    |
| `boss.rb`      | Boss assault        | Hectic epic loop, invariant ostinato        |

```bash
music/build.sh          # export MIDI + render all tracks to public/audio/
music/build.sh assault  # rebuild one track
```

Requires the sibling checkout `../sigillum-library` (Partitura), python3 with
`mido`/`numpy` (for `tooling/nes_render.py`), and `ffmpeg`. Intermediates land
in `outputs/` (gitignored).

## Extended scores

| Source                | Chip loop | Length            | What it adds                                                            |
| --------------------- | --------- | ----------------- | ----------------------------------------------------------------------- |
| `menu-extended.rb`    | 24 bars   | 52 bars @ 104 bpm | Approach intro, a darker C section under the keep, a broadened B return |
| `assault-extended.rb` | 32 bars   | 66 bars @ 132 bpm | Breach where the engine halves, counter-press a fourth up, drum break   |
| `boss-extended.rb`    | 40 bars   | 84 bars @ 168 bpm | Collapse, reignition, anthem over the grinding cell, chromatic reprise  |

Each runs 2:00 exactly and keeps the chip loop's sections intact as its
pillars, so the extended arrangement and the chip loop read as the same
piece. Roster, key, meter and tempo match the chip source note for note;
only the length and the new sections differ.

```bash
music/export-scores.sh              # MIDI + MusicXML into music/scores/
music/export-scores.sh boss-extended
```

`music/scores/` is checked in — it is the handoff to production. Bounce a
finished version to `public/audio/<track>/<rendition>/mix.ogg`
(`orchestral` or `electronic`) and the game picks it up with no code
change. Keep the bounce a whole number of bars at the score's tempo so its
loop restarts stay on the grid.

## Runtime integration

`src/audio/` plays these tracks in-game. `tracks.ts` carries each track's
renditions with their bpm/bar/voice metadata (keep it in sync with the
sources). The music director switches tracks on bar/beat boundaries of the
outgoing loop (lead drops fast, bed lingers and washes into a shared
reverb; the incoming lead can hold back a couple of bars), and mood changes
on the same track ramp voice layers and effect sends in place with no
switch at all - `src/audio/moods.ts` is the mix vocabulary and
`src/audio/cue.ts` decides which track+mood each game state wants.

`src/audio/renditions.ts` rolls a seeded draw on every entry into a track to
decide whether it sounds as chip stems or a pre-rendered bounce. A bounce
plays only once it is decoded and cached, so the roll that first wants one
warms it in the background and a later entry gets it — a cue never waits on
a download, and a track whose bounce is absent simply stays chip forever.

## Conventions

- Fixed roster order (the renderer assigns voices by pitched-track order):
  `:pulse1` (Clarinet) → 50% square lead, `:pulse2` (Oboe) → 25% square,
  `:triangle` (Violoncello) → triangle bass, `:noise` (Percussion,
  `family: :percussion`) → noise kit on MIDI channel 10.
- A part's display name reaches the export as the MusicXML `<part-name>` and
  `<instrument-name>`, and notation software resolves its instrument from
  that name ahead of the MIDI program. Keep display names clear of General
  MIDI and notation instrument names: the `:triangle` voice is a pitched
  cello bass, so it is labeled `Tri Bass` — labeling it `Triangle` imports
  as the unpitched percussion triangle. The renderer keys off pitched-track
  order and channel 10, never off names, so a display name is free to change
  without touching the rendered audio.
- Noise vocabulary is GM drum pitches: kick `C2`, snare `D2`, closed hat
  `F#2`, open hat `A#2`.
- Technique references live in sigillum-library: `partitura cards chip`
  (cards `CT1`–`CT8`) and `docs/research/chiptune_nes_composition.md` there.
- Loops are seamless: every track ends on a dominant or fill resolving into
  bar 1. Extended scores hold to the same rule at their own final bar.
- An extended score keeps its chip loop's roster, key, meter and tempo, so
  both renditions of a track sit on one musical grid and the runtime can
  hand over between them.
- Per sigillum-library rules, note lists are written out literally — no
  helpers or loops that stamp out notes.
