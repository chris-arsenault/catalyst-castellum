/* global console, process */
import { DEFAULT_GAME_DEFINITION } from "../src/game/definition";
import { enemyStatsAtLevel, resolveEnemyLevel } from "../src/game/engine/enemyLevel";
import { effectiveTowerStats } from "../src/game/engine/towerStats";
import {
  LEVEL_IDS,
  type LevelId,
  type TowerInstance,
  type TowerRoundReport,
  type WaveEntry,
} from "../src/game/types";
import type { RoundDefinition } from "../src/game/definitionTypes";
import { referenceBuildsFor } from "../src/game/content/playtestPortfolios";
import { runPlan } from "../src/game/playtest/runner";
import type { PlaytestResult } from "../src/game/playtest/types";
import { number, table } from "./tableFormat";

const definition = DEFAULT_GAME_DEFINITION;

const damagePerShot = (chassisId: TowerInstance["chassisId"]): number =>
  definition.towers[chassisId].attack.packets.reduce(
    (total, packet) =>
      total + Object.values(packet.channels).reduce((sum, value) => sum + value, 0),
    0
  );

const probe = (
  chassisId: TowerInstance["chassisId"],
  upgrades: TowerInstance["upgrades"] = []
): TowerInstance => ({
  id: `balance:${chassisId}`,
  chassisId,
  placement: {
    anchor: { column: 0, elevation: 0 },
    mountFace: "floor",
    orientation: "right",
    occupiedCells: [{ column: 0, elevation: 0 }],
    supportCells: [{ column: 0, elevation: -1 }],
    firingOrigin: { x: 0.5, elevation: 0.95 },
  },
  provenance: "site",
  upgrades: [...upgrades],
  targetPolicy: definition.towers[chassisId].targetPolicies[0] ?? "first",
  cooldown: 0,
  localResources: { gas: {}, liquid: {} },
  currentTargetIds: [],
  damageDealt: 0,
  kills: 0,
  shots: 0,
  totalMatterSpent: 0,
  downtimeReason: "no_target",
  telemetry: {
    engagedSeconds: 0,
    targetsServiced: 0,
    overkillDamage: 0,
    controlApplications: 0,
    downtime: { noTarget: 0, cooldown: 0, supply: 0 },
  },
});

const towerProfiles = () =>
  Object.values(definition.towers).map((tower) => {
    const stats = effectiveTowerStats(probe(tower.id), definition);
    const shotDamage = damagePerShot(tower.id) * stats.damageMultiplier;
    return {
      chassisId: tower.id,
      role: tower.role,
      cost: tower.buildCost,
      damage: shotDamage,
      cadence: stats.cadence,
      dps: shotDamage * stats.cadence,
      service: stats.cadence * stats.targetCap,
      range: stats.range,
      targetCap: stats.targetCap,
      matterEfficiency: (shotDamage * stats.cadence) / tower.buildCost,
    };
  });

const upgradeProfiles = () =>
  Object.values(definition.towers).flatMap((tower) =>
    tower.upgrades.map((upgrade) => {
      const before = effectiveTowerStats(probe(tower.id, [...upgrade.requires]), definition);
      const after = effectiveTowerStats(
        probe(tower.id, [...upgrade.requires, upgrade.id]),
        definition
      );
      return {
        chassisId: tower.id,
        upgradeId: upgrade.id,
        cost: upgrade.cost,
        damageBefore: damagePerShot(tower.id) * before.damageMultiplier,
        damageAfter: damagePerShot(tower.id) * after.damageMultiplier,
        cadenceBefore: before.cadence,
        cadenceAfter: after.cadence,
        rangeBefore: before.range,
        rangeAfter: after.range,
        capBefore: before.targetCap,
        capAfter: after.targetCap,
        arcBefore: before.firingArc,
        arcAfter: after.firingArc,
      };
    })
  );

const entriesByRoute = (wave: readonly WaveEntry[]): Record<string, WaveEntry[]> => {
  const routes: Record<string, WaveEntry[]> = {};
  for (const entry of wave) {
    const entries = routes[entry.routeId] ?? [];
    if (!routes[entry.routeId]) routes[entry.routeId] = entries;
    entries.push(entry);
  }
  return routes;
};

const routeHealth = (levelId: LevelId, entries: readonly WaveEntry[]): number =>
  entries.reduce((total, entry) => {
    const level = definition.levels[levelId];
    const enemy = definition.enemies[entry.type];
    return (
      total +
      enemyStatsAtLevel(enemy, resolveEnemyLevel(level.enemyLevel, entry.levelOffset)).health
    );
  }, 0);

const roundRouteDemand = (levelId: LevelId, round: RoundDefinition, roundIndex: number) =>
  Object.entries(entriesByRoute(round.wave)).map(([routeId, entries]) => {
    const health = routeHealth(levelId, entries);
    const arrivals = entries.map((entry) => entry.at);
    const arrivalSpan = Math.max(1, Math.max(...arrivals) - Math.min(...arrivals));
    return {
      levelId,
      round: roundIndex + 1,
      routeId,
      enemies: entries.length,
      health,
      arrivalSpan,
      demandPerSecond: health / arrivalSpan,
    };
  });

const routeDemandForLevel = (levelId: LevelId) =>
  definition.levels[levelId].rounds.flatMap((round, index) =>
    roundRouteDemand(levelId, round, index)
  );

const routeDemand = (levelIds: readonly LevelId[]) => levelIds.flatMap(routeDemandForLevel);

const exactResults = (levelIds: readonly LevelId[]): PlaytestResult[] =>
  levelIds.flatMap((levelId) => referenceBuildsFor(levelId).map((plan) => runPlan(levelId, plan)));

const emptyTowerReport = (report: TowerRoundReport): TowerRoundReport => ({
  chassisId: report.chassisId,
  damageDealt: 0,
  kills: 0,
  shots: 0,
  overkillDamage: 0,
  engagedSeconds: 0,
  targetsServiced: 0,
  controlApplications: 0,
  matterInvested: 0,
  downtime: { noTarget: 0, cooldown: 0, supply: 0 },
});

const towerWaveRows = (result: PlaytestResult) => {
  const previous = new Map<string, TowerRoundReport>();
  return result.reports.flatMap((report) =>
    Object.entries(report.towers).map(([towerId, current]) => {
      const before = previous.get(towerId) ?? emptyTowerReport(current);
      previous.set(towerId, current);
      const engaged = current.engagedSeconds - before.engagedSeconds;
      const noTarget = current.downtime.noTarget - before.downtime.noTarget;
      return {
        levelId: result.levelId,
        planName: result.planName,
        round: report.round,
        towerId,
        chassisId: current.chassisId,
        damage: current.damageDealt - before.damageDealt,
        kills: current.kills - before.kills,
        shots: current.shots - before.shots,
        targets: current.targetsServiced - before.targetsServiced,
        engaged,
        coverage: engaged + noTarget > 0 ? engaged / (engaged + noTarget) : 0,
        overkill: current.overkillDamage - before.overkillDamage,
        controls: current.controlApplications - before.controlApplications,
        matter: current.matterInvested,
      };
    })
  );
};

const parseLevelIds = (args: readonly string[]): LevelId[] => {
  const index = args.indexOf("--level");
  if (index < 0) return [...LEVEL_IDS];
  const levelId = args[index + 1];
  if (!levelId || !LEVEL_IDS.includes(levelId as never))
    throw new Error(`Unknown level: ${levelId}`);
  return [levelId as LevelId];
};

const buildReport = (levelIds: readonly LevelId[]) => {
  const results = exactResults(levelIds);
  return {
    statement:
      "Static tower service estimates describe authored capacity; exact fixed-step reference replays remain the balance authority.",
    towers: towerProfiles(),
    upgrades: upgradeProfiles(),
    routes: routeDemand(levelIds),
    results,
    towerWaves: results.flatMap(towerWaveRows),
  };
};

type BalanceReport = ReturnType<typeof buildReport>;

const printTowerRoles = (report: BalanceReport): void => {
  console.log("Catalyst Castellum tower-defense balance report");
  console.log(report.statement);
  console.log("\nTOWER ROLES");
  console.log(
    table(
      [
        "tower",
        "role",
        "cost",
        "damage",
        "cadence",
        "DPS",
        "targets/s",
        "range",
        "cap",
        "DPS/Matter",
      ],
      report.towers.map((tower) => [
        tower.chassisId,
        tower.role,
        tower.cost,
        number(tower.damage, 1),
        number(tower.cadence, 2),
        number(tower.dps, 1),
        number(tower.service, 2),
        number(tower.range, 1),
        tower.targetCap,
        number(tower.matterEfficiency, 2),
      ])
    )
  );
};

const printUpgradeDeltas = (report: BalanceReport): void => {
  console.log("\nUPGRADE DELTAS");
  console.log(
    table(
      ["tower", "upgrade", "cost", "damage", "cadence", "range", "cap", "arc"],
      report.upgrades.map((upgrade) => [
        upgrade.chassisId,
        upgrade.upgradeId,
        upgrade.cost,
        `${number(upgrade.damageBefore, 1)}→${number(upgrade.damageAfter, 1)}`,
        `${number(upgrade.cadenceBefore, 2)}→${number(upgrade.cadenceAfter, 2)}`,
        `${number(upgrade.rangeBefore, 1)}→${number(upgrade.rangeAfter, 1)}`,
        `${upgrade.capBefore}→${upgrade.capAfter}`,
        `${number(upgrade.arcBefore, 0)}→${number(upgrade.arcAfter, 0)}`,
      ])
    )
  );
};

const printRouteDemand = (report: BalanceReport): void => {
  console.log("\nROUTE DEMAND");
  console.log(
    table(
      ["site", "wave", "route", "enemies", "health", "arrival s", "HP/s"],
      report.routes.map((route) => [
        route.levelId,
        route.round,
        route.routeId,
        route.enemies,
        number(route.health, 0),
        number(route.arrivalSpan, 1),
        number(route.demandPerSecond, 1),
      ])
    )
  );
};

const printReferenceOutcomes = (report: BalanceReport): void => {
  console.log("\nEXACT REFERENCE OUTCOMES");
  console.log(
    table(
      ["site", "build", "result", "core", "leaks", "damage", "Matter", "towers"],
      report.results.map((result) => [
        result.levelId,
        result.planName,
        result.success ? "PASS" : "FAIL",
        number(result.coreIntegrity, 0),
        result.breached,
        number(
          Object.values(result.damageBySource).reduce((sum, value) => sum + value, 0),
          0
        ),
        number(result.matterSpent, 0),
        result.buildProfile.towers.length,
      ])
    )
  );
};

const printTowerWaveTelemetry = (report: BalanceReport): void => {
  console.log("\nTOWER / WAVE TELEMETRY");
  console.log(
    table(
      [
        "site",
        "build",
        "wave",
        "tower",
        "damage",
        "kills",
        "shots",
        "targets",
        "coverage",
        "overkill",
        "control",
        "Matter",
      ],
      report.towerWaves.map((row) => [
        row.levelId,
        row.planName,
        row.round,
        `${row.chassisId}:${row.towerId.split(":").at(-1)}`,
        number(row.damage, 0),
        row.kills,
        row.shots,
        row.targets,
        `${number(row.coverage * 100, 0)}%`,
        number(row.overkill, 0),
        row.controls,
        number(row.matter, 0),
      ])
    )
  );
};

const printRouteLeaks = (report: BalanceReport): void => {
  console.log("\nROUTE LEAKS BY WAVE");
  console.log(
    table(
      ["site", "build", "wave", "route", "leaks", "core damage"],
      report.results.flatMap((result) =>
        result.reports.flatMap((wave) =>
          Object.entries(wave.breachesByRoute).map(([routeId, leaks]) => [
            result.levelId,
            result.planName,
            wave.round,
            routeId,
            leaks,
            wave.coreDamage,
          ])
        )
      )
    )
  );
};

const printReport = (report: BalanceReport): void => {
  printTowerRoles(report);
  printUpgradeDeltas(report);
  printRouteDemand(report);
  printReferenceOutcomes(report);
  printTowerWaveTelemetry(report);
  printRouteLeaks(report);
};

try {
  const args = process.argv.slice(2);
  const report = buildReport(parseLevelIds(args));
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
