/* global console */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { LEVEL_IDS } from "../src/game/types";
import { intendedPlan } from "../src/game/playtest/policies";
import { runPlan } from "../src/game/playtest/runner";

const target = join("src", "game", "playtest", "__fixtures__", "intended-run-snapshot.json");
const snapshot = Object.fromEntries(
  LEVEL_IDS.map((levelId) => {
    const result = runPlan(levelId, intendedPlan(levelId));
    return [levelId, { terminalPhase: result.terminalPhase, reports: result.reports }];
  })
);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${target}`);
