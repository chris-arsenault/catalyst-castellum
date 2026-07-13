production_piece "Breach Imminent (danger)" do
  meter "4/4"
  key "F minor"

  tempo do
    mark "quarter = 160", at: "bar 1 beat 1"
  end

# Danger variant of the assault theme: same material, discrete hurry-up
# transform - tempo up, subdivision doubled to repeated eighths, the Am/G
# terrain darkened to the phrygian F, and the kit never lets up.
# library_ref dsl:chip/CT7_HURRYUP_TRANSFORM - the whole design of this track.
# library_ref dsl:chip/CT4_TRIANGLE_BASS_DRUM - same engine floor as assault.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "square lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "stab cell and afterbeats"
    part :triangle, "Triangle", music21: "Violoncello", family: :string, description: "bass and kick drops"
    part :noise, "Noise", music21: "Percussion", family: :percussion, description: "noise kit"
  end

  section :intro, "Alarm", bars: 1..4, type: :hybrid_phrase_staff do
    journey "the assault riff returns already at full boil"
    destination "no assembly - the engine is hot from bar 1"

    span bars: 1..4, texture: :melody_over_bass do
      chords "b1:Fm7 b2:Fm7 b3:Fm7 b4:Fm7"

      phrase :alarm_riff, surface: :split_pitch_rhythm do
        pitch_bars  "F4{f} Ab4 Bb4 C5 Eb5 C5 Bb4 Ab4 | F4 Ab4 Bb4 C5 Ab4 Ab4 F4 F4 | F4 Ab4 Bb4 C5 Eb5 C5 Bb4 Ab4 | F4 F4 Gb4 Gb4 F4 F4 Eb4 Eb4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :alarm_riff, part: :pulse1, at: "bar 1 beat 1", role: :foreground, realization: "riff with phrygian bite"

      phrase :alarm_floor, surface: :split_pitch_rhythm do
        pitch_bars  "F2{f} F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 F2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :alarm_floor, part: :triangle, at: "bar 1 beat 1", role: :bass, realization: "engine floor"

      phrase :alarm_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :alarm_kit, part: :noise, at: "bar 1 beat 1", role: :background, realization: "hot kit"
    end
  end

  section :a1, "Pressed hard", bars: 5..12, type: :hybrid_phrase_staff do
    journey "the press tune doubled into repeated eighths over phrygian ground"
    destination "dominant at bar 12"

    span bars: 5..12, texture: :melody_over_bass do
      chords "b5:Fm7 b6:Fm7 b7:Gb b8:C b9:Fm7 b10:Fm7 b11:Db b12:C"

      phrase :pressed_tune, surface: :split_pitch_rhythm do
        pitch_bars  "C5{f} C5 F5 F5 Ab5 G5 F5 F5 | Eb5 Eb5 F5 F5 C5 C5 C5 r | Bb4 Bb4 Db5 Db5 Gb5 F5 Db5 Db5 | E5 E5 G5 G5 C5 C5 C5 r | C5 C5 F5 F5 Ab5 G5 F5 F5 | Ab5 Ab5 G5 G5 F5 F5 F5 r | F5 F5 Ab5 Ab5 Db5 Db5 F5 F5 | E5 E5 G5 G5 Bb5 Bb5 G5 G5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed_tune, part: :pulse1, at: "bar 5 beat 1", role: :foreground, realization: "press tune doubled"

      phrase :pressed_stabs, surface: :split_pitch_rhythm do
        pitch_bars  "Ab4{mf} Ab4 r Ab4 Ab4 r | Ab4 Ab4 r Ab4 Ab4 r | Bb4 Bb4 r Bb4 Bb4 r | G4 G4 r G4 G4 r | Ab4 Ab4 r Ab4 Ab4 r | Ab4 Ab4 r Ab4 Ab4 r | Ab4 Ab4 r Ab4 Ab4 r | G4 G4 r G4 G4 r"
        rhythm_bars "1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1"
      end

      placement :pressed_stabs, part: :pulse2, at: "bar 5 beat 1", role: :background, realization: "stab cell"

      phrase :pressed_floor, surface: :split_pitch_rhythm do
        pitch_bars  "F2{f} F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 F2 | Gb2 Gb3 Gb1 Gb2 Gb2 Gb3 Gb1 G2 | C3 C4 C2 C3 C3 G3 C2 E2 | F2 F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 Eb2 | Db3 Db4 Db2 Db3 Db3 Db4 Db2 Db3 | C3 C4 C2 C3 C3 G3 C2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed_floor, part: :triangle, at: "bar 5 beat 1", role: :bass, realization: "engine floor with phrygian Gb"

      phrase :pressed_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed_kit, part: :noise, at: "bar 5 beat 1", role: :background, realization: "relentless groove"
    end
  end

  section :b, "Wall fire", bars: 13..20, type: :hybrid_phrase_staff do
    journey "the rampart lift pressed into anxious motion"
    destination "the dominant refuses to resolve until bar 20"

    span bars: 13..20, texture: :melody_over_bass do
      chords "b13:Db b14:Eb b15:Fm b16:Fm b17:Gb b18:Ab b19:C b20:C"

      phrase :fire_tune, surface: :split_pitch_rhythm do
        pitch_bars  "F5{f} F5 Ab5 Ab5 F5 F5 Ab5 Ab5 | G5 G5 Bb5 Bb5 G5 G5 Bb5 Bb5 | Ab5 Ab5 F5 F5 Ab5 Ab5 C5 C5 | F5 F5 G5 G5 Ab5 Ab5 G5 G5 | Bb5 Bb5 Gb5 Gb5 Db5 Db5 Gb5 Gb5 | C5 C5 Eb5 Eb5 Ab5 Ab5 Eb5 Eb5 | E5 E5 G5 G5 C5 C5 G5 G5 | Bb5 Bb5 G5 G5 E5 E5 G5 G5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :fire_tune, part: :pulse1, at: "bar 13 beat 1", role: :foreground, realization: "anxious lift"

      phrase :fire_after, surface: :split_pitch_rhythm do
        pitch_bars  "r{mf} F4 r Ab4 r F4 r Ab4 | r G4 r Bb4 r G4 r Bb4 | r Ab4 r C5 r Ab4 r C5 | r Ab4 r C5 r Ab4 r C5 | r Bb4 r Db5 r Bb4 r Db5 | r C5 r Eb5 r C5 r Eb5 | r E4 r G4 r E4 r G4 | r E4 r G4 r E4 r G4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :fire_after, part: :pulse2, at: "bar 13 beat 1", role: :background, realization: "afterbeat comp"

      phrase :fire_floor, surface: :split_pitch_rhythm do
        pitch_bars  "Db3{f} Db4 Db2 Db3 Db3 Db4 Db2 Db3 | Eb3 Eb4 Eb2 Eb3 Eb3 Eb4 Eb2 Eb3 | F2 F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 F2 | Gb2 Gb3 Gb1 Gb2 Gb2 Gb3 Gb1 Gb2 | Ab2 Ab3 Ab1 Ab2 Ab2 Ab3 Ab1 Ab2 | C3 C4 C2 C3 C3 G3 C2 C3 | C3 C4 C2 C3 C3 G3 C2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :fire_floor, part: :triangle, at: "bar 13 beat 1", role: :bass, realization: "climbing floor"

      phrase :fire_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :fire_kit, part: :noise, at: "bar 13 beat 1", role: :background, realization: "relentless groove"
    end
  end

  section :a2, "Pressed harder", bars: 21..28, type: :hybrid_phrase_staff do
    journey "the press again, tighter"
    destination "bar 28 dominant tips into the panic climb"

    span bars: 21..28, texture: :melody_over_bass do
      chords "b21:Fm7 b22:Fm7 b23:Gb b24:C b25:Fm7 b26:Fm7 b27:Db b28:C"

      phrase :pressed2_tune, surface: :split_pitch_rhythm do
        pitch_bars  "C5{f} C5 F5 F5 Ab5 G5 F5 F5 | Eb5 Eb5 F5 F5 C5 C5 C5 r | Bb4 Bb4 Db5 Db5 Gb5 F5 Db5 Db5 | E5 E5 G5 G5 C5 C5 C5 r | C5 C5 F5 F5 Ab5 G5 F5 F5 | Ab5 Ab5 G5 G5 F5 F5 F5 r | F5 F5 Ab5 Ab5 Db5 Db5 F5 F5 | E5 E5 G5 G5 Bb5 Bb5 G5 G5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed2_tune, part: :pulse1, at: "bar 21 beat 1", role: :foreground, realization: "press tune doubled"

      # Second press swaps the stab cell for arpeggio compression (dsl:chip/CT2)
      # so the return escalates instead of repeating.
      phrase :pressed2_stabs, surface: :split_pitch_rhythm do
        pitch_bars  "F4{mf} Ab4 C5 Ab4 F4 Ab4 C5 Ab4 | F4 Ab4 C5 Ab4 F4 Ab4 C5 Ab4 | Gb4 Bb4 Db5 Bb4 Gb4 Bb4 Db5 Bb4 | E4 G4 C5 G4 E4 G4 C5 G4 | F4 Ab4 C5 Ab4 F4 Ab4 C5 Ab4 | F4 Ab4 C5 Ab4 F4 Ab4 C5 Ab4 | F4 Ab4 Db5 Ab4 F4 Ab4 Db5 Ab4 | E4 G4 C5 G4 E4 G4 Bb4 C5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed2_stabs, part: :pulse2, at: "bar 21 beat 1", role: :background, realization: "arpeggio compression"

      phrase :pressed2_floor, surface: :split_pitch_rhythm do
        pitch_bars  "F2{f} F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 F2 | Gb2 Gb3 Gb1 Gb2 Gb2 Gb3 Gb1 G2 | C3 C4 C2 C3 C3 G3 C2 E2 | F2 F3 F1 F2 F2 F3 F1 F2 | F2 F3 F1 F2 F2 F3 F1 Eb2 | Db3 Db4 Db2 Db3 Db3 Db4 Db2 Db3 | C3 C4 C2 C3 C3 G3 C2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed2_floor, part: :triangle, at: "bar 21 beat 1", role: :bass, realization: "engine floor with phrygian Gb"

      phrase :pressed2_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | D2 D2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :pressed2_kit, part: :noise, at: "bar 21 beat 1", role: :background, realization: "relentless groove"
    end
  end

  section :panic, "Panic climb", bars: 29..36, type: :hybrid_phrase_staff do
    journey "a chromatic-neighbor cell sequences up a climbing bass"
    destination "the dominant arrives white-hot at bar 35"

    span bars: 29..36, texture: :melody_over_bass do
      chords "b29:Fm b30:Gb b31:Fm b32:Gb b33:Ab b34:Bbm b35:C b36:C"

      phrase :panic_cell, surface: :split_pitch_rhythm do
        pitch_bars  "F5{ff} E5 F5 F5 r F5 E5 F5 | Gb5 F5 Gb5 Gb5 r Gb5 F5 Gb5 | F5 E5 F5 F5 r F5 E5 F5 | Gb5 F5 Gb5 Gb5 r Gb5 F5 Gb5 | Ab5 G5 Ab5 Ab5 r Ab5 G5 Ab5 | Bb5 A5 Bb5 Bb5 r Bb5 A5 Bb5 | C6 Bb5 G5 E5 C5 E5 G5 Bb5 | C6 Bb5 G5 E5 G5 Bb5 C6 C6"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :panic_cell, part: :pulse1, at: "bar 29 beat 1", role: :foreground, realization: "chromatic neighbor climb"

      phrase :panic_thirds, surface: :split_pitch_rhythm do
        pitch_bars  "Ab4{f} Ab4 r Ab4 Ab4 r | Bb4 Bb4 r Bb4 Bb4 r | Ab4 Ab4 r Ab4 Ab4 r | Bb4 Bb4 r Bb4 Bb4 r | C5 C5 r C5 C5 r | Db5 Db5 r Db5 Db5 r | E5 E5 r E5 E5 r | E5 E5 G4 Bb4 C5 E5"
        rhythm_bars "1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1 1/2 1/2 1 | 1/2 1/2 1/2 1/2 1 1"
      end

      placement :panic_thirds, part: :pulse2, at: "bar 29 beat 1", role: :background, realization: "climbing stabs"

      phrase :panic_floor, surface: :split_pitch_rhythm do
        pitch_bars  "F2{ff} F3 F1 F2 F2 F3 F1 Gb2 | Gb2 Gb3 Gb1 Gb2 Gb2 Gb3 Gb1 F2 | F2 F3 F1 F2 F2 F3 F1 Gb2 | Gb2 Gb3 Gb1 Gb2 Gb2 Gb3 Gb1 G2 | Ab2 Ab3 Ab1 Ab2 Ab2 Ab3 Ab1 A2 | Bb2 Bb3 Bb1 Bb2 Bb2 Bb3 Bb1 B2 | C3 C4 C2 C3 C3 G3 C2 C3 | C3 C4 C2 C3 C3 G3 C2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :panic_floor, part: :triangle, at: "bar 29 beat 1", role: :bass, realization: "climbing engine"

      phrase :panic_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{ff} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 D2 C2 F#2 D2 D2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 D2 C2 F#2 D2 D2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 D2 C2 F#2 D2 D2 | D2 D2 D2 D2 D2 D2 D2 D2 | D2 D2 D2 D2 A#2 A#2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :panic_kit, part: :noise, at: "bar 29 beat 1", role: :background, realization: "doubled snares into the peak"
    end
  end

  section :turn, "Snap back", bars: 37..40, type: :hybrid_phrase_staff do
    journey "four bars fall away and the loop snaps back to the alarm"
    destination "bar 40 dominant resolves into bar 1"

    span bars: 37..40, texture: :melody_over_bass do
      chords "b37:Db b38:Eb b39:C b40:C"

      phrase :snap_lead, surface: :split_pitch_rhythm do
        pitch_bars  "Ab5{f} F5 Db5 F5 Ab5 F5 Db5 F5 | Bb5 G5 Eb5 G5 Bb5 G5 Eb5 G5 | C6 Bb5 Ab5 G5 F5 E5 D5 C5 | Bb4 Bb4 C5 C5 E5 E5 G5 Bb5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :snap_lead, part: :pulse1, at: "bar 37 beat 1", role: :foreground, realization: "falling run and pickup"

      phrase :snap_after, surface: :split_pitch_rhythm do
        pitch_bars  "r{mf} F4 r Ab4 r F4 r Ab4 | r G4 r Bb4 r G4 r Bb4 | r E4 r G4 r E4 r G4 | r E4 r G4 E4 G4 Bb4 C5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :snap_after, part: :pulse2, at: "bar 37 beat 1", role: :background, realization: "afterbeats with pickup"

      phrase :snap_floor, surface: :split_pitch_rhythm do
        pitch_bars  "Db3{f} Db4 Db2 Db3 Db3 Db4 Db2 Db3 | Eb3 Eb4 Eb2 Eb3 Eb3 Eb4 Eb2 Eb3 | C3 C4 C2 C3 C3 G3 C2 C3 | C3 C4 C2 C3 C3 G3 C2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :snap_floor, part: :triangle, at: "bar 37 beat 1", role: :bass, realization: "engine floor"

      phrase :snap_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 C2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :snap_kit, part: :noise, at: "bar 37 beat 1", role: :background, realization: "loop fill"
    end
  end
end
