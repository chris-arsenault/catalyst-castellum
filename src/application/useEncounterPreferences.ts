import { useState } from "react";

export const useEncounterPreferences = () => {
  const [reducedMotion, setReducedMotion] = useState(
    () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  const [focusedRouteId, focusRoute] = useState<string | null>(null);
  return { reducedMotion, setReducedMotion, focusedRouteId, focusRoute };
};
