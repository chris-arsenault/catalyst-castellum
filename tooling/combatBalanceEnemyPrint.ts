/* global console */
import { DEFAULT_GAME_DEFINITION } from "../src/game/definition";
import { ENEMY_TYPES } from "../src/game/types";
import type { CombatBalanceReport } from "./combatBalance";
import { number, table } from "./tableFormat";

export const printEnemies = (report: CombatBalanceReport): void => {
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
  console.log("\nENEMY SUSCEPTIBILITY / DEFENSE MATRIX");
  console.log(
    table(
      ["enemy", "atmosphere", "corrosion", "heat", "pressure", "radiation"],
      ENEMY_TYPES.map((enemyType) => {
        const multipliers = DEFAULT_GAME_DEFINITION.enemies[enemyType].hazardMultipliers;
        return [
          enemyType,
          number(multipliers.atmosphere, 2),
          number(multipliers.corrosion, 2),
          number(multipliers.heat, 2),
          number(multipliers.pressure, 2),
          number(multipliers.radiation, 2),
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

export const printVerification = (report: CombatBalanceReport): void => {
  console.log("\nEXACT LIVE VERIFICATION");
  console.log(
    table(
      [
        "level",
        "build",
        "result",
        "core",
        "killed",
        "breached",
        "damage",
        "matter",
        "dmg/matter",
        "dominant",
        "share",
      ],
      report.verification.map((entry) => [
        entry.levelId,
        entry.planName,
        entry.success ? "pass" : "fail",
        entry.coreIntegrity,
        entry.killed,
        entry.breached,
        number(entry.damage, 0),
        number(entry.matterSpent, 0),
        number(entry.damagePerMatter, 1),
        entry.dominantFamily ?? "none",
        `${number(entry.dominantShare * 100, 0)}%`,
      ])
    )
  );
};
