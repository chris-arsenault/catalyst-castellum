/* global console, process */
import { DEFAULT_GAME_DEFINITION } from "../src/game/definition";
import {
  DAMAGE_FAMILIES,
  PRIMARY_DAMAGE_FAMILIES,
  conduitProfiles,
  deriveBalancedDefinition,
  enemyBehaviorProfiles,
  idealThroughputProfile,
  referenceDamageProfiles,
  routeProfile,
  solveEnemyHealth,
  solveEnemySpeeds,
  solveFirstOrderDamage,
  solveSecondOrderDamage,
  stoichiometryModel,
  verifyLiveBalance,
  type DamageFamily,
  type EnemyBalanceOverride,
  type PrimaryDamageFamily,
  type SecondOrderDamageSolve,
} from "../src/game/balance/combatModel";
import {
  ENEMY_HEALTH_GROWTH_PER_LEVEL,
  REFERENCE_ENEMY_LEVEL,
  enemyHealthScale,
  enemyStatsAtLevel,
  resolveEnemyLevel,
} from "../src/game/engine/enemyLevel";
import { ENEMY_TYPES, LEVEL_IDS, type EnemyType } from "../src/game/types";

const siteLevelProgression = () =>
  LEVEL_IDS.map((levelId) => {
    const level = DEFAULT_GAME_DEFINITION.levels[levelId];
    const waveLevels = level.rounds.flatMap((round) =>
      round.wave.map((entry) => resolveEnemyLevel(level.enemyLevel, entry.levelOffset))
    );
    const deckmouth = enemyStatsAtLevel(
      DEFAULT_GAME_DEFINITION.enemies.deckmouth,
      level.enemyLevel
    );
    return {
      levelId,
      enemyLevel: level.enemyLevel,
      healthScale: enemyHealthScale(level.enemyLevel),
      deckmouthHealth: deckmouth.health,
      deckmouthCoreDamage: deckmouth.coreDamage,
      deckmouthMatterYield: deckmouth.matterYield,
      minimumWaveLevel: Math.min(...waveLevels),
      maximumWaveLevel: Math.max(...waveLevels),
    };
  });

interface CombatBalanceReport {
  assumptions: {
    gasPartialRatioExcess: number;
    liquidStrengthExcess: number;
    temperatureExcessCelsius: number;
    staticPressureRatioExcess: number;
    statement: string;
  };
  routes: ReturnType<typeof routeProfile>[];
  conduits: ReturnType<typeof conduitProfiles>;
  throughput: ReturnType<typeof idealThroughputProfile>;
  stoichiometry: ReturnType<typeof stoichiometryModel>;
  levelProgression: ReturnType<typeof siteLevelProgression>;
  referenceDamage: ReturnType<typeof referenceDamageProfiles>;
  firstOrder: ReturnType<typeof solveFirstOrderDamage>;
  secondOrder: SecondOrderDamageSolve | null;
  finalFamilyScales: Record<DamageFamily, number>;
  health: ReturnType<typeof solveEnemyHealth>;
  speed: ReturnType<typeof solveEnemySpeeds>;
  behaviors: ReturnType<typeof enemyBehaviorProfiles>;
  verification: ReturnType<typeof verifyLiveBalance>;
}

const number = (value: number, digits = 2): string =>
  Number.isFinite(value) ? value.toFixed(digits) : "∞";

const table = (headers: string[], rows: Array<Array<string | number>>): string => {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => String(row[column] ?? "").length))
  );
  const line = (row: Array<string | number>): string =>
    row.map((value, column) => String(value).padEnd(widths[column] ?? 0)).join("  ");
  return [line(headers), line(widths.map((width) => "-".repeat(width))), ...rows.map(line)].join(
    "\n"
  );
};

const combinedScales = (
  first: Record<PrimaryDamageFamily, number>,
  second: SecondOrderDamageSolve | null
): Record<DamageFamily, number> =>
  Object.fromEntries(
    DAMAGE_FAMILIES.map((family) => [
      family,
      (PRIMARY_DAMAGE_FAMILIES.includes(family as PrimaryDamageFamily)
        ? (first[family as PrimaryDamageFamily] ?? 1)
        : 1) * (second?.scales[family] ?? 1),
    ])
  ) as Record<DamageFamily, number>;

const overridesFrom = (
  health: ReturnType<typeof solveEnemyHealth>,
  speed: ReturnType<typeof solveEnemySpeeds>
): Partial<Record<EnemyType, EnemyBalanceOverride>> =>
  Object.fromEntries(
    ENEMY_TYPES.map((enemyType) => [
      enemyType,
      {
        health: health.find((entry) => entry.enemyType === enemyType)?.solvedHealth,
        speed: speed.find((entry) => entry.enemyType === enemyType)?.solvedSpeed,
      },
    ])
  );

const buildReport = (firstOrderOnly: boolean): CombatBalanceReport => {
  const base = DEFAULT_GAME_DEFINITION;
  const routes = ENEMY_TYPES.map((enemyType) =>
    routeProfile("commissioning_exam", enemyType, base)
  );
  const firstOrder = solveFirstOrderDamage(base);
  const firstHealth = solveEnemyHealth(base, firstOrder.scales);
  const speed = solveEnemySpeeds(base);
  const firstCandidate = deriveBalancedDefinition(base, {
    familyScales: firstOrder.scales,
    enemyOverrides: overridesFrom(firstHealth, speed),
  });
  const secondOrder = firstOrderOnly ? null : solveSecondOrderDamage(firstCandidate);
  const finalFamilyScales = combinedScales(firstOrder.scales, secondOrder);
  // Durability is the first-order role solve. The transient pass corrects delivery, not the target.
  const health = firstHealth;
  const candidate = deriveBalancedDefinition(base, {
    familyScales: finalFamilyScales,
    enemyOverrides: overridesFrom(health, speed),
  });
  return {
    assumptions: {
      gasPartialRatioExcess: 0.04,
      liquidStrengthExcess: 8,
      temperatureExcessCelsius: 40,
      staticPressureRatioExcess: 0.3,
      statement:
        "First order holds one reference exposure fixed; second order integrates the exact transient engine and solves its family sensitivity matrix.",
    },
    routes,
    conduits: conduitProfiles("commissioning_exam", base),
    throughput: idealThroughputProfile("commissioning_exam", base),
    stoichiometry: stoichiometryModel(base),
    levelProgression: siteLevelProgression(),
    referenceDamage: referenceDamageProfiles(base),
    firstOrder,
    secondOrder,
    finalFamilyScales,
    health,
    speed,
    behaviors: enemyBehaviorProfiles(base),
    verification: verifyLiveBalance(candidate),
  };
};

const printLevelProgression = (report: CombatBalanceReport): void => {
  console.log("\nENEMY LEVEL CURVE");
  console.log(
    `Reference Lv ${REFERENCE_ENEMY_LEVEL}; health multiplies by ${number(ENEMY_HEALTH_GROWTH_PER_LEVEL, 3)} per level.`
  );
  console.log(
    table(
      ["site", "base lv", "wave lv", "hp scale", "deckmouth hp", "core hit", "matter"],
      report.levelProgression.map((level) => [
        level.levelId,
        level.enemyLevel,
        `${level.minimumWaveLevel}-${level.maximumWaveLevel}`,
        `${number(level.healthScale, 3)}x`,
        number(level.deckmouthHealth, 1),
        level.deckmouthCoreDamage,
        level.deckmouthMatterYield,
      ])
    )
  );
};

const printRoutes = (report: CombatBalanceReport): void => {
  console.log("\nENEMY ROUTE / DWELL SOLVE");
  console.log(
    table(
      ["enemy", "cells", "rooms", "dry s", "1.7 atm s", "60% fill s", "both s"],
      report.routes.map((route) => [
        route.enemyType,
        route.pathCells,
        route.roomsVisited,
        number(route.drySeconds),
        number(route.pressureSeconds),
        route.floodedSeconds === null ? "n/a" : number(route.floodedSeconds),
        route.combinedDragSeconds === null ? "n/a" : number(route.combinedDragSeconds),
      ])
    )
  );
  console.log("\nROOM RESIDENCE (deckmouth, dry)");
  console.log(
    table(
      ["room", "cells", "volume", "seconds"],
      (report.routes.find(({ enemyType }) => enemyType === "deckmouth")?.rooms ?? []).map(
        (room) => [room.roomId, room.cells, number(room.volume), number(room.drySeconds)]
      )
    )
  );
};

const printFeed = (report: CombatBalanceReport): void => {
  const t = report.throughput;
  console.log("\nMATERIAL / PROC SOLVE");
  console.log(
    table(
      ["quantity", "per second / seconds"],
      [
        ["CL-1 extent", number(t.chlorAlkaliExtentPerSecond, 3)],
        ["CL-1 Cl2", number(t.chlorinePerSecond, 3)],
        ["CL-1 H2", number(t.hydrogenPerSecond, 3)],
        ["CL-1 NaOH", number(t.sodiumHydroxidePerSecond, 3)],
        ["CL-2 HCl", number(t.hydrogenChloridePerSecond, 3)],
        ["P-1 HCl(aq)", number(t.hydrochloricAcidPerSecond, 3)],
        ["CL-4 NaOCl", number(t.hypochloritePerSecond, 3)],
        ["CL-5 Cl2", number(t.releasedChlorinePerSecond, 3)],
        ["OX-1 extent/s", number(t.ox1ExtentPerSecond, 3)],
        ["OX-1 ideal interval", number(t.ox1ExpectedIntervalSeconds, 2)],
      ]
    )
  );
  console.log("\nCONDUIT HOLD-UP");
  console.log(
    table(
      ["connection", "phase", "length", "capacity", "max flow", "ideal prime s"],
      report.conduits.map((line) => [
        line.connectionId,
        line.phase,
        number(line.routeLength, 1),
        number(line.capacity, 2),
        number(line.maximumFlow, 3),
        number(line.idealPrimeSeconds, 2),
      ])
    )
  );
};

const printDamage = (report: CombatBalanceReport): void => {
  console.log("\nREFERENCE DAMAGE MATRIX");
  console.log(
    table(
      ["family", ...ENEMY_TYPES],
      DAMAGE_FAMILIES.map((family) => [
        family,
        ...ENEMY_TYPES.map((enemyType) =>
          number(
            report.referenceDamage.find(
              (entry) => entry.family === family && entry.enemyType === enemyType
            )?.damage ?? 0,
            1
          )
        ),
      ])
    )
  );
  console.log("\nDAMAGE COEFFICIENT SOLVE");
  console.log(
    table(
      ["family", "first-order scale", "second-order correction", "final scale"],
      DAMAGE_FAMILIES.map((family) => [
        family,
        PRIMARY_DAMAGE_FAMILIES.includes(family as PrimaryDamageFamily)
          ? number(report.firstOrder.scales[family as PrimaryDamageFamily], 3)
          : "1.000",
        report.secondOrder ? number(report.secondOrder.scales[family], 3) : "skipped",
        number(report.finalFamilyScales[family], 3),
      ])
    )
  );
  if (report.secondOrder) {
    console.log("\nTRANSIENT CAMPAIGN SENSITIVITY MATRIX");
    console.log(
      table(
        ["level", "round", ...DAMAGE_FAMILIES, "effective hp", "target"],
        report.secondOrder.rows.map((row) => [
          row.levelId,
          row.round,
          ...DAMAGE_FAMILIES.map((family) => number(row.familyDamage[family], 0)),
          number(row.effectiveHealth, 0),
          number(row.targetDamage, 0),
        ])
      )
    );
  }
};

const printEnemies = (report: CombatBalanceReport): void => {
  console.log("\nENEMY DURABILITY / SPEED SOLVE");
  console.log(
    table(
      ["enemy", "current hp", "solved hp", "current speed", "solved speed", "target route s"],
      ENEMY_TYPES.map((enemyType) => {
        const health = report.health.find((entry) => entry.enemyType === enemyType)!;
        const speed = report.speed.find((entry) => entry.enemyType === enemyType)!;
        return [
          enemyType,
          DEFAULT_GAME_DEFINITION.enemies[enemyType].health,
          health.solvedHealth,
          number(speed.currentSpeed, 3),
          number(speed.solvedSpeed, 3),
          number(speed.targetRouteSeconds, 1),
        ];
      })
    )
  );
  console.log("\nENEMY BEHAVIOR BUDGETS");
  console.log(
    table(
      ["enemy", "behavior", "mathematical budget"],
      report.behaviors.map((behavior) => {
        switch (behavior.kind) {
          case "standard":
            return [behavior.enemyType, behavior.kind, "direct stats"];
          case "ladder_runner":
            return [
              behavior.enemyType,
              behavior.kind,
              `walk ${number(behavior.walkingRate, 2)}x; climb ${number(behavior.climbingRate, 2)}x`,
            ];
          case "armored_molt":
            return [
              behavior.enemyType,
              behavior.kind,
              `${number(behavior.shellHealth, 0)} shell + ${number(behavior.exposedHealth, 0)} exposed; speed ${number(behavior.exposedSpeed, 3)}`,
            ];
          case "shared_field":
            return [
              behavior.enemyType,
              behavior.kind,
              `${number(behavior.capacity, 0)} charge; ${number(behavior.rechargePerSecond, 1)}/s; full ${number(behavior.fullRechargeSeconds, 1)}s`,
            ];
          case "gas_emitter":
            return [
              behavior.enemyType,
              behavior.kind,
              `${number(behavior.reservoir, 1)} ${behavior.species}; ${number(behavior.dischargeSeconds, 1)}s; ${number(behavior.ignitionChargeCount, 2)} ignition charge`,
            ];
        }
      })
    )
  );
};

const printVerification = (report: CombatBalanceReport): void => {
  console.log("\nEXACT LIVE VERIFICATION");
  console.log(
    table(
      ["level", "result", "core", "killed", "breached", "damage"],
      report.verification.map((entry) => [
        entry.levelId,
        entry.success ? "pass" : "fail",
        entry.coreIntegrity,
        entry.killed,
        entry.breached,
        number(entry.damage, 0),
      ])
    )
  );
};

const printStoichiometry = (report: CombatBalanceReport): void => {
  console.log("\nSTOICHIOMETRIC MATRIX S (species rows, reaction columns)");
  console.log(
    table(
      [
        "species",
        ...report.stoichiometry.reactions.map((reaction) => reaction.replaceAll("_", " ")),
      ],
      report.stoichiometry.species.map((species, row) => [
        species,
        ...(report.stoichiometry.matrix[row] ?? []).map((coefficient) => number(coefficient, 0)),
      ])
    )
  );
};

const printReport = (report: CombatBalanceReport): void => {
  console.log("Catalyst Castellum combat balance solver");
  console.log(report.assumptions.statement);
  printLevelProgression(report);
  printRoutes(report);
  printFeed(report);
  printStoichiometry(report);
  printDamage(report);
  printEnemies(report);
  printVerification(report);
};

const main = (): void => {
  const args = process.argv.slice(2);
  const report = buildReport(args.includes("--first-order"));
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
