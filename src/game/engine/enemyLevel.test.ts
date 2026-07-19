import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../definition";
import { createScenarioGame, spawnEnemies } from "../simulation";
import {
  ENEMY_HEALTH_GROWTH_PER_LEVEL,
  REFERENCE_ENEMY_LEVEL,
  enemyHealthScale,
  enemyStatsAtLevel,
} from "./enemyLevel";

describe("enemy level curve", () => {
  it("anchors authored archetype stats at level 20 and compounds health geometrically", () => {
    const deckmouth = DEFAULT_GAME_DEFINITION.enemies.deckmouth;

    expect(enemyHealthScale(REFERENCE_ENEMY_LEVEL)).toBe(1);
    expect(enemyStatsAtLevel(deckmouth, REFERENCE_ENEMY_LEVEL).health).toBe(deckmouth.health);
    expect(enemyHealthScale(21) / enemyHealthScale(20)).toBeCloseTo(
      ENEMY_HEALTH_GROWTH_PER_LEVEL,
      10
    );
    expect(enemyHealthScale(30)).toBeCloseTo(2.5937424601, 10);
  });

  it("raises breach stakes and rewards more slowly than health", () => {
    const splitback = DEFAULT_GAME_DEFINITION.enemies.splitback;
    const reference = enemyStatsAtLevel(splitback, 20);
    const veteran = enemyStatsAtLevel(splitback, 30);
    const healthRatio = veteran.health / reference.health;

    expect(veteran.coreDamage).toBeGreaterThan(reference.coreDamage);
    expect(veteran.matterYield).toBeGreaterThan(reference.matterYield);
    expect(veteran.residueOnDeath).toBeGreaterThan(reference.residueOnDeath);
    expect(veteran.coreDamage / reference.coreDamage).toBeLessThan(healthRatio);
    expect(veteran.matterYield / reference.matterYield).toBeLessThan(healthRatio);
    expect(veteran.residueOnDeath / reference.residueOnDeath).toBeLessThan(healthRatio);
  });

  it("resolves each spawn from the site level and wave offset", () => {
    const game = createScenarioGame("make_the_reagent");
    game.phase = "assault";
    game.phaseTime = 10.5;

    spawnEnemies(game);

    const spawned = game.enemies[0];
    expect(spawned?.level).toBe(3);
    expect(spawned?.maxHealth).toBeCloseTo(
      enemyStatsAtLevel(DEFAULT_GAME_DEFINITION.enemies.deckmouth, 3).health,
      10
    );
  });

  it("authors a rising site baseline independently of wave size", () => {
    const levels = DEFAULT_GAME_DEFINITION.levelOrder.map(
      (levelId) => DEFAULT_GAME_DEFINITION.levels[levelId].enemyLevel
    );

    expect(levels).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
  });
});
