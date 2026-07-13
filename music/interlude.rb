production_piece "Between Waves (interlude)" do
  meter "4/4"
  key "C"

  tempo do
    mark "quarter = 92", at: "bar 1 beat 1"
  end

# Between-assault interlude: calm resolve while the player replans. Three
# voices, no noise, gentle harmonic rhythm - deliberate contrast to the
# assault engines.
# library_ref dsl:chip/CT3_FAMICHORD_VOICING - wide root/mid/high spacing throughout.
# library_ref dsl:chip/CT6_TWO_PULSE_COUNTERPOINT - pulse 2 shadows in 6ths.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "square lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "sixths and suspensions"
    part :triangle, "Triangle", music21: "Violoncello", family: :string, description: "triangle bass"
  end

  section :a1, "Breathing room", bars: 1..8, type: :hybrid_phrase_staff do
    journey "a lyric phrase settles the pulse after the assault"
    destination "half cadence at bar 8 invites the varied answer"

    span bars: 1..8, texture: :melody_over_bass do
      chords "b1:C b2:Am b3:F b4:G b5:C b6:Am b7:Dm b8:G"

      phrase :calm_lead, surface: :split_pitch_rhythm do
        pitch_bars  "E5{mp} D5 C5 | A4 B4 C5 | A4 G4 F4 | G4 B4 D5 | E5 D5 C5 | A4 B4 C5 | D5 F5 A4 | B4 D5 G4"
        rhythm_bars "3/2 1/2 2 | 3/2 1/2 2 | 3/2 1/2 2 | 1 1 2 | 3/2 1/2 2 | 3/2 1/2 2 | 1 1 2 | 1 1 2"
      end

      placement :calm_lead, part: :pulse1, at: "bar 1 beat 1", role: :foreground, realization: "calm phrase"

      phrase :calm_sixths, surface: :split_pitch_rhythm do
        pitch_bars  "G4{p} E4 | E4 A4 | C4 A3 | E4 D4 B3 | G4 E4 | E4 A4 | F4 D4 | E4 D4 B3"
        rhythm_bars "2 2 | 2 2 | 2 2 | 1 1 2 | 2 2 | 2 2 | 2 2 | 1 1 2"
      end

      placement :calm_sixths, part: :pulse2, at: "bar 1 beat 1", role: :background, realization: "sixths shadow"

      phrase :calm_bass, surface: :split_pitch_rhythm do
        pitch_bars  "C3{p} G2 | A2 E3 | F2 C3 | G2 D3 B2 | C3 G2 | A2 C3 E3 | D3 A2 | G2 D3 B2"
        rhythm_bars "3 1 | 3 1 | 3 1 | 2 1 1 | 3 1 | 2 1 1 | 3 1 | 2 1 1"
      end

      placement :calm_bass, part: :triangle, at: "bar 1 beat 1", role: :bass, realization: "slow floor"
    end
  end

  section :a2, "Higher answer", bars: 9..16, type: :hybrid_phrase_staff do
    journey "the same breath answered a third higher"
    destination "dominant at bar 16 releases into the coda"

    span bars: 9..16, texture: :melody_over_bass do
      chords "b9:C b10:Em b11:F b12:C b13:Dm b14:Em b15:F b16:G"

      phrase :answer_lead, surface: :split_pitch_rhythm do
        pitch_bars  "G5{mp} F5 E5 | G5 E5 B4 | A5{mf,cresc(} G5 F5 | E5 G5 C5{cresc)} | F5{mp} E5 D5 | G5 E5 B4 | A4 C5 F5 | D5 B4 G4"
        rhythm_bars "3/2 1/2 2 | 1 1 2 | 3/2 1/2 2 | 1 1 2 | 3/2 1/2 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :answer_lead, part: :pulse1, at: "bar 9 beat 1", role: :foreground, realization: "answer a third higher"

      phrase :answer_pad, surface: :split_pitch_rhythm do
        pitch_bars  "C4{p} | B3 | C4 | G4 | A3 | G3 | A3 | C4 B3"
        rhythm_bars "4 | 4 | 4 | 4 | 4 | 4 | 4 | 2 2"
      end

      placement :answer_pad, part: :pulse2, at: "bar 9 beat 1", role: :background, realization: "sustained mid voice"

      phrase :answer_bass, surface: :split_pitch_rhythm do
        pitch_bars  "C3{p} G2 E2 | E3 B2 | F2 C3 | C3 E3 D3 | D3 A2 | E3 B2 | F2 A2 F2 | G2 D3 F2"
        rhythm_bars "2 1 1 | 3 1 | 3 1 | 2 1 1 | 3 1 | 3 1 | 2 1 1 | 2 1 1"
      end

      placement :answer_bass, part: :triangle, at: "bar 9 beat 1", role: :bass, realization: "slow floor"
    end
  end

  section :coda, "Plagal exhale", bars: 17..20, type: :hybrid_phrase_staff do
    journey "a plagal exhale before the next wave"
    destination "bar 20 dominant loops seamlessly into bar 1"

    span bars: 17..20, texture: :melody_over_bass do
      chords "b17:F b18:C b19:F b20:G"

      phrase :coda_lead, surface: :split_pitch_rhythm do
        pitch_bars  "A4{p} C5 | C5 E5 | F5 C5 | D5 B4 G4 B4"
        rhythm_bars "2 2 | 2 2 | 2 2 | 1 1 1 1"
      end

      placement :coda_lead, part: :pulse1, at: "bar 17 beat 1", role: :foreground, realization: "exhale"

      phrase :coda_pad, surface: :split_pitch_rhythm do
        pitch_bars  "F4{p} | E4 G4 | A4 F4 | D4 B3"
        rhythm_bars "4 | 2 2 | 2 2 | 2 2"
      end

      placement :coda_pad, part: :pulse2, at: "bar 17 beat 1", role: :background, realization: "inner exhale"

      phrase :coda_bass, surface: :split_pitch_rhythm do
        pitch_bars  "F2{p} C3 | C3 G2 | F2 C3 | G2 B2"
        rhythm_bars "3 1 | 3 1 | 3 1 | 2 2"
      end

      placement :coda_bass, part: :triangle, at: "bar 17 beat 1", role: :bass, realization: "plagal floor"
    end
  end
end
