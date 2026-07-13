import { levelDefinitionFor } from "../game/queries";
import type { GameStore } from "../application/storeTypes";
import { selectMusicCue, type MusicCueInputs } from "./cue";
import { getMusicDirector } from "./director";
import { getAudioEngine } from "./engine";

export const cueInputsFromStore = (state: GameStore): MusicCueInputs => {
  const level = levelDefinitionFor(state.game);
  return {
    inSession: state.initialized && state.activeSlotId !== null,
    phase: state.game.phase,
    assaultTheme: level.assaultTheme,
    coreIntegrityFraction:
      level.startingCoreIntegrity > 0 ? state.game.coreIntegrity / level.startingCoreIntegrity : 1,
  };
};

interface StoreLike {
  getState: () => GameStore;
  subscribe: (listener: (state: GameStore) => void) => () => void;
}

/**
 * Wires the music director to the application store and handles the
 * browser's autoplay policy: the AudioContext unlocks on the first user
 * gesture, at which point the currently desired cue starts and the rest of
 * the soundtrack preloads. Returns a cleanup function.
 */
export const attachAudioDirector = (store: StoreLike): (() => void) => {
  const engine = getAudioEngine();
  const director = getMusicDirector();

  const apply = (state: GameStore): void => {
    director.setCue(selectMusicCue(cueInputsFromStore(state)));
  };

  const unsubscribe = store.subscribe(apply);
  apply(store.getState());

  const unlock = (): void => {
    engine
      .unlock()
      .then((unlocked) => {
        if (!unlocked) return;
        removeUnlockListeners();
        director.onUnlocked();
        director.preloadAll();
      })
      .catch(() => {});
  };
  const removeUnlockListeners = (): void => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  if (engine.supported) {
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  return () => {
    unsubscribe();
    removeUnlockListeners();
    director.setCue(null);
  };
};
