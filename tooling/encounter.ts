/* global console, process */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { createEncounter } from "../src/game/encounter/create";
import { createEncounterRuntime } from "../src/game/encounter/runtime";
import {
  createNamedEncounterFixture,
  ENCOUNTER_FIXTURES,
  ENCOUNTER_VARIANTS,
  type EncounterFixtureName,
  type EncounterVariantName,
} from "../src/game/encounter/fixtures";
import { runEncounter, type EncounterObserverMode } from "../src/game/encounter/runner";
import { encounterCommandLogSchema, parseEncounterArtifact } from "./encounterArtifact";
import type { OrderedEncounterCommand } from "../src/game/encounter/types";

type Mode = "run" | "compare" | "replay";
export interface EncounterCliOptions {
  mode: Mode;
  fixture: EncounterFixtureName;
  variant: EncounterVariantName;
  ticks: number;
  batchSize: number;
  observer: EncounterObserverMode;
  traceLimit: number;
  input: string | null;
  output: string | null;
  commands: string | null;
}

const oneOf = <Value extends string>(value: string, values: readonly Value[]): Value => {
  if (!values.includes(value as Value))
    throw new Error(`Expected one of ${values.join(", ")}; got ${value}.`);
  return value as Value;
};
const integer = (value: string): number => {
  const parsed = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed))
    throw new Error(`Expected a nonnegative integer; got ${value}.`);
  return parsed;
};

const cliValues = (args: readonly string[]): Map<string, string> => {
  const values = new Map<string, string>();
  const flags = [
    "--fixture",
    "--variant",
    "--ticks",
    "--batch-size",
    "--observer",
    "--trace-limit",
    "--input",
    "--output",
    "--commands",
  ];
  for (let index = 1; index < args.length; index += 2) {
    const flag = args[index]!;
    const value = args[index + 1];
    if (!flags.includes(flag) || !value || value.startsWith("--") || values.has(flag))
      throw new Error(`Invalid or repeated option ${flag}.`);
    values.set(flag, value);
  }
  return values;
};

const valueOr = (values: Map<string, string>, flag: string, fallback: string): string =>
  values.get(flag) ?? fallback;

export const parseEncounterCli = (args: readonly string[]): EncounterCliOptions => {
  const mode = oneOf(args[0] ?? "run", ["run", "compare", "replay"] as const);
  const values = cliValues(args);
  const options: EncounterCliOptions = {
    mode,
    fixture: oneOf(valueOr(values, "--fixture", "corridor"), ENCOUNTER_FIXTURES),
    variant: oneOf(valueOr(values, "--variant", "paired"), ENCOUNTER_VARIANTS),
    ticks: integer(valueOr(values, "--ticks", "300")),
    batchSize: integer(valueOr(values, "--batch-size", "50")),
    observer: oneOf(valueOr(values, "--observer", "summary"), ["off", "summary", "trace"] as const),
    traceLimit: integer(valueOr(values, "--trace-limit", "200")),
    input: values.get("--input") ?? null,
    output: values.get("--output") ?? null,
    commands: values.get("--commands") ?? null,
  };
  validateOptions(options, values);
  return options;
};

const validateReplayOptions = (options: EncounterCliOptions, values: Map<string, string>): void => {
  if (options.mode !== "replay") return;
  if (!options.input) throw new Error("Replay requires --input with a local run artifact.");
  if (values.has("--fixture") || values.has("--variant"))
    throw new Error("Replay uses the fixture and variant recorded in its artifact.");
};

const validateOptions = (options: EncounterCliOptions, values: Map<string, string>): void => {
  const { mode } = options;
  if (options.batchSize === 0) throw new Error("Batch size must be positive.");
  if (mode !== "replay" && options.input) throw new Error("--input belongs to replay.");
  if (mode !== "run" && options.commands) throw new Error("--commands belongs to run.");
  if (mode === "compare" && values.has("--variant"))
    throw new Error("Compare runs paired, calibrated, and idle variants.");
  validateReplayOptions(options, values);
};

const commandsFromFile = (path: string | null, fallback: readonly OrderedEncounterCommand[]) =>
  path ? encounterCommandLogSchema.parse(JSON.parse(readFileSync(path, "utf8"))) : fallback;

export const executeEncounterCliRun = (options: EncounterCliOptions) => {
  const setupStart = performance.now();
  const replay = options.input ? parseEncounterArtifact(readFileSync(options.input, "utf8")) : null;
  const fixture = createNamedEncounterFixture(
    replay?.fixture ?? options.fixture,
    replay?.variant ?? options.variant
  );
  const runtime = createEncounterRuntime(fixture.context);
  const initial = replay
    ? runtime.load(replay.finalSnapshot)
    : createEncounter(fixture.context.combat, fixture.context.definition, fixture.context.process);
  if (!initial)
    throw new Error("Snapshot is incompatible with the named fixture or has invalid state.");
  const commands = commandsFromFile(
    options.commands,
    replay?.scheduledCommands ?? fixture.commands
  );
  const initialSnapshot = runtime.save(initial);
  const setupMs = performance.now() - setupStart;
  const runStart = performance.now();
  const result = runEncounter(fixture.context, commands, options, initial);
  const runMs = performance.now() - runStart;
  return {
    format: "catalyst-encounter-run" as const,
    version: 1 as const,
    fixture: fixture.name,
    variant: fixture.variant,
    startingBudget: fixture.context.definition.startingMatter,
    initialMatter: initial.matter,
    definition: initial.definition,
    options: {
      ticks: options.ticks,
      batchSize: options.batchSize,
      observer: options.observer,
      traceLimit: options.traceLimit,
    },
    initialSnapshot,
    finalSnapshot: runtime.save(result.state),
    scheduledCommands: commands,
    summary: result.summary,
    ticksAdvanced: result.ticksAdvanced,
    commands: result.commands,
    trace: result.trace,
    traceDropped: result.traceDropped,
    timings: { setupMs, runMs },
  };
};

const printableRun = (run: ReturnType<typeof executeEncounterCliRun>) => ({
  fixture: run.fixture,
  variant: run.variant,
  definition: run.definition,
  startingBudget: run.startingBudget,
  initialMatter: run.initialMatter,
  summary: run.summary,
  ticksAdvanced: run.ticksAdvanced,
  commands: run.commands,
  trace: run.trace,
  traceDropped: run.traceDropped,
  timings: run.timings,
});

const main = (): void => {
  const options = parseEncounterCli(process.argv.slice(2));
  const runs =
    options.mode === "compare"
      ? ENCOUNTER_VARIANTS.map((variant) => executeEncounterCliRun({ ...options, variant }))
      : [executeEncounterCliRun(options)];
  const artifact =
    options.mode === "compare" ? { format: "catalyst-encounter-comparison", runs } : runs[0];
  if (options.output) writeFileSync(options.output, JSON.stringify(artifact, null, 2) + "\n");
  console.log(
    JSON.stringify(
      options.mode === "compare" ? { comparison: runs.map(printableRun) } : printableRun(runs[0]!),
      null,
      2
    )
  );
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
