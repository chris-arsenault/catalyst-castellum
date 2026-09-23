/* global console, process */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { exerciseCommandsSchema, runExercise } from "./exerciseRunner";

const integer = (value: string): number => {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number))
    throw new Error("Expected a nonnegative integer.");
  return number;
};
const parseValues = (args: readonly string[]) => {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]!;
    const value = args[index + 1];
    if (
      !["--ticks", "--observer", "--trace-limit", "--commands", "--input", "--output"].includes(
        flag
      ) ||
      !value ||
      value.startsWith("--") ||
      values.has(flag)
    )
      throw new Error(`Invalid or repeated option ${flag}.`);
    values.set(flag, value);
  }
  return values;
};
export const parseExerciseCli = (args: readonly string[]) => {
  const values = parseValues(args);
  const observer = z.enum(["summary", "trace"]).parse(values.get("--observer") ?? "summary");
  if (values.has("--commands") && values.has("--input"))
    throw new Error("Replay uses the commands retained in its input artifact.");
  return {
    ticks: integer(values.get("--ticks") ?? "12000"),
    observer,
    traceLimit: integer(values.get("--trace-limit") ?? "200"),
    commands: values.get("--commands"),
    input: values.get("--input"),
    output: values.get("--output"),
  };
};
const artifactSchema = z.object({
  format: z.literal("catalyst-exercise-run"),
  version: z.literal(1),
  scheduledCommands: exerciseCommandsSchema,
  finalSnapshot: z.string(),
});
const main = (): void => {
  const options = parseExerciseCli(process.argv.slice(2));
  const artifact = options.input
    ? artifactSchema.parse(JSON.parse(readFileSync(options.input, "utf8")))
    : null;
  const commands = options.commands
    ? exerciseCommandsSchema.parse(JSON.parse(readFileSync(options.commands, "utf8")))
    : (artifact?.scheduledCommands ?? null);
  const result = runExercise(commands, options, artifact?.finalSnapshot ?? null);
  if (options.output) writeFileSync(options.output, JSON.stringify(result, null, 2) + "\n");
  const printable = { ...result, finalSnapshot: undefined };
  console.log(JSON.stringify(printable, null, 2));
};
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
