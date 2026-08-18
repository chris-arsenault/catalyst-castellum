/* global console, process */
import { LEVEL_DEFINITIONS } from "../src/game/config";
import { evaluateLevel } from "../src/game/playtest/runner";
import { runReferenceCampaign } from "../src/game/playtest/campaignRunner";
import { LEVEL_IDS, type LevelId } from "../src/game/types";
import type { LevelEvaluation, PlaytestResult } from "../src/game/playtest/types";
import { levelCopy } from "../src/presentation/levelCopy";

/** Stage 1 is the tuned tutorial and must play perfectly. */
const STRICT_HEALTH_LEVELS: LevelId[] = ["claim_8_delta"];

interface CliOptions {
  levelIds: LevelId[];
  runs: number;
  seed: number;
  json: boolean;
  assertPortfolio: boolean;
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
  if (level && !LEVEL_IDS.includes(level as never)) throw new Error(`Unknown level: ${level}`);
  return {
    levelIds: level ? [level as LevelId] : [...LEVEL_IDS],
    runs: parsePositiveInteger(valueAfter(args, "--runs"), 200),
    seed: parsePositiveInteger(valueAfter(args, "--seed"), 13_371),
    json: args.includes("--json"),
    assertPortfolio: args.includes("--assert-portfolio"),
  };
};

const resultLine = (label: string, result: PlaytestResult): string =>
  `${label.padEnd(24)} ${result.success ? "PASS" : "FAIL"} · core ${result.coreIntegrity.toFixed(0).padStart(3)}% · Matter ${result.matterSpent.toFixed(0).padStart(3)} · ${result.buildProfile.towers.length} towers · damage ${Object.values(
    result.damageBySource
  )
    .reduce((total, amount) => total + amount, 0)
    .toFixed(0)} · ${result.roundsCleared} rounds`;

const printEvaluation = (evaluation: LevelEvaluation): void => {
  const level = LEVEL_DEFINITIONS[evaluation.levelId];
  console.log(`\nL${level.number} ${levelCopy(level).name}`);
  console.log(resultLine("do nothing", evaluation.doNothing));
  for (const reference of evaluation.references) {
    console.log(
      resultLine(`${reference.archetype ?? "untyped"}: ${reference.planName}`, reference)
    );
  }
  for (const control of evaluation.failureControls) {
    console.log(resultLine(`must lose: ${control.planName}`, control));
  }
  const diversity = evaluation.diversity;
  console.log(
    `diversity                ${diversity.satisfied ? "PASS" : "FAIL"} · ${diversity.passingBuilds}/${diversity.minimumPassingBuilds} builds · ${diversity.passingArchetypes.length}/${diversity.minimumPassingArchetypes} archetypes · ${diversity.distinctPassingSignatures}/${diversity.minimumDistinctSignatures} signatures`
  );
  for (const issue of diversity.issues) console.log(`  ${issue}`);
  console.log("actions       trials   pass rate   avg core");
  for (const band of evaluation.actionBands) {
    console.log(
      `${String(band.actions).padStart(7)} ${String(band.trials).padStart(12)} ${(band.passRate * 100).toFixed(1).padStart(10)}% ${band.averageCore.toFixed(1).padStart(10)}%`
    );
  }
  const unstable = evaluation.mutationTrials.filter((trial) => !trial.stable).length;
  if (unstable > 0) console.log(`UNSTABLE TERMINATIONS: ${unstable}`);
};

const referenceFailureReasons = (levelId: LevelId, reference: PlaytestResult): string[] => {
  const reasons: string[] = [];
  if (!reference.success) reasons.push(`${reference.planName} failed`);
  if (!reference.stable) reasons.push(`${reference.planName} was unstable`);
  if (STRICT_HEALTH_LEVELS.includes(levelId)) {
    if (reference.breached > 0) reasons.push(`${reference.planName} allowed a breach`);
    if (reference.coreIntegrity < 100)
      reasons.push(`${reference.planName} finished below full Core integrity`);
  } else if (reference.coreIntegrity < 40) {
    reasons.push(`${reference.planName} finished dangerously low on Core integrity`);
  }
  return reasons;
};

const evaluationFailure = (evaluation: LevelEvaluation): string | null => {
  const reasons = evaluation.references.flatMap((reference) =>
    referenceFailureReasons(evaluation.levelId, reference)
  );
  if (!evaluation.diversity.satisfied) reasons.push(...evaluation.diversity.issues);
  if (evaluation.doNothing.success) reasons.push("do-nothing policy unexpectedly passed");
  for (const control of evaluation.failureControls) {
    if (control.success) reasons.push(`${control.planName} failure control unexpectedly passed`);
    if (!control.stable) reasons.push(`${control.planName} failure control was unstable`);
  }
  return reasons.length > 0 ? `${evaluation.levelId}: ${reasons.join(", ")}` : null;
};

const campaignFailure = (campaign: ReturnType<typeof runReferenceCampaign>): string | null => {
  const reasons: string[] = [];
  if (!campaign.success) reasons.push(campaign.failure ?? "continuous campaign failed");
  if (!campaign.stable) reasons.push("continuous campaign was unstable");
  if (campaign.rejectedActions > 0)
    reasons.push(`${campaign.rejectedActions} campaign actions were rejected`);
  if (campaign.retryCount > 0)
    reasons.push(`${campaign.retryCount} campaign retries were required`);
  if (campaign.minimumMatter < 0) reasons.push("campaign Matter fell below zero");
  if (campaign.finalCoreIntegrity < 40)
    reasons.push("continuous campaign finished dangerously low on Core integrity");
  if (campaign.completedLevelIds.length !== LEVEL_IDS.length)
    reasons.push(
      `continuous campaign completed ${campaign.completedLevelIds.length}/${LEVEL_IDS.length} sites`
    );
  return reasons.length > 0 ? reasons.join(", ") : null;
};

type CampaignResult = ReturnType<typeof runReferenceCampaign>;

const selectsWholeCampaign = (levelIds: readonly LevelId[]): boolean =>
  levelIds.length === LEVEL_IDS.length &&
  levelIds.every((levelId, index) => levelId === LEVEL_IDS[index]);

const printResults = (
  evaluations: readonly LevelEvaluation[],
  campaign: CampaignResult | null,
  runs: number
): void => {
  console.log(
    `Catalyst Castellum headless playtest · reference portfolios + ${runs} mutations per level`
  );
  for (const evaluation of evaluations) printEvaluation(evaluation);
  if (!campaign) return;
  console.log("\nContinuous campaign");
  console.log(
    `primary references       ${campaign.success ? "PASS" : "FAIL"} · ${campaign.completedLevelIds.length}/${LEVEL_IDS.length} sites · core ${campaign.finalCoreIntegrity.toFixed(0)}% · Matter ${campaign.finalMatter.toFixed(0)} · ${campaign.reusedTowerPlacements} hull mounts reused · ${campaign.rejectedActions} rejected actions`
  );
};

const assertHealthy = (
  evaluations: readonly LevelEvaluation[],
  campaign: CampaignResult | null
): void => {
  const failures = evaluations
    .map(evaluationFailure)
    .filter((failure): failure is string => failure !== null);
  if (campaign) {
    const failure = campaignFailure(campaign);
    if (failure) failures.push(`continuous campaign: ${failure}`);
  }
  if (failures.length > 0) throw new Error(`Campaign health failed: ${failures.join("; ")}`);
};

const main = (): void => {
  const options = parseOptions(process.argv.slice(2));
  const evaluations = options.levelIds.map((levelId, index) =>
    evaluateLevel({ levelId, runs: options.runs, seed: options.seed + index * 10_007 })
  );
  const campaign = selectsWholeCampaign(options.levelIds) ? runReferenceCampaign() : null;
  if (options.json) console.log(JSON.stringify({ evaluations, campaign }, null, 2));
  else printResults(evaluations, campaign, options.runs);
  if (options.assertPortfolio) assertHealthy(evaluations, campaign);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
