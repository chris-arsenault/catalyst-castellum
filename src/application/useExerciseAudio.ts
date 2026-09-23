import { useEffect, useMemo } from "react";
import { attachMusicCueInputs, type MusicCueInputs } from "../audio";
import type { ExerciseState } from "../game/exercise";

const cueSource = () => {
  let current: MusicCueInputs = {
    inSession: false,
    phase: null,
    assaultTheme: "standard",
    coreIntegrityFraction: 1,
  };
  const listeners = new Set<(inputs: MusicCueInputs) => void>();
  return {
    getState: () => current,
    subscribe: (listener: (inputs: MusicCueInputs) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (inputs: MusicCueInputs) => {
      current = inputs;
      for (const listener of listeners) listener(inputs);
    },
  };
};

export const useExerciseAudio = (state: ExerciseState | null) => {
  const source = useMemo(() => cueSource(), []);
  useEffect(() => attachMusicCueInputs(source), [source]);
  useEffect(() => {
    let phase: MusicCueInputs["phase"] = null;
    if (state?.encounter.phase === "complete") phase = "round_result";
    else if (state?.encounter.phase === "timeout") phase = "defeat";
    else phase = state?.encounter.phase ?? null;
    source.update({
      inSession: state !== null,
      assaultTheme: "standard",
      phase,
      coreIntegrityFraction: (state?.encounter.coreIntegrity ?? 100) / 100,
    });
  }, [source, state]);
};
