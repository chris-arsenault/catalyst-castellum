/* global console, process */
import { LEVEL_DEFINITIONS } from "../src/game/config";
import { evaluateLevel } from "../src/game/playtest/runner";
import { LEVEL_IDS, type LevelId } from "../src/game/types";
import type { LevelEvaluation, PlaytestResult } from "../src/game/playtest/types";
import { levelCopy } from "../src/presentation/levelCopy";

interface CliOptions {
  levelIds: LevelId[];
  runs: number;
  seed: number;
  json: boolean;
  assertIntended: boolean;
}

const valueAfter = (args: string[], flag: string): string | null => {
  const index = args.indexOf(flag);
  return index >= 0 ? (args[index + 1] ?? null) : null;
};

const parsePositiveInteger = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0)
    throw new Error(`Expected a positive integer, got ${value}`);
  return parsed;
};

const parseOptions = (args: string[]): CliOptions => {
  const level = valueAfter(args, "--level");
  if (level && !LEVEL_IDS.includes(level as LevelId)) throw new Error(`Unknown level: ${level}`);
  return {
    levelIds: level ? [level as LevelId] : [...LEVEL_IDS],
    runs: parsePositiveInteger(valueAfter(args, "--runs"), 200),
    seed: parsePositiveInteger(valueAfter(args, "--seed"), 13_371),
    json: args.includes("--json"),
    assertIntended: args.includes("--assert-intended"),
  };
};

const resultLine = (label: string, result: PlaytestResult): string =>
  `${label.padEnd(12)} ${result.success ? "PASS" : "FAIL"} · core ${result.coreIntegrity.toFixed(0).padStart(3)}% · ${result.plannedActions} planned / ${result.acceptedActions} accepted · ${result.roundsCleared} rounds · OX-1 ${result.killsBySource.hydrogen_oxygen_combustion} kills / ${result.damageBySource.hydrogen_oxygen_combustion.toFixed(0)} damage`;

const printEvaluation = (evaluation: LevelEvaluation): void => {
  const level = LEVEL_DEFINITIONS[evaluation.levelId];
  console.log(`\nL${level.number} ${levelCopy(level).name}`);
  console.log(resultLine("do nothing", evaluation.doNothing));
  console.log(resultLine("intended", evaluation.intended));
  console.log("actions       trials   pass rate   avg core");
  for (const band of evaluation.actionBands) {
    console.log(
      `${String(band.actions).padStart(7)} ${String(band.trials).padStart(12)} ${(band.passRate * 100).toFixed(1).padStart(10)}% ${band.averageCore.toFixed(1).padStart(10)}%`
    );
  }
  const unstable = evaluation.randomTrials.filter((trial) => !trial.stable).length;
  if (unstable > 0) console.log(`UNSTABLE TERMINATIONS: ${unstable}`);
};

const main = (): void => {
  const options = parseOptions(process.argv.slice(2));
  const evaluations = options.levelIds.map((levelId, index) =>
    evaluateLevel({ levelId, runs: options.runs, seed: options.seed + index * 10_007 })
  );
  if (options.json) console.log(JSON.stringify(evaluations, null, 2));
  else {
    console.log(`Catalyst Castellum headless playtest · ${options.runs} random policies per level`);
    for (const evaluation of evaluations) printEvaluation(evaluation);
  }
  if (options.assertIntended) {
    const failures = evaluations.flatMap((evaluation) => {
      const reasons: string[] = [];
      if (!evaluation.intended.success) reasons.push("intended policy failed");
      if (!evaluation.intended.stable) reasons.push("intended policy was unstable");
      if (evaluation.intended.breached > 0) reasons.push("intended policy allowed a breach");
      if (evaluation.intended.coreIntegrity < 100)
        reasons.push("intended policy finished below full core integrity");
      if (evaluation.doNothing.success) reasons.push("do-nothing policy unexpectedly passed");
      return reasons.length > 0 ? [`${evaluation.levelId}: ${reasons.join(", ")}`] : [];
    });
    if (failures.length > 0) throw new Error(`Campaign health failed: ${failures.join("; ")}`);
  }
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
