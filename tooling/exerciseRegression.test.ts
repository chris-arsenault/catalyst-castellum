import { describe, expect, it } from "vitest";
import direct from "./fixtures/harker-direct-regression.json";
import catalyst from "./fixtures/harker-catalyst-regression.json";
import { exerciseCommandsSchema, runExercise } from "./exerciseRunner";

describe("authored exercise regression layouts", () => {
  it.each([
    ["direct", direct],
    ["catalyst", catalyst],
  ] as const)(
    "completes %s from the same starting budget with every input accepted",
    (_, commands) => {
      const result = runExercise(exerciseCommandsSchema.parse(commands), {
        ticks: 12000,
        observer: "summary",
        traceLimit: 0,
      });
      expect(result.commands.every((record) => record.decision.allowed)).toBe(true);
      expect(result.termination).toBe("complete");
      expect(result.waveIndex).toBe(4);
      expect(result.reports).toHaveLength(5);
      expect(result.current.coreIntegrity).toBeGreaterThan(0);
      expect(result.unexecutedCommands).toEqual([]);
      expect(result.skippedCommands).toEqual([]);
    }
  );
});
