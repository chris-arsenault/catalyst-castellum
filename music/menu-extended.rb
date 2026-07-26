production_piece "Gate of the Castellum (extended)" do
  meter "4/4"
  key "A minor"

  tempo do
    mark "quarter = 104", at: "bar 1 beat 1"
  end

# Extended menu theme: the chip menu loop composed through at production
# length (52 bars = 2:00 at 104). Same roster, same tempo, same key as
# music/menu.rb so the runtime can hand over between the chip stems and a
# pre-rendered mix of this score on the same grid. The chip loop's three
# sections stay intact and become the pillars; an intro, a darker C section
# under the keep, and a broadened B return carry it to full length.
# library_ref dsl:chip/CT1_PULSE_ECHO_LEAD - pulse 2 echoes the lead in the A sections.
# library_ref dsl:chip/CT3_FAMICHORD_VOICING - mid-register chord tones under the B section.

  roster do
    part :pulse1, "Pulse 1", music21: "Clarinet", family: :woodwind, description: "square lead"
    part :pulse2, "Pulse 2", music21: "Oboe", family: :woodwind, description: "echo and chord tones"
    part :triangle, "Tri Bass", music21: "Violoncello", family: :string, description: "triangle bass"
  end

  section :intro, "Approach", bars: 1..4, type: :hybrid_phrase_staff do
    journey "the bass floor walks up to the gate before anyone speaks"
    destination "the dominant at bar 4 opens the gate theme"

    span bars: 1..4, texture: :melody_over_bass do
      chords "b1:Am b2:Am b3:F b4:E"

      phrase :intro_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{p} E3 A2 | A2 E3 A2 | F2 C3 F2 | E2 B2 E3"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :intro_bass, part: :triangle, at: "bar 1 beat 1", role: :bass, realization: "root-fifth floor alone"

      phrase :intro_air, surface: :split_pitch_rhythm do
        pitch_bars  "r | E4{pp} | A3 C4 | B3 G#3"
        rhythm_bars "4 | 4 | 2 2 | 2 2"
      end

      placement :intro_air, part: :pulse2, at: "bar 1 beat 1", role: :background, realization: "a bare fifth answers the floor"
    end
  end

  section :a1, "Gate theme", bars: 5..12, type: :hybrid_phrase_staff do
    journey "the gate theme states itself plainly, echoed one beat behind"
    destination "half cadence energy resolved back to A minor at bar 12"

    span bars: 5..12, texture: :melody_over_bass do
      chords "b5:Am b6:G b7:F b8:E b9:Am b10:G b11:E b12:Am"

      phrase :a_lead, surface: :split_pitch_rhythm do
        pitch_bars  "A4{mp} C5 E5 D5 | B4 G4 D5 | F4 A4 C5 D5 | B4 G#4 E4 | A4 C5 E5 D5 | D5 B4 G4 | B4 G#4 B4 D5 | A4 r"
        rhythm_bars "1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 1 1 | 3 1"
      end

      placement :a_lead, part: :pulse1, at: "bar 5 beat 1", role: :foreground, realization: "gate theme"

      phrase :a_echo, surface: :split_pitch_rhythm do
        pitch_bars  "r A4{p} C5 E5 | r B4 G4 D5 | r F4 A4 C5 | r B4 G#4 E4 | r A4 C5 E5 | r D5 B4 G4 | r B4 G#4 B4 | r A4 r"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 2 1"
      end

      placement :a_echo, part: :pulse2, at: "bar 5 beat 1", role: :background, realization: "one-beat echo of the gate theme"

      phrase :a_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{mp} E3 A2 | G2 D3 G2 | F2 C3 F2 | E2 B2 E2 | A2 E3 A2 | G2 D3 B2 | E2 B2 E2 | A2 A2 B2"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :a_bass, part: :triangle, at: "bar 5 beat 1", role: :bass, realization: "root-fifth floor"
    end
  end

  section :b1, "Inner ward", bars: 13..20, type: :hybrid_phrase_staff do
    journey "relative-major lift with sustained chord tones instead of echo"
    destination "dominant at bar 20 hands back to the gate theme"

    span bars: 13..20, texture: :melody_over_bass do
      chords "b13:C b14:G b15:Am b16:Em b17:F b18:C b19:Dm b20:E"

      phrase :b_lead, surface: :split_pitch_rhythm do
        pitch_bars  "G5{mf} E5 C5 | D5 B4 G4 | C5 E5 A5 | B4 G4 E5 | A4 C5 F5 | G5 E5 C5 | F5 D5 A4 | G#4 B4 E5"
        rhythm_bars "1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :b_lead, part: :pulse1, at: "bar 13 beat 1", role: :foreground, realization: "inner ward tune"

      phrase :b_thirds, surface: :split_pitch_rhythm do
        pitch_bars  "E4{p} | B3 | C4 | G3 B3 | A3{mp,cresc(} C4 | E4 G4 | F4 A4 | B3 D4{cresc)}"
        rhythm_bars "4 | 4 | 4 | 2 2 | 2 2 | 2 2 | 2 2 | 2 2"
      end

      placement :b_thirds, part: :pulse2, at: "bar 13 beat 1", role: :background, realization: "sustained chord 3rds"

      phrase :b_bass, surface: :split_pitch_rhythm do
        pitch_bars  "C3{mp} G2 | G2 D3 B2 | A2 E3 | E2 G2 E2 | F2 C3 | C3 E3 C3 | D3 A2 C3 | E2 B2 E3"
        rhythm_bars "2 2 | 2 1 1 | 2 2 | 2 1 1 | 2 2 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :b_bass, part: :triangle, at: "bar 13 beat 1", role: :bass, realization: "root-fifth halves"
    end
  end

  section :a2, "Gate theme return", bars: 21..28, type: :hybrid_phrase_staff do
    journey "the gate theme returns and trades its echo for a real counterline"
    destination "the dominant at bar 28 resolves down into the keep"

    span bars: 21..28, texture: :melody_over_bass do
      chords "b21:Am b22:G b23:F b24:E b25:Am b26:G b27:F b28:E"

      phrase :a2_lead, surface: :split_pitch_rhythm do
        pitch_bars  "A4{mp} C5 E5 D5 | B4 G4 D5 | F4 A4 C5 D5 | B4 G#4 E4 | A4 C5 E5 | D5 E5 B4 | C5 A4 F4 | G#4 B4 E5"
        rhythm_bars "1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :a2_lead, part: :pulse1, at: "bar 21 beat 1", role: :foreground, realization: "gate theme with dominant exit"

      # Return differentiates: echo for four bars, then a real counterline
      # in 3rds/6ths under the new cadence instead of more echo.
      phrase :a2_echo, surface: :split_pitch_rhythm do
        pitch_bars  "r A4{p} C5 E5 | r B4 G4 D5 | r F4 A4 C5 | r B4 G#4 E4 | C5{mp} A4 C5 | B4 G4 D4 | A4 F4 A4 | B4 E4 G#4"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 2 | 1 1 2 | 1 1 2 | 1 1 2"
      end

      placement :a2_echo, part: :pulse2, at: "bar 21 beat 1", role: :background, realization: "one-beat echo of the return"

      phrase :a2_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{mp} E3 G2 | G2 D3 G2 | F2 C3 E2 | E2 B2 E2 | A2 E3 A2 | G2 D3 B2 | F2 C3 F2 | E2 E3 G#2"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :a2_bass, part: :triangle, at: "bar 21 beat 1", role: :bass, realization: "root-fifth floor with leading-tone exit"
    end
  end

  section :c, "Under the keep", bars: 29..36, type: :hybrid_phrase_staff do
    journey "the gate theme sinks an octave into pulse 2 while the lead holds a slow descant above it"
    destination "the dominant at bar 36 climbs back out into the light"

    span bars: 29..36, texture: :melody_over_bass do
      chords "b29:Am b30:Dm b31:Bdim b32:E b33:Am b34:Dm b35:F b36:E"

      # The one place the theme leaves the lead: pulse 2 carries it low and
      # plain, and the roles above and below it invert around that.
      phrase :c_theme, surface: :split_pitch_rhythm do
        pitch_bars  "A3{mp} C4 E4 D4 | D4 F4 A4 | B3 D4 F4 D4 | E4 B3 G#3 | A3 C4 E4 D4 | D4 F4 A4 | F4 A4 C5 A4 | G#4 B4 E4"
        rhythm_bars "1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2"
      end

      placement :c_theme, part: :pulse2, at: "bar 29 beat 1", role: :foreground, realization: "gate theme in the low register"

      phrase :c_descant, surface: :split_pitch_rhythm do
        pitch_bars  "E5{p} | F5 | F5 D5 | E5 B4 | C5{mp,cresc(} E5 | F5 A5 | A5 G5 F5 | E5 D5 B4{cresc)}"
        rhythm_bars "4 | 4 | 2 2 | 2 2 | 2 2 | 2 2 | 1 1 2 | 1 1 2"
      end

      placement :c_descant, part: :pulse1, at: "bar 29 beat 1", role: :background, realization: "slow descant over the theme"

      phrase :c_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{mp} E3 A2 | D3 A2 D3 | B2 F3 B2 | E2 B2 E3 | A2 E3 A2 | D3 A2 D3 | F2 C3 F2 | E2 B2 E3"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :c_bass, part: :triangle, at: "bar 29 beat 1", role: :bass, realization: "root-fifth floor through the subdominant"
    end
  end

  section :b2, "Inner ward broadened", bars: 37..44, type: :hybrid_phrase_staff do
    journey "the ward tune returns in motion, its chord tones now walking instead of holding"
    destination "the dominant at bar 44 sets up the last statement"

    span bars: 37..44, texture: :melody_over_bass do
      chords "b37:C b38:G b39:Am b40:Em b41:F b42:C b43:Dm b44:E"

      phrase :b2_lead, surface: :split_pitch_rhythm do
        pitch_bars  "G5{mf} E5 C5 E5 | D5 B4 G4 B4 | C5 E5 A5 | B4 G4 E5 | A5{f} F5 C5 F5 | G5 E5 C5 E5 | F5 D5 A5 F5 | E5 D5 C5 B4"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 2 | 1 1 2 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :b2_lead, part: :pulse1, at: "bar 37 beat 1", role: :foreground, realization: "inner ward tune opened out"

      phrase :b2_tones, surface: :split_pitch_rhythm do
        pitch_bars  "E4{mp} G4 E4 C4 | D4 B3 D4 G4 | E4 A4 C5 A4 | B3 E4 G4 E4 | A3 C4 F4 C4 | G3 C4 E4 C4 | A3 D4 F4 D4 | B3 E4 G#4 B4"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :b2_tones, part: :pulse2, at: "bar 37 beat 1", role: :background, realization: "walking chord tones"

      phrase :b2_bass, surface: :split_pitch_rhythm do
        pitch_bars  "C3{mp} G2 C3 | G2 D3 G2 | A2 E3 A2 | E2 B2 E3 | F2 C3 F2 | C3 G2 C3 | D3 A2 D3 | E2 B2 E3"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :b2_bass, part: :triangle, at: "bar 37 beat 1", role: :bass, realization: "root-fifth floor"
    end
  end

  section :a3, "Gate theme in full", bars: 45..52, type: :hybrid_phrase_staff do
    journey "the fullest statement of the gate theme, answered by a rising counterline"
    destination "bar 52 ends on E so the loop resolves into bar 1"

    span bars: 45..52, texture: :melody_over_bass do
      chords "b45:Am b46:G b47:F b48:E b49:Am b50:G b51:F b52:E"

      phrase :a3_lead, surface: :split_pitch_rhythm do
        pitch_bars  "A4{f} C5 E5 D5 | B4 G4 D5 | F4 A4 C5 D5 | B4 G#4 E4 | A4 C5 E5 A5 | G5 D5 B4 G4 | F5 C5 A4 F4 | E5 B4 G#4 E4"
        rhythm_bars "1 1 3/2 1/2 | 1 1 2 | 1 1 3/2 1/2 | 1 1 2 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :a3_lead, part: :pulse1, at: "bar 45 beat 1", role: :foreground, realization: "gate theme with a cascading exit"

      phrase :a3_counter, surface: :split_pitch_rhythm do
        pitch_bars  "r A4{mp} C5 E5 | r B4 G4 D5 | r F4 A4 C5 | r B4 G#4 E4 | C4 E4 A4 C5 | B3 D4 G4 B4 | A3 C4 F4 A4 | G#3 B3 E4 G#4"
        rhythm_bars "1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1 | 1 1 1 1"
      end

      placement :a3_counter, part: :pulse2, at: "bar 45 beat 1", role: :background, realization: "echo turning into a rising counterline"

      phrase :a3_bass, surface: :split_pitch_rhythm do
        pitch_bars  "A2{f} E3 A2 | G2 D3 G2 | F2 C3 F2 | E2 B2 E2 | A2 E3 A2 | G2 D3 G2 | F2 C3 F2 | E2 B2 E3"
        rhythm_bars "2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1 | 2 1 1"
      end

      placement :a3_bass, part: :triangle, at: "bar 45 beat 1", role: :bass, realization: "root-fifth floor into the loop point"
    end
  end
end
