const STORAGE_KEY = "catalyst-castellum:tutorial-guidance:v1";

const browserStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const loadDismissedGuideIds = (): string[] => {
  const storage = browserStorage();
  if (!storage) return [];
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
};

export const saveDismissedGuideIds = (guideIds: string[]): void => {
  browserStorage()?.setItem(STORAGE_KEY, JSON.stringify([...new Set(guideIds)]));
};

export const clearDismissedGuideIds = (): void => {
  browserStorage()?.removeItem(STORAGE_KEY);
};
