import { describe, expect, it } from "vitest";
import { emptyDamageLedger } from "../../game/engine/damage";
import { createScenarioGame, findEnemyPath, moveEnemies } from "../../game/simulation";
import type { EnemyState } from "../../game/types";
import { enemyRenderModel } from "./enemyRenderModel";
import { createEnemyRenderModel } from "./enemyRenderModel";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../../game/definition";
import type { EnemyType } from "../../game/types";

describe("enemy render projection", () => {
  it("projects actual engine movement along the cell path, including ladder motion", () => {
    const game = createScenarioGame("flash_point");
    const path = findEnemyPath({ flying: false, portalStates: game.portalStates });
    const climbIndex = path.findIndex((step) => step.mode === "climbing");
    const enemy: EnemyState = {
      id: 71,
      type: "crawler",
      health: 74,
      maxHealth: 74,
      routeId: "entry_to_core",
      path,
      pathIndex: climbIndex - 1,
      progress: 0,
      mode: path[climbIndex - 1]?.mode ?? "walking",
      facing: 1,
      spawnAge: 0,
      damageTaken: 0,
      damageBySource: emptyDamageLedger(),
      lastDamage: null,
    };
    game.enemies = [enemy];
    const before = enemyRenderModel(enemy);

    moveEnemies(game, 0.05);

    const after = enemyRenderModel(enemy);
    expect(after.mode).toBe("climbing");
    expect(after.position.y).toBeLessThan(before.position.y);
    expect(after.position.x).toBeCloseTo(before.position.x, 8);
  });

  it("projects a new enemy through a reusable authored appearance", () => {
    const fixtureType = "fixture_enemy" as EnemyType;
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "enemy-extension-fixture",
      enemies: {
        ...DEFAULT_GAME_DEFINITION.enemies,
        [fixtureType]: {
          ...DEFAULT_GAME_DEFINITION.enemies.shell,
          type: fixtureType,
          color: "#123456",
          presentation: { appearance: "shell", manualIcon: "shield" },
        },
      },
    });
    const game = createScenarioGame("flash_point");
    const path = findEnemyPath({ flying: false, portalStates: game.portalStates });
    const enemy: EnemyState = {
      id: 72,
      type: fixtureType,
      health: 10,
      maxHealth: 20,
      routeId: "entry_to_core",
      path,
      pathIndex: 0,
      progress: 0,
      mode: "walking",
      facing: 1,
      spawnAge: 0,
      damageTaken: 0,
      damageBySource: emptyDamageLedger(),
      lastDamage: null,
    };

    const model = createEnemyRenderModel(definition)(enemy);
    expect(model.appearance).toBe("shell");
    expect(model.color).toBe(0x123456);
  });
});
