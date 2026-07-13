production_piece "Hold the Walls (assault)" do
  meter "4/4"
  key "E minor"

  tempo do
    mark "quarter = 132", at: "bar 1 beat 1"
  end

# Normal-assault engine: driving riff over a dual-duty triangle and a full
# noise kit. The danger track transforms this same material.
# library_ref dsl:chip/CT4_TRIANGLE_BASS_DRUM - triangle octave-pop bass with kick drops.
# library_ref dsl:chip/CT5_NOISE_DRUMKIT - kick/hat/snare groove, fills at the seams.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "square lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "afterbeat comp"
    part :triangle, "Triangle", music21: "Violoncello", family: :string, description: "bass and kick drops"
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

  section :b, "Rampart lift", bars: 13..20, type: :hybrid_phrase_staff do
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
    journey "the press returns over the same engine"
    destination "dominant at bar 28 spills into the turnaround"

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

  section :turn, "Turnaround", bars: 29..32, type: :hybrid_phrase_staff do
    journey "four-bar climb hands the loop back to the riff"
    destination "bar 32 dominant resolves into bar 1"

    span bars: 29..32, texture: :melody_over_bass do
      chords "b29:C b30:D b31:B b32:B"

      phrase :turn_lead, surface: :split_pitch_rhythm do
        pitch_bars  "C5{f} E5 G5 E5 | D5 F#5 A5 F#5 | B4 D#5 F#5 B5 | A5 F#5 D#5 F#5"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1/2 1/2 1 2 | 1 1 1 1"
      end

      placement :turn_lead, part: :pulse1, at: "bar 29 beat 1", role: :foreground, realization: "turnaround climb"

      phrase :turn_comp, surface: :split_pitch_rhythm do
        pitch_bars  "r{mf} E4 r G4 r E4 r G4 | r F#4 r A4 r F#4 r A4 | r D#4 r F#4 r D#4 r F#4 | r D#4 r F#4 r D#4 r F#4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_comp, part: :pulse2, at: "bar 29 beat 1", role: :background, realization: "afterbeat comp"

      phrase :turn_floor, surface: :split_pitch_rhythm do
        pitch_bars  "C3{f} C4 C2 C3 C3 C4 C2 C3 | D3 D4 D2 D3 D3 D4 D2 D3 | B2 B3 B1 B2 B2 F#3 B1 B2 | B2 B3 B1 B2 B2 F#3 B1 B2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_floor, part: :triangle, at: "bar 29 beat 1", role: :bass, realization: "engine floor"

      phrase :turn_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{mf} F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 F#2 D2 F#2 C2 C2 D2 F#2 | C2 C2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_kit, part: :noise, at: "bar 29 beat 1", role: :background, realization: "loop fill"
    end
  end
end
