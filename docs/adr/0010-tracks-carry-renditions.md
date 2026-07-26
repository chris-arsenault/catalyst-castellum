# ADR-0010: A track carries renditions; a pre-rendered rendition is one file

Date: 2026-07-26

Status: accepted

## Context

The soundtrack ships as chip loops rendered per NES voice, and the director mixes those voices
live: mood is a vertical move across the stems (`assault/steady` mutes the comp, `interlude/planning`
drops the lead), and a track handover fades the lead fast while the bed lingers into a shared
reverb. Each chip loop runs under a minute.

Three tracks — menu, assault, boss — also have extended two-minute scores written for production
as orchestral and electronic versions. A produced version arrives as a finished mix: its character
comes substantially from master-bus treatment, which only exists on the sum. The game should reach
for one occasionally rather than replacing the chip soundtrack, so both realizations have to live
in the same runtime on the same terms.

## Decision

Rendition is an axis orthogonal to track and mood. A track definition carries a set of renditions;
each one declares its own bpm, bar count, voice list, and which voice leads. Chip declares its
three or four NES voices, a pre-rendered rendition declares one. Nothing downstream counts voices:
fades, delay routing, and staggered entry all read the rendition's `leadVoice`, and the musical
grid derives from the rendition's own bar count.

An extended score keeps its chip loop's key, meter, tempo, and roster, so every rendition of a
track sits on one grid and the existing quantized handover works between them unchanged.

The director owns the choice, as it already owns quantization and staggering. It rolls a seeded
draw once per entry into a track and holds the result for as long as that track plays. A
pre-rendered rendition sounds only once its file is decoded and cached: a roll that wants an
unfetched one warms it in the background and plays chip that time. Chip is therefore always the
answer when assets are absent, still downloading, or the track has no extended score.

## Alternatives considered

- **Bounce each pre-rendered version to lead/bed/percussion buses** — preserves the whole mood
  vocabulary in high fidelity, including the steady-to-strained escalation that is the assault
  track's central drama beat. Rejected because bus stems forbid master-bus glue, and the produced
  versions are largely their master chain. The voice list is data, so a single track can move to
  buses later without engine work.
- **Preload every bounce when the context unlocks** — makes the first roll count, at the cost of
  pulling several minutes of stereo audio during load. Rejected in favour of the residency gate,
  which bounds the fetch to one rendition per track entry and never makes a cue wait.
- **Let the cue selector name the rendition** — would let game state drive fidelity directly, but
  puts a presentation choice into the pure state-to-cue mapping the rest of the audio layer
  depends on being about _what_ should play, not _how_.
- **Expose rendition as a player setting** — a Chip/High-fidelity/Occasional control alongside the
  volume sliders. Rejected in favour of the seeded roll: the pre-rendered versions are an occasional
  variation rather than a fidelity tier the player manages, and a roll nobody has to opt into keeps
  the chip soundtrack the identity.

## Consequences

- Moods define a level for the mix voice as well as the chip voices. Moods that read as a voice
  dropping out become a change of weight plus reverb and delay in a pre-rendered rendition, which
  is the closest honest reading of the same intent on a single file.
- The rendition draw is seeded and independent of simulation seeds, so a session's choices replay
  identically while never reaching game state.
- Chip stems keep the flat `audio/<track>/<voice>.ogg` layout; a bounce lands at
  `audio/<track>/<rendition>/mix.ogg` and the game picks it up with no code change.
- A bounce must be a whole number of bars at the score's tempo, so its loop restarts stay on the
  grid that transitions quantize against.
