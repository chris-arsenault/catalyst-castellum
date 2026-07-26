production_piece "Hold the Walls (extended)" do
  meter "4/4"
  key "E minor"

  tempo do
    mark "quarter = 132", at: "bar 1 beat 1"
  end

# Extended assault theme: the chip assault loop composed through at
# production length (66 bars = 2:00 at 132). Same roster, same tempo, same
# key as music/assault.rb so the runtime can hand over between the chip
# stems and a pre-rendered mix of this score on the same grid. The chip
# loop's intro/press/lift/press stay intact; a breach where the engine
# halves, a counter-press on new terrain, a broadened lift, and a six-bar
# turnaround with a drum break carry it to full length.
# library_ref dsl:chip/CT2_ARP_COMPRESSION - arpeggio comp on the returns.
# library_ref dsl:chip/CT4_TRIANGLE_BASS_DRUM - triangle octave-pop bass with kick drops.
# library_ref dsl:chip/CT5_NOISE_DRUMKIT - kick/hat/snare groove, fills at the seams.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "square lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "afterbeat comp"
    part :triangle, "Tri Bass", music21: "Violoncello", family: :string, description: "bass and kick drops"
    part :noise, "Noise", music21: "Percussion", family: :percussion, description: "noise kit"
  end

  section :intro, "Riff alone", bars: 1..4, type: :hybrid_phrase_staff do
    journey "the signature riff states itself while the kit assembles"
    destination "full engine running by bar 5"

    span bars: 1..4, texture: :melody_over_bass do
      chords "b1:Em7 b2:Em7 b3:Em7 b4:Em7"

      phrase :intro_riff, surface: :split_pitch_rhythm do
        pitch_bars  "E4{mf} G4 A4 B4 D5 B4 A4 G4 | E4 G4 A4 B4 G4 E4 | E4 G4 A4 B4 D5 B4 A4 G4 | E4 G4 A4 B4 G4 E4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1 1"
      end

      placement :intro_riff, part: :pulse1, at: "bar 1 beat 1", role: :foreground, realization: "signature riff"

      phrase :intro_floor, surface: :split_pitch_rhythm do
        pitch_bars  "E2{mf} E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :intro_floor, part: :triangle, at: "bar 1 beat 1", role: :bass, realization: "engine floor"

      phrase :intro_kit, surface: :split_pitch_rhythm do
        pitch_bars  "F#2{p} F#2 F#2 F#2 F#2 F#2 F#2 F#2 | F#2 F#2 F#2 F#2 F#2 F#2 F#2 F#2 | C2{mp} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 D2 D2 D2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :intro_kit, part: :noise, at: "bar 1 beat 1", role: :background, realization: "kit assembles"
    end
  end

  section :a1, "First press", bars: 5..12, type: :hybrid_phrase_staff do
    journey "melody rides the engine, answering its own two-bar calls"
    destination "half cadence on B at bar 12"

    span bars: 5..12, texture: :melody_over_bass do
      chords "b5:Em7 b6:Em7 b7:Gmaj7 b8:Am b9:Em7 b10:Em7 b11:C b12:B"

      phrase :a_melody, surface: :split_pitch_rhythm do
        pitch_bars  "B4{f} E5 G5 F#5 E5 | D5 E5 B4 r | B4 D5 G5 F#5 D5 | C5 B4 A4 r | B4 E5 G5 F#5 E5 | G5 F#5 E5 r | E5 G5 E5 C5 | D#5 F#5 B4 r"
        rhythm_bars "1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1 1 | 1/2 1/2 2 1"
      end

      placement :a_melody, part: :pulse1, at: "bar 5 beat 1", role: :foreground, realization: "first press tune"

      phrase :a_comp, surface: :split_pitch_rhythm do
        pitch_bars  "r{mp} G4 r B4 r G4 r B4 | r G4 r B4 r G4 r B4 | r B4 r D5 r B4 r D5 | r C5 r E5 r C5 r E5 | r G4 r B4 r G4 r B4 | r G4 r B4 r G4 r B4 | r E4 r G4 r E4 r G4 | r D#4 r F#4 r D#4 r F#4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a_comp, part: :pulse2, at: "bar 5 beat 1", role: :background, realization: "afterbeat comp"

      phrase :a_floor, surface: :split_pitch_rhythm do
        pitch_bars  "E2{f} E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | G2 G3 G1 G2 G2 G3 G1 G2 | A2 A3 A1 A2 A2 A3 A1 A2 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | C3 C4 C2 C3 C3 C4 C2 C3 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a_floor, part: :triangle, at: "bar 5 beat 1", role: :bass, realization: "engine floor"

      phrase :a_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{mf} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | D2 D2 D2 D2 D2 D2 D2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a_kit, part: :noise, at: "bar 5 beat 1", role: :background, realization: "groove with seam fill"
    end
  end

  section :b1, "Rampart lift", bars: 13..20, type: :hybrid_phrase_staff do
    journey "anthemic lift onto the relative major terrain"
    destination "dominant at bar 20 returns the press"

    span bars: 13..20, texture: :melody_over_bass do
      chords "b13:C b14:D b15:Em b16:Em b17:C b18:D b19:G b20:B"

      phrase :b_melody, surface: :split_pitch_rhythm do
        pitch_bars  "E5{f} G5 | F#5 A5 | G5 E5 | E5 F#5 G5 | A5 G5 E5 | F#5 A5 D5 | B4 D5 G5 | F#5 D#5 B4"
        rhythm_bars "2 2 | 2 2 | 2 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1/2 1/2 3"
      end

      placement :b_melody, part: :pulse1, at: "bar 13 beat 1", role: :foreground, realization: "rampart anthem"

      phrase :b_comp, surface: :split_pitch_rhythm do
        pitch_bars  "r{mp} E4 r G4 r E4 r G4 | r F#4 r A4 r F#4 r A4 | r G4 r B4 r G4 r B4 | r G4 r B4 r G4 r B4 | r E4 r G4 r E4 r G4 | r F#4 r A4 r F#4 r A4 | r B4 r D5 r B4 r D5 | r D#4 r F#4 D#4 F#4 A4 B4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b_comp, part: :pulse2, at: "bar 13 beat 1", role: :background, realization: "afterbeat comp"

      phrase :b_floor, surface: :split_pitch_rhythm do
        pitch_bars  "C3{f} C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | C3 C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | G2 G3 G1 G2 G2 G3 G1 G2 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b_floor, part: :triangle, at: "bar 13 beat 1", role: :bass, realization: "engine floor"

      phrase :b_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{mf} F#2 D2 A#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 A#2 | D2 D2 A#2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 A#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 A#2 | D2 D2 D2 D2 D2 D2 D2 A#2"
        rhythm_bars "1 1 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1 1 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1 1 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1 1 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b_kit, part: :noise, at: "bar 13 beat 1", role: :background, realization: "half-time lift with open hats"
    end
  end

  section :a2, "Second press", bars: 21..28, type: :hybrid_phrase_staff do
    journey "the press returns over the same engine, its comp compressed into arpeggios"
    destination "dominant at bar 28 drops the floor out"

    span bars: 21..28, texture: :melody_over_bass do
      chords "b21:Em7 b22:Em7 b23:Gmaj7 b24:Am b25:Em7 b26:Em7 b27:C b28:B"

      phrase :a2_melody, surface: :split_pitch_rhythm do
        pitch_bars  "B4{f} E5 G5 F#5 E5 | D5 E5 B4 r | B4 D5 G5 F#5 D5 | C5 B4 A4 r | B4 E5 G5 F#5 E5 | G5 F#5 E5 r | E5 G5 E5 C5 | D#5 F#5 B4 r"
        rhythm_bars "1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1 1 | 1/2 1/2 2 1"
      end

      placement :a2_melody, part: :pulse1, at: "bar 21 beat 1", role: :foreground, realization: "second press tune"

      # Second press swaps afterbeats for arpeggio compression (dsl:chip/CT2)
      # so the return reads fuller without new voices.
      phrase :a2_comp, surface: :split_pitch_rhythm do
        pitch_bars  "E4{mp} G4 B4 G4 E4 G4 B4 G4 | E4 G4 B4 G4 E4 G4 B4 G4 | D4 G4 B4 G4 D4 G4 B4 G4 | E4 A4 C5 A4 E4 A4 C5 A4 | E4 G4 B4 G4 E4 G4 B4 G4 | E4 G4 B4 G4 E4 G4 B4 G4 | E4 G4 C5 G4 E4 G4 C5 G4 | D#4 F#4 B4 F#4 D#4 F#4 B4 F#4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a2_comp, part: :pulse2, at: "bar 21 beat 1", role: :background, realization: "arpeggio compression"

      phrase :a2_floor, surface: :split_pitch_rhythm do
        pitch_bars  "E2{f} E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | G2 G3 G1 G2 G2 G3 G1 G2 | A2 A3 A1 A2 A2 A3 A1 A2 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | C3 C4 C2 C3 C3 C4 C2 C3 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a2_floor, part: :triangle, at: "bar 21 beat 1", role: :bass, realization: "engine floor"

      phrase :a2_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{mf} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | D2 D2 D2 D2 D2 D2 D2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a2_kit, part: :noise, at: "bar 21 beat 1", role: :background, realization: "groove with ghost snares"
    end
  end

  section :breach, "Breach", bars: 29..36, type: :hybrid_phrase_staff do
    journey "the engine halves and a new hook walks in over the gap"
    destination "the dominant at bar 36 launches the counter-press"

    span bars: 29..36, texture: :melody_over_bass do
      chords "b29:Em b30:Em b31:Am b32:Am b33:F b34:F b35:B b36:B"

      phrase :breach_hook, surface: :split_pitch_rhythm do
        pitch_bars  "r | r | A4{mp} C5 B4 A4 | E4 G4 A4 | F4{mf} A4 C5 A4 | C5 D5 C5 A4 | B4 D#5 F#5 B5 | A5 F#5 D#5 B4"
        rhythm_bars "4 | 4 | 1 1 1 1 | 1 1 2 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :breach_hook, part: :pulse1, at: "bar 29 beat 1", role: :foreground, realization: "breach hook"

      phrase :breach_pad, surface: :split_pitch_rhythm do
        pitch_bars  "B3{p} G3 | E4 | C4 A3 | E4 | A3{mp} C4 | F4 | D#4 F#4 | F#4 D#4 B3"
        rhythm_bars "2 2 | 4 | 2 2 | 4 | 2 2 | 4 | 2 2 | 1 1 2"
      end

      placement :breach_pad, part: :pulse2, at: "bar 29 beat 1", role: :background, realization: "held chord tones over the gap"

      phrase :breach_floor, surface: :split_pitch_rhythm do
        pitch_bars  "E2{mf} E2 E3 | E2 E2 E3 | A2 A2 A3 | A2 A2 A3 | F2 F2 F3 | F2 F2 F3 | B2 B2 F#3 | B2 F#3 B2 B1"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 1 1 1 1"
      end

      placement :breach_floor, part: :triangle, at: "bar 29 beat 1", role: :bass, realization: "held roots with an octave pop"

      phrase :breach_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{mp} F#2 D2 F#2 | C2 F#2 D2 A#2 | C2 F#2 D2 F#2 | C2 F#2 D2 A#2 | C2{mf} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 A#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :breach_kit, part: :noise, at: "bar 29 beat 1", role: :background, realization: "half-time kit rebuilding to straight eighths"
    end
  end

  section :c, "Counter-press", bars: 37..44, type: :hybrid_phrase_staff do
    journey "the signature riff answers a fourth higher on fresh terrain"
    destination "the dominant at bar 44 hands the lift back"

    span bars: 37..44, texture: :melody_over_bass do
      chords "b37:Am7 b38:Am7 b39:C b40:D b41:Am7 b42:Am7 b43:F b44:B"

      phrase :c_riff, surface: :split_pitch_rhythm do
        pitch_bars  "A4{f} C5 D5 E5 G5 E5 D5 C5 | A4 C5 D5 E5 C5 A4 | C5 E5 G5 E5 C5 | D5 F#5 A5 F#5 D5 | A4 C5 D5 E5 G5 E5 D5 C5 | A4 C5 D5 E5 C5 A4 | F5 E5 D5 C5 | B4 D#5 F#5 A5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1 1 | 1 1 1/2 1/2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :c_riff, part: :pulse1, at: "bar 37 beat 1", role: :foreground, realization: "riff transposed a fourth up"

      phrase :c_comp, surface: :split_pitch_rhythm do
        pitch_bars  "A3{mp} C4 E4 C4 A3 C4 E4 C4 | A3 C4 E4 C4 A3 C4 E4 C4 | G3 C4 E4 C4 G3 C4 E4 C4 | A3 D4 F#4 D4 A3 D4 F#4 D4 | A3 C4 E4 C4 A3 C4 E4 C4 | A3 C4 E4 C4 A3 C4 E4 C4 | A3 C4 F4 C4 A3 C4 F4 C4 | B3 D#4 F#4 D#4 B3 D#4 F#4 D#4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :c_comp, part: :pulse2, at: "bar 37 beat 1", role: :background, realization: "arpeggio compression on the new terrain"

      phrase :c_floor, surface: :split_pitch_rhythm do
        pitch_bars  "A2{f} A3 A1 A2 A2 A3 A1 A2 | A2 A3 A1 A2 A2 A3 A1 A2 | C3 C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | A2 A3 A1 A2 A2 A3 A1 A2 | A2 A3 A1 A2 A2 A3 A1 A2 | F2 F3 F1 F2 F2 F3 F1 F2 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :c_floor, part: :triangle, at: "bar 37 beat 1", role: :bass, realization: "engine floor on the new roots"

      phrase :c_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 A#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 A#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :c_kit, part: :noise, at: "bar 37 beat 1", role: :background, realization: "groove with a seam fill"
    end
  end

  section :b2, "Rampart lift in full", bars: 45..52, type: :hybrid_phrase_staff do
    journey "the anthem returns with the kit filled in and the tune opened out"
    destination "the dominant at bar 52 slams the final press home"

    span bars: 45..52, texture: :melody_over_bass do
      chords "b45:C b46:D b47:Em b48:Em b49:C b50:D b51:G b52:B"

      phrase :b2_melody, surface: :split_pitch_rhythm do
        pitch_bars  "E5{ff} G5 | F#5 A5 | G5 E5 | E5 F#5 G5 | A5 G5 E5 G5 | F#5 A5 D5 F#5 | B5 A5 G5 D5 | F#5 D#5 B4"
        rhythm_bars "2 2 | 2 2 | 2 2 | 1 1 2 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1/2 1/2 3"
      end

      placement :b2_melody, part: :pulse1, at: "bar 45 beat 1", role: :foreground, realization: "rampart anthem opened out"

      phrase :b2_comp, surface: :split_pitch_rhythm do
        pitch_bars  "r{mf} E4 r G4 r E4 r G4 | r F#4 r A4 r F#4 r A4 | r G4 r B4 r G4 r B4 | r G4 r B4 r G4 r B4 | r E4 r G4 r E4 r G4 | r F#4 r A4 r F#4 r A4 | r B4 r D5 r B4 r D5 | r D#4 r F#4 D#4 F#4 A4 B4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b2_comp, part: :pulse2, at: "bar 45 beat 1", role: :background, realization: "afterbeat comp"

      phrase :b2_floor, surface: :split_pitch_rhythm do
        pitch_bars  "C3{ff} C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | C3 C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | G2 G3 G1 G2 G2 G3 G1 G2 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b2_floor, part: :triangle, at: "bar 45 beat 1", role: :bass, realization: "engine floor"

      phrase :b2_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{ff} F#2 D2 A#2 C2 C2 D2 A#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 A#2 C2 C2 D2 A#2 | D2 D2 A#2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 A#2 C2 C2 D2 A#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 A#2 C2 C2 D2 A#2 | D2 D2 D2 D2 D2 D2 D2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b2_kit, part: :noise, at: "bar 45 beat 1", role: :background, realization: "straight eighths with open hats throughout"
    end
  end

  section :a3, "Last press", bars: 53..60, type: :hybrid_phrase_staff do
    journey "the press one last time, engine and arpeggios at full weight"
    destination "the dominant at bar 60 cuts to the break"

    span bars: 53..60, texture: :melody_over_bass do
      chords "b53:Em7 b54:Em7 b55:Gmaj7 b56:Am b57:Em7 b58:Em7 b59:C b60:B"

      phrase :a3_melody, surface: :split_pitch_rhythm do
        pitch_bars  "B4{ff} E5 G5 F#5 E5 | D5 E5 B4 r | B4 D5 G5 F#5 D5 | C5 B4 A4 r | B4 E5 G5 F#5 E5 | G5 F#5 E5 r | E5 G5 B5 G5 | F#5 D#5 B4 r"
        rhythm_bars "1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1/2 1/2 1 | 1/2 1/2 2 1 | 1 1 1 1 | 1/2 1/2 2 1"
      end

      placement :a3_melody, part: :pulse1, at: "bar 53 beat 1", role: :foreground, realization: "last press tune"

      phrase :a3_comp, surface: :split_pitch_rhythm do
        pitch_bars  "E4{mf} G4 B4 G4 E4 G4 B4 G4 | E4 G4 B4 G4 E4 G4 B4 G4 | D4 G4 B4 G4 D4 G4 B4 G4 | E4 A4 C5 A4 E4 A4 C5 A4 | E4 G4 B4 G4 E4 G4 B4 G4 | E4 G4 B4 G4 E4 G4 B4 G4 | E4 G4 C5 G4 E4 G4 C5 G4 | D#4 F#4 B4 F#4 D#4 F#4 B4 F#4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a3_comp, part: :pulse2, at: "bar 53 beat 1", role: :background, realization: "arpeggio compression"

      phrase :a3_floor, surface: :split_pitch_rhythm do
        pitch_bars  "E2{ff} E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | G2 G3 G1 G2 G2 G3 G1 G2 | A2 A3 A1 A2 A2 A3 A1 A2 | E2 E3 E1 E2 E2 E3 E1 E2 | E2 E3 E1 E2 E2 E3 E1 E2 | C3 C4 C2 C3 C3 C4 C2 C3 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a3_floor, part: :triangle, at: "bar 53 beat 1", role: :bass, realization: "engine floor"

      phrase :a3_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{ff} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 A#2 C2 C2 D2 A#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :a3_kit, part: :noise, at: "bar 53 beat 1", role: :background, realization: "groove with ghost snares into the break"
    end
  end

  section :turn, "Turnaround", bars: 61..66, type: :hybrid_phrase_staff do
    journey "two bars of bare kit, then a four-bar climb hands the loop back to the riff"
    destination "bar 66 dominant resolves into bar 1"

    span bars: 61..66, texture: :melody_over_bass do
      chords "b61:Em b62:Em b63:C b64:D b65:B b66:B"

      phrase :turn_lead, surface: :split_pitch_rhythm do
        pitch_bars  "r | r | C5{ff} E5 G5 E5 | D5 F#5 A5 F#5 | B4 D#5 F#5 B5 | A5 F#5 D#5 F#5"
        rhythm_bars "4 | 4 | 1 1 1 1 | 1 1 1 1 | 1/2 1/2 1 2 | 1 1 1 1"
      end

      placement :turn_lead, part: :pulse1, at: "bar 61 beat 1", role: :foreground, realization: "turnaround climb"

      phrase :turn_comp, surface: :split_pitch_rhythm do
        pitch_bars  "r | r | r{f} E4 r G4 r E4 r G4 | r F#4 r A4 r F#4 r A4 | r D#4 r F#4 r D#4 r F#4 | r D#4 r F#4 r D#4 r F#4"
        rhythm_bars "4 | 4 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_comp, part: :pulse2, at: "bar 61 beat 1", role: :background, realization: "afterbeat comp returns with the climb"

      phrase :turn_floor, surface: :split_pitch_rhythm do
        pitch_bars  "r | E2{mf} E2 E3 E3 | C3{f} C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | B2 B3 B1 B2 B2 F#3 B1 B2 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "4 | 1 1 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_floor, part: :triangle, at: "bar 61 beat 1", role: :bass, realization: "floor drops out and re-ignites"

      phrase :turn_kit, surface: :split_pitch_rhythm do
        pitch_bars  "D2{f} D2 D2 D2 D2 D2 D2 D2 | D2 D2 D2 D2 D2 D2 A#2 A#2 | C2{ff} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 C2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_kit, part: :noise, at: "bar 61 beat 1", role: :background, realization: "snare break into the loop fill"
    end
  end
end
