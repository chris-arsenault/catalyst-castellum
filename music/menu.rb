production_piece "Gate of the Castellum (menu)" do
  meter "4/4"
  key "A minor"

  tempo do
    mark "quarter = 104", at: "bar 1 beat 1"
  end

# Menu theme: dignified and a little mysterious. Sparse two-to-three voice
# texture so the assault tracks land harder by contrast.
# library_ref dsl:chip/CT1_PULSE_ECHO_LEAD - pulse 2 echoes the lead in the A sections.
# library_ref dsl:chip/CT3_FAMICHORD_VOICING - mid-register chord tones under the B section.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "square lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "echo and chord tones"
    part :triangle, "Triangle", music21: "Violoncello", family: :string, description: "triangle bass"
  end

  section :a1, "Gate theme", bars: 1..8, type: :hybrid_phrase_staff do
    journey "the gate theme states itself plainly, echoed one beat behind"
    destination "half cadence energy resolved back to A minor at bar 8"

    span bars: 1..8, texture: :melody_over_bass do
      chords "b1:Am b2:G b3:F b4:E b5:Am b6:G b7:E b8:Am"

      phrase :a_lead, surface: :split_pitch_rhythm do
        pitch_bars  "A4{mp} C5 E5 D5 | B4 G4 D5 | F4 A4 C5 D5 | B4 G#4 E4 | A4 C5 E5 D5 | D5 B4 G4 | B4 G#4 B4 D5 | A4 r"
        rhythm_bars "1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 1 1 | 3 1"
      end

      placement :a_lead, part: :pulse1, at: "bar 1 beat 1", role: :foreground, realization: "gate theme"

      phrase :a_echo, surface: :split_pitch_rhythm do
        pitch_bars  "r A4{p} C5 E5 | r B4 G4 D5 | r F4 A4 C5 | r B4 G#4 E4 | r A4 C5 E5 | r D5 B4 G4 | r B4 G#4 B4 | r A4 r"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 2 1"
      end

      placement :a_echo, part: :pulse2, at: "bar 1 beat 1", role: :background, realization: "one-beat echo of the gate theme"

      phrase :a_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{mp} E3 A2 | G2 D3 G2 | F2 C3 F2 | E2 B2 E2 | A2 E3 A2 | G2 D3 B2 | E2 B2 E2 | A2 A2 B2"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :a_bass, part: :triangle, at: "bar 1 beat 1", role: :bass, realization: "root-fifth floor"
    end
  end

  section :b, "Inner ward", bars: 9..16, type: :hybrid_phrase_staff do
    journey "relative-major lift with sustained chord tones instead of echo"
    destination "dominant at bar 16 hands back to the gate theme"

    span bars: 9..16, texture: :melody_over_bass do
      chords "b9:C b10:G b11:Am b12:Em b13:F b14:C b15:Dm b16:E"

      phrase :b_lead, surface: :split_pitch_rhythm do
        pitch_bars  "G5{mf} E5 C5 | D5 B4 G4 | C5 E5 A5 | B4 G4 E5 | A4 C5 F5 | G5 E5 C5 | F5 D5 A4 | G#4 B4 E5"
        rhythm_bars "1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :b_lead, part: :pulse1, at: "bar 9 beat 1", role: :foreground, realization: "inner ward tune"

      phrase :b_thirds, surface: :split_pitch_rhythm do
        pitch_bars  "E4{p} | B3 | C4 | G3 B3 | A3{mp,cresc(} C4 | E4 G4 | F4 A4 | B3 D4{cresc)}"
        rhythm_bars "4 | 4 | 4 | 2 2 | 2 2 | 2 2 | 2 2 | 2 2"
      end

      placement :b_thirds, part: :pulse2, at: "bar 9 beat 1", role: :background, realization: "sustained chord 3rds"

      phrase :b_bass, surface: :split_pitch_rhythm do
        pitch_bars  "C3{mp} G2 | G2 D3 B2 | A2 E3 | E2 G2 E2 | F2 C3 | C3 E3 C3 | D3 A2 C3 | E2 B2 E3"
        rhythm_bars "2 2 | 2 1 1 | 2 2 | 2 1 1 | 2 2 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :b_bass, part: :triangle, at: "bar 9 beat 1", role: :bass, realization: "root-fifth halves"
    end
  end

  section :a2, "Gate theme return", bars: 17..24, type: :hybrid_phrase_staff do
    journey "the gate theme returns and bends its cadence onto the dominant"
    destination "bar 24 ends on E so the loop resolves into bar 1"

    span bars: 17..24, texture: :melody_over_bass do
      chords "b17:Am b18:G b19:F b20:E b21:Am b22:G b23:F b24:E"

      phrase :a2_lead, surface: :split_pitch_rhythm do
        pitch_bars  "A4{mp} C5 E5 D5 | B4 G4 D5 | F4 A4 C5 D5 | B4 G#4 E4 | A4 C5 E5 | D5 E5 B4 | C5 A4 F4 | G#4 B4 E5"
        rhythm_bars "1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :a2_lead, part: :pulse1, at: "bar 17 beat 1", role: :foreground, realization: "gate theme with dominant exit"

      # Return differentiates: echo for four bars, then a real counterline
      # in 3rds/6ths under the new cadence instead of more echo.
      phrase :a2_echo, surface: :split_pitch_rhythm do
        pitch_bars  "r A4{p} C5 E5 | r B4 G4 D5 | r F4 A4 C5 | r B4 G#4 E4 | C5{mp} A4 C5 | B4 G4 D4 | A4 F4 A4 | B4 E4 G#4"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :a2_echo, part: :pulse2, at: "bar 17 beat 1", role: :background, realization: "one-beat echo of the return"

      phrase :a2_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{mp} E3 G2 | G2 D3 G2 | F2 C3 E2 | E2 B2 E2 | A2 E3 A2 | G2 D3 B2 | F2 C3 F2 | E2 E3 G#2"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :a2_bass, part: :triangle, at: "bar 17 beat 1", role: :bass, realization: "root-fifth floor with leading-tone exit"
    end
  end
end
