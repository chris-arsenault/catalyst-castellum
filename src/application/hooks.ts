import { useCallback, useEffect, useState } from "react";
import { attachAudioDirector } from "../audio";
import { useGameStore } from "./store";
import { flushScheduledGameSave } from "./persistence/saveScheduler";

export const useApplicationInitialization = (): void => {
  const initialize = useGameStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    const flush = () => flushScheduledGameSave();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [initialize]);
};

export const useAudioDirector = (): void => {
  useEffect(() => attachAudioDirector(useGameStore), []);
};

export const useSimulationClock = (): void => {
  const tick = useGameStore((state) => state.tick);
  const initialized = useGameStore((state) => state.initialized);
  const activeSlotId = useGameStore((state) => state.activeSlotId);

  useEffect(() => {
    if (!initialized || !activeSlotId) return;
    let previous = performance.now();
    let accumulator = 0;

    const timer = window.setInterval(() => {
      const now = performance.now();
      accumulator += Math.min((now - previous) / 1000, 0.5);
      previous = now;

      while (accumulator >= 0.1) {
        tick(0.1);
        accumulator -= 0.1;
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [activeSlotId, initialized, tick]);
};

export interface ExpandSet<Id extends string> {
  readonly expanded: ReadonlySet<Id>;
  readonly toggle: (id: Id) => void;
  readonly set: (ids: ReadonlySet<Id>) => void;
  readonly reset: () => void;
}

/** Multi-expand state for trees with several open branches. See ADR-020. */
export const useExpandSet = <Id extends string>(initial: readonly Id[] = []): ExpandSet<Id> => {
  const [expanded, setExpanded] = useState<ReadonlySet<Id>>(() => new Set(initial));
  const toggle = useCallback((id: Id) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const set = useCallback((ids: ReadonlySet<Id>) => setExpanded(new Set(ids)), []);
  const reset = useCallback(() => setExpanded(new Set<Id>()), []);
  return { expanded, toggle, set, reset };
};
