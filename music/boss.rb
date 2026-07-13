production_piece "The Adversary (boss)" do
  meter "4/4"
  key "Bb minor"

  tempo do
    mark "quarter = 168", at: "bar 1 beat 1"
  end

# Boss loop: hectic and epic. Invariant riff cell under a roller-coaster lead,
# root-fifth triangle ostinato with no kick drops (the boss engine grinds, it
# does not groove), bII color in the bridge, chromatic turnarounds.
# library_ref dsl:chip/CT8_BOSS_ENGINE - the archetype this whole track runs on.
# library_ref dsl:chip/CT2_ARP_COMPRESSION - churning bridge arpeggios.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "roller-coaster lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "invariant riff cell"
    part :triangle, "Triangle", music21: "Violoncello", family: :string, description: "root-fifth ostinato"
    part :noise, "Noise", music21: "Percussion", family: :percussion, description: "relentless drive"
  end

  section :stinger, "Stinger", bars: 1..4, type: :hybrid_phrase_staff do
    journey "three hits and a snare roll announce the adversary"
    destination "the engine ignites at bar 5"

    span bars: 1..4, texture: :melody_over_bass do
      chords "b1:Bbm b2:Bbm b3:Ebm7 b4:F"

      phrase :stinger_lead, surface: :split_pitch_rhythm do
        pitch_bars  "F5{ff} F5 r | Db5 Db5 r | Eb5 Eb5 r | F5 E5 F5 Gb5 F5 E5 F5 C5"
        rhythm_bars "3/2 1/2 2 | 3/2 1/2 2 | 3/2 1/2 2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :stinger_lead, part: :pulse1, at: "bar 1 beat 1", role: :foreground, realization: "announcement hits"

      phrase :stinger_cell, surface: :split_pitch_rhythm do
        pitch_bars  "Bb4{ff} Bb4 r | Bb4 Bb4 r | Bb4 Bb4 r | A4 A4 A4 A4 C5 C5 C5 C5"
        rhythm_bars "3/2 1/2 2 | 3/2 1/2 2 | 3/2 1/2 2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :stinger_cell, part: :pulse2, at: "bar 1 beat 1", role: :background, realization: "announcement hits"

      phrase :stinger_floor, surface: :split_pitch_rhythm do
        pitch_bars  "Bb2{ff} Bb2 r | Bb2 Bb2 r | Gb2 Gb2 r | F2 F2 F2 F2 F2 F2 F2 F2"
        rhythm_bars "3/2 1/2 2 | 3/2 1/2 2 | 3/2 1/2 2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :stinger_floor, part: :triangle, at: "bar 1 beat 1", role: :bass, realization: "announcement hits"

      phrase :stinger_kit, surface: :split_pitch_rhythm do
        pitch_bars  "A#2{ff} C2 r | A#2 C2 r | A#2 C2 D2 D2 | D2 D2 D2 D2 D2 D2 D2 D2"
        rhythm_bars "3/2 1/2 2 | 3/2 1/2 2 | 3/2 1/2 1 1 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :stinger_kit, part: :noise, at: "bar 1 beat 1", role: :background, realization: "hits into snare roll"
    end
  end

  section :a1, "Engine", bars: 5..12, type: :hybrid_phrase_staff do
    journey "the engine grinds while the lead roller-coasters over it"
    destination "chromatic slide onto the dominant at bar 12"

    span bars: 5..12, texture: :melody_over_bass do
      chords "b5:Bbm b6:Bbm b7:Gb b8:Ab b9:Bbm b10:Bbm b11:Gb b12:F7"

      phrase :coaster1, surface: :split_pitch_rhythm do
        pitch_bars  "Bb4{f} C5 Db5 Eb5 F5 Eb5 Db5 C5 | Bb4 Db5 F5 Bb5 F5 Db5 Bb4 F4 | Gb5 F5 Eb5 Db5 Bb4 Db5 Eb5 Db5 | Ab4 C5 Eb5 Gb5 Eb5 C5 Ab4 C5 | Bb4 C5 Db5 Eb5 F5 Gb5 Ab5 Bb5 | Bb5 F5 Db6 Bb5 Ab5 F5 Eb5 C5 | Db5 Bb4 Gb5 Db5 Eb5 Db5 Bb4 Gb4 | F5 E5 Eb5 Db5 C5 Bb4 A4 C5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :coaster1, part: :pulse1, at: "bar 5 beat 1", role: :foreground, realization: "roller-coaster lead"

      phrase :cell1, surface: :split_pitch_rhythm do
        pitch_bars  "Bb3{mf} Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4 | Bb3 Bb3 r Bb3 r Bb3 Db4 Eb4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :cell1, part: :pulse2, at: "bar 5 beat 1", role: :background, realization: "invariant riff cell"

      phrase :floor1, surface: :split_pitch_rhythm do
        pitch_bars  "Bb2{f} Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Gb2 Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | Ab2 Ab2 Eb3 Ab2 Ab2 Eb3 Ab2 Eb3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Gb2 Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | F2 F2 C3 F2 F2 C3 A2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :floor1, part: :triangle, at: "bar 5 beat 1", role: :bass, realization: "root-fifth ostinato"

      phrase :kit1, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | D2 D2 D2 D2 A#2 A#2 D2 D2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :kit1, part: :noise, at: "bar 5 beat 1", role: :background, realization: "relentless drive"
    end
  end

  section :b, "Anthem", bars: 13..20, type: :hybrid_phrase_staff do
    journey "the lead broadens to an anthem while the engine keeps grinding"
    destination "the dominant at bar 19 hurls the engine back in"

    span bars: 13..20, texture: :melody_over_bass do
      chords "b13:Gb b14:Gb b15:Db b16:Db b17:Ebm b18:Ebm b19:F b20:F"

      phrase :anthem, surface: :split_pitch_rhythm do
        pitch_bars  "Gb5{ff} Bb5 | Ab5 Gb5 Db5 | F5 Ab5 | F5 Eb5 Db5 | Eb5 Gb5 | Bb5 Ab5 Gb5 | A5 C6 | C5 E5 F5"
        rhythm_bars "2 2 | 1 1 2 | 2 2 | 1 1 2 | 2 2 | 1 1 2 | 2 2 | 1/2 1/2 3"
      end

      placement :anthem, part: :pulse1, at: "bar 13 beat 1", role: :foreground, realization: "boss anthem"

      phrase :b_thirds, surface: :split_pitch_rhythm do
        pitch_bars  "Bb3{mf} | Bb3 | F4 | F4 | Gb4 | Gb4 | A4 C5 | C5 Eb5"
        rhythm_bars "4 | 4 | 4 | 4 | 4 | 4 | 2 2 | 2 2"
      end

      placement :b_thirds, part: :pulse2, at: "bar 13 beat 1", role: :background, realization: "sustained chord 3rds"

      phrase :b_floor, surface: :split_pitch_rhythm do
        pitch_bars  "Gb2{f} Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | Gb2 Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | Db3 Db3 Ab3 Db3 Db3 Ab3 Db3 Ab3 | Db3 Db3 Ab3 Db3 Db3 Ab3 Db3 Ab3 | Eb3 Eb3 Bb2 Eb3 Eb3 Bb2 Eb3 Bb2 | Eb3 Eb3 Bb2 Eb3 Eb3 Bb2 Eb3 Bb2 | F2 F2 C3 F2 F2 C3 A2 C3 | F2 F2 C3 F2 F2 C3 F2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b_floor, part: :triangle, at: "bar 13 beat 1", role: :bass, realization: "root-fifth ostinato"

      phrase :b_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 A#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 A#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 A#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 D2 D2 D2 D2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :b_kit, part: :noise, at: "bar 13 beat 1", role: :background, realization: "open-hat accents, roll into the return"
    end
  end

  section :a2, "Engine returns", bars: 21..28, type: :hybrid_phrase_staff do
    journey "the coaster returns and overshoots its own peak"
    destination "the slide at bar 28 tips into the bridge"

    span bars: 21..28, texture: :melody_over_bass do
      chords "b21:Bbm b22:Bbm b23:Gb b24:Ab b25:Bbm b26:Bbm b27:Gb b28:F7"

      phrase :coaster2, surface: :split_pitch_rhythm do
        pitch_bars  "Bb4{f} C5 Db5 Eb5 F5 Eb5 Db5 C5 | Bb4 Db5 F5 Bb5 F5 Db5 Bb4 F4 | Gb5 F5 Eb5 Db5 Bb4 Db5 Eb5 Db5 | Ab4 C5 Eb5 Gb5 Eb5 C5 Ab4 C5 | Bb4 C5 Db5 Eb5 F5 Gb5 Ab5 Bb5 | Bb5 F5 Db6 Bb5 C6 Ab5 F5 Eb5 | Db5 Bb4 Gb5 Db5 Eb5 Db5 Bb4 Gb4 | F5 E5 Eb5 Db5 C5 Bb4 A4 F4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :coaster2, part: :pulse1, at: "bar 21 beat 1", role: :foreground, realization: "coaster overshoot"

      # The return widens the cell's tail (C4-E4) and breaks it at the seam -
      # invariance with one calculated fracture.
      phrase :cell2, surface: :split_pitch_rhythm do
        pitch_bars  "Bb3{f} Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 r Bb3 Db4 F4 | Bb3 Bb3 r Bb3 A3 C4 Eb4 F4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :cell2, part: :pulse2, at: "bar 21 beat 1", role: :background, realization: "invariant riff cell"

      phrase :floor2, surface: :split_pitch_rhythm do
        pitch_bars  "Bb2{f} Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Gb2 Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | Ab2 Ab2 Eb3 Ab2 Ab2 Eb3 Ab2 Eb3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Gb2 Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | F2 F2 C3 F2 F2 C3 A2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :floor2, part: :triangle, at: "bar 21 beat 1", role: :bass, realization: "root-fifth ostinato"

      phrase :kit2, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 D2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | D2 D2 A#2 D2 D2 A#2 D2 D2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :kit2, part: :noise, at: "bar 21 beat 1", role: :background, realization: "ghost snares, hat-splash fill"
    end
  end

  section :bridge, "Climax", bars: 29..36, type: :hybrid_phrase_staff do
    journey "churning arpeggios climb through the bII to the peak"
    destination "the peak breaks at bar 36 and falls onto the turnaround"

    span bars: 29..36, texture: :melody_over_bass do
      chords "b29:Gb b30:Ab b31:Bbm b32:Bbm b33:B b34:Ab b35:F b36:F"

      phrase :climax_arps, surface: :split_pitch_rhythm do
        pitch_bars  "Bb4{ff} Db5 Gb5 Db5 Bb4 Db5 Gb5 Db5 | C5 Eb5 Ab5 Eb5 C5 Eb5 Ab5 Eb5 | Db5 F5 Bb5 F5 Db5 F5 Bb5 F5 | Bb5 C6 Db6 C6 Bb5 Ab5 F5 Ab5 | Eb5 Gb5 B5 Gb5 Eb5 Gb5 B5 Gb5 | C5 Eb5 Ab5 Eb5 C5 Eb5 Ab5 C6 | F5 A5 C6 A5 F5 A5 C6 A5 | C6 Bb5 A5 G5 F5 E5 F5 A5"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :climax_arps, part: :pulse1, at: "bar 29 beat 1", role: :foreground, realization: "climbing churn to the peak"

      phrase :climax_stabs, surface: :split_pitch_rhythm do
        pitch_bars  "Bb4{f} Db5 Bb4 Db5 | C5 Eb5 C5 Eb5 | Db5 F5 Db5 F5 | Db5 F5 Db5 F5 | Eb5 Gb5 Eb5 Gb5 | C5 Eb5 C5 Eb5 | A4 C5 A4 C5 | A4 C5 A4 C5"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :climax_stabs, part: :pulse2, at: "bar 29 beat 1", role: :background, realization: "quarter stabs"

      phrase :climax_floor, surface: :split_pitch_rhythm do
        pitch_bars  "Gb2{ff} Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | Ab2 Ab2 Eb3 Ab2 Ab2 Eb3 Ab2 Eb3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | Bb2 Bb2 F3 Bb2 Bb2 F3 Bb2 F3 | B2 B2 Gb3 B2 B2 Gb3 B2 Gb3 | Ab2 Ab2 Eb3 Ab2 Ab2 Eb3 Ab2 Eb3 | F2 F2 C3 F2 F2 C3 A2 C3 | F2 F2 C3 F2 F2 C3 F2 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :climax_floor, part: :triangle, at: "bar 29 beat 1", role: :bass, realization: "climbing ostinato through bII"

      phrase :climax_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{ff} F#2 D2 D2 C2 F#2 D2 D2 | C2 F#2 D2 D2 C2 F#2 D2 D2 | C2 F#2 D2 D2 C2 F#2 D2 D2 | C2 F#2 D2 D2 C2 F#2 D2 A#2 | C2 F#2 D2 D2 C2 F#2 D2 A#2 | C2 F#2 D2 D2 C2 F#2 D2 A#2 | C2 F#2 D2 D2 C2 F#2 D2 D2 | D2 D2 D2 D2 D2 D2 D2 D2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :climax_kit, part: :noise, at: "bar 29 beat 1", role: :background, realization: "doubled snares to the peak"
    end
  end

  section :turn, "Turnaround", bars: 37..40, type: :hybrid_phrase_staff do
    journey "the fall gathers itself and dives back into the stinger"
    destination "bar 40 dominant pickup resolves into bar 1"

    span bars: 37..40, texture: :melody_over_bass do
      chords "b37:Gb b38:Ab b39:F b40:F"

      phrase :turn_lead, surface: :split_pitch_rhythm do
        pitch_bars  "Gb5{f} Db5 Bb4 | Ab5 Eb5 C5 | C5 A4 F4 | F4 A4 C5 Eb5 F5 F5 Eb5 C5"
        rhythm_bars "1 1 2 | 1 1 2 | 1 1 2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_lead, part: :pulse1, at: "bar 37 beat 1", role: :foreground, realization: "fall and dive"

      phrase :turn_cell, surface: :split_pitch_rhythm do
        pitch_bars  "r{mf} Bb3 r Db4 r Bb3 r Db4 | r C4 r Eb4 r C4 r Eb4 | r A3 r C4 r A3 r C4 | r A3 r C4 A3 C4 Eb4 F4"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_cell, part: :pulse2, at: "bar 37 beat 1", role: :background, realization: "afterbeats with pickup"

      phrase :turn_floor, surface: :split_pitch_rhythm do
        pitch_bars  "Gb2{f} Gb2 Db3 Gb2 Gb2 Db3 Gb2 Db3 | Ab2 Ab2 Eb3 Ab2 Ab2 Eb3 Ab2 Eb3 | F2 F2 C3 F2 F2 C3 A2 C3 | F2 F2 C3 F2 A2 A2 C3 C3"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_floor, part: :triangle, at: "bar 37 beat 1", role: :bass, realization: "ostinato walks home"

      phrase :turn_kit, surface: :split_pitch_rhythm do
        pitch_bars  "C2{f} F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 F#2 D2 F#2 C2 F#2 D2 F#2 | C2 C2 D2 D2 D2 D2 A#2 A#2"
        rhythm_bars "1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2 | 1/2 1/2 1/2 1/2 1/2 1/2 1/2 1/2"
      end

      placement :turn_kit, part: :noise, at: "bar 37 beat 1", role: :background, realization: "loop fill"
    end
  end
end
