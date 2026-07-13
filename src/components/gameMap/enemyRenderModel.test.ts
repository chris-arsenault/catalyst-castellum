import { describe, expect, it } from "vitest";
import { emptyDamageLedger } from "../../game/engine/damage";
import { moveEnemies } from "../../game/engine/combat";
import { findEnemyPath } from "../../game/engine/navigation";
import { createScenarioGame } from "../../game/simulation";
import type { EnemyState } from "../../game/types";
import { enemyRenderModel } from "./enemyRenderModel";

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
});
