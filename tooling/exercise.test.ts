import { describe, expect, it } from "vitest";
import { parseExerciseCli } from "./exercise";
import { runExercise, type ExerciseScheduledCommand } from "./exerciseRunner";

describe("exercise command runner", () => {
  it("runs the idle policy to a loss and retains all five authored starts", () => {
    const result = runExercise(null, { ticks: 2000, observer: "summary", traceLimit: 0 });
    expect(result.scheduledCommands).toHaveLength(5);
    expect(result.termination).toBe("defeat");
    expect(result.reports.at(-1)!.termination).toBe("defeat");
    expect(result.current.catalyst!.accounting.input).toBe(0);
  });
  it("replays sparse authored sequence numbers and records each rejection once", () => {
    const commands: ExerciseScheduledCommand[] = [
      {
        waveIndex: 0,
        tick: 0,
        sequence: 5,
        command: { type: "upgrade_tower", towerId: "missing", upgradeId: "flash_calibration" },
      },
      { waveIndex: 0, tick: 0, sequence: 8, command: { type: "start_assault" } },
    ];
    const options = { ticks: 30, observer: "summary" as const, traceLimit: 0 };
    const mid = runExercise(commands, { ...options, ticks: 3 });
    expect(mid.commands.map((record) => record.input.sequence)).toEqual([5, 8]);
    expect(mid.commands[0]!.decision.allowed).toBe(false);
    const resumed = runExercise(
      commands,
      { ...options, ticks: 27, observer: "trace", traceLimit: 1 },
      mid.finalSnapshot
    );
    const whole = runExercise(commands, options);
    expect(JSON.parse(resumed.finalSnapshot)).toEqual(JSON.parse(whole.finalSnapshot));
    expect(resumed.commands).toEqual([]);
    expect(() => runExercise([...commands].reverse(), options)).toThrow("strictly increasing");
  });
  it("validates local CLI flags and current artifact ownership", () => {
    expect(parseExerciseCli([]).observer).toBe("summary");
    expect(() => parseExerciseCli(["--ticks", "1.5"])).toThrow("integer");
    expect(() => parseExerciseCli(["--input", "saved.json", "--commands", "new.json"])).toThrow(
      "retained"
    );
  });
});
