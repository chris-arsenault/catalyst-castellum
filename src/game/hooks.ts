import { useEffect } from "react";
import { useGameStore } from "./store";

export const useSimulationClock = (): void => {
  const tick = useGameStore((state) => state.tick);

  useEffect(() => {
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
  }, [tick]);
};
