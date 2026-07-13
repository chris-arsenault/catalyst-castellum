import type { QuantizeUnit } from "./types";

/**
 * The musical grid of a playing loop: when its bar 1 beat 1 started (in
 * AudioContext time) and how long a beat/bar lasts. Loop restarts stay on
 * this grid because loop length is a whole number of bars derived from the
 * decoded buffer duration.
 */
export interface MusicalGrid {
  startTime: number;
  secondsPerBeat: number;
  beatsPerBar: number;
}

const EPSILON = 1e-3;

/**
 * The next boundary of `unit` on the grid at or after `now`. If a bar
 * boundary is further away than `maxWaitSeconds`, falls back to the next
 * beat so urgent cues never wait for a slow bar. Returns `now` for
 * "immediate" or when the grid has not started yet.
 */
export const nextBoundary = (
  grid: MusicalGrid,
  now: number,
  unit: QuantizeUnit,
  maxWaitSeconds = 3
): number => {
  if (unit === "immediate") return now;
  const elapsed = now - grid.startTime;
  if (elapsed < 0) return now;

  const unitSeconds = unit === "bar" ? grid.secondsPerBeat * grid.beatsPerBar : grid.secondsPerBeat;
  const boundary = grid.startTime + Math.ceil((elapsed + EPSILON) / unitSeconds) * unitSeconds;
  if (unit === "bar" && boundary - now > maxWaitSeconds) {
    return nextBoundary(grid, now, "beat", maxWaitSeconds);
  }
  return boundary;
};
