import { describe, expect, it } from "vitest";
import { nextBoundary, type MusicalGrid } from "./quantize";

// 120 bpm, 4/4: beat = 0.5s, bar = 2s.
const grid: MusicalGrid = { startTime: 10, secondsPerBeat: 0.5, beatsPerBar: 4 };

describe("nextBoundary", () => {
  it("returns now for immediate transitions", () => {
    expect(nextBoundary(grid, 11.3, "immediate")).toBeCloseTo(11.3, 9);
  });

  it("snaps to the next beat", () => {
    expect(nextBoundary(grid, 11.3, "beat")).toBeCloseTo(11.5, 6);
  });

  it("snaps to the next bar", () => {
    expect(nextBoundary(grid, 11.3, "bar")).toBeCloseTo(12, 6);
  });

  it("does not return the current instant when already on a boundary", () => {
    expect(nextBoundary(grid, 12, "bar")).toBeCloseTo(14, 6);
    expect(nextBoundary(grid, 12, "beat")).toBeCloseTo(12.5, 6);
  });

  it("stays on grid after many loops", () => {
    // 1000 elapsed bars later the boundary is still an exact bar multiple.
    const later = 10 + 2 * 1000 + 0.7;
    expect(nextBoundary(grid, later, "bar")).toBeCloseTo(10 + 2 * 1001, 4);
  });

  it("falls back to the beat when the bar is too far away", () => {
    const slowGrid: MusicalGrid = { startTime: 0, secondsPerBeat: 1.2, beatsPerBar: 4 };
    // Next bar is at 4.8s, more than 3s away from now=0.1.
    expect(nextBoundary(slowGrid, 0.1, "bar", 3)).toBeCloseTo(1.2, 6);
  });

  it("returns now before the grid has started", () => {
    expect(nextBoundary(grid, 9, "bar")).toBeCloseTo(9, 9);
  });
});
