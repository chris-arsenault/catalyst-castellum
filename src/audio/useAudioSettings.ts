import { useSyncExternalStore } from "react";
import { getAudioSettings, subscribeAudioSettings } from "./settings";
import type { AudioSettings } from "./types";

export const useAudioSettings = (): AudioSettings =>
  useSyncExternalStore(subscribeAudioSettings, getAudioSettings);
