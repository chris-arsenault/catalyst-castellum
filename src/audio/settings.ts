import type { AudioSettings } from "./types";

const STORAGE_KEY = "castellum.audio.v1";

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  musicVolume: 0.7,
  sfxVolume: 0.8,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const sanitize = (raw: unknown): AudioSettings => {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SETTINGS };
  const candidate = raw as Partial<Record<keyof AudioSettings, unknown>>;
  return {
    muted: typeof candidate.muted === "boolean" ? candidate.muted : DEFAULT_SETTINGS.muted,
    musicVolume:
      typeof candidate.musicVolume === "number" && Number.isFinite(candidate.musicVolume)
        ? clamp01(candidate.musicVolume)
        : DEFAULT_SETTINGS.musicVolume,
    sfxVolume:
      typeof candidate.sfxVolume === "number" && Number.isFinite(candidate.sfxVolume)
        ? clamp01(candidate.sfxVolume)
        : DEFAULT_SETTINGS.sfxVolume,
  };
};

const load = (): AudioSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

let settings = load();
const listeners = new Set<() => void>();

const persist = (): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or storage quota: settings just live for the session.
  }
};

const update = (patch: Partial<AudioSettings>): void => {
  settings = sanitize({ ...settings, ...patch });
  persist();
  for (const listener of listeners) listener();
};

export const getAudioSettings = (): AudioSettings => settings;

export const setMuted = (muted: boolean): void => update({ muted });
export const setMusicVolume = (musicVolume: number): void => update({ musicVolume });
export const setSfxVolume = (sfxVolume: number): void => update({ sfxVolume });

export const subscribeAudioSettings = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
