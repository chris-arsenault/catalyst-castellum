import { useEffect } from "react";
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
