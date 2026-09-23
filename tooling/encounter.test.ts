import { describe, expect, it } from "vitest";
import { executeEncounterCliRun, parseEncounterCli } from "./encounter";
import { parseEncounterArtifact } from "./encounterArtifact";

describe("local encounter CLI", () => {
  it("requires exact integer limits and explicit replay input", () => {
    expect(parseEncounterCli(["run", "--ticks", "80", "--observer", "trace"])).toMatchObject({
      ticks: 80,
      observer: "trace",
    });
    for (const args of [
      ["run", "--ticks", "2.5"],
      ["run", "--ticks", "8junk"],
      ["run", "--batch-size", "0"],
      ["replay"],
      ["run", "--unknown", "1"],
    ]) {
      expect(() => parseEncounterCli(args)).toThrow();
    }
  });

  it("produces a versioned reproducibility artifact with a replayable mid-assault snapshot", () => {
    const run = executeEncounterCliRun(parseEncounterCli(["run", "--ticks", "10"]));
    const artifact = parseEncounterArtifact(JSON.stringify(run));
    expect(artifact.finalSnapshot).toBe(run.finalSnapshot);
    expect(artifact.scheduledCommands).toEqual(run.scheduledCommands);
    expect(run.summary.termination).toBe("tick_limit");
    expect(run.ticksAdvanced).toBe(10);
    expect(run.timings.setupMs).toBeGreaterThanOrEqual(0);
    expect(run.timings.runMs).toBeGreaterThanOrEqual(0);
    expect(() => parseEncounterArtifact(JSON.stringify({ ...run, version: 0 }))).toThrow();
  });
});
