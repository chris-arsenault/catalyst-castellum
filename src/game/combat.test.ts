import { describe, expect, it } from "vitest";
import {
  applyDamagePackets,
  createScenarioGame,
  resolveEnemyCombat,
  spawnEnemies,
} from "./simulation";
import { emptyHazardChannels, type HazardBurst } from "./engine/damage";

const assaultWithEnemy = () => {
  const state = createScenarioGame("claim_8_delta");
  state.phase = "assault";
  state.phaseTime = 1;
  spawnEnemies(state);
  const enemy = state.enemies[0];
  if (!enemy) throw new Error("Claim wave produced no enemy.");
  return { state, enemy };
};

describe("central damage resolution", () => {
  it("proportionally caps a lethal frame without packet-order attribution bias", () => {
    const forward = assaultWithEnemy();
    forward.enemy.health = 100;
    forward.enemy.maxHealth = 100;
    const flash = {
      key: "flash",
      sourceId: "tower_flash" as const,
      channels: { ...emptyHazardChannels(), corrosion: 80 },
    };
    const acid = {
      key: "acid",
      sourceId: "tower_acid" as const,
      channels: { ...emptyHazardChannels(), pressure: 80 },
    };
    applyDamagePackets(forward.state, forward.enemy, [flash, acid]);

    const reverse = assaultWithEnemy();
    reverse.enemy.health = 100;
    reverse.enemy.maxHealth = 100;
    applyDamagePackets(reverse.state, reverse.enemy, [acid, flash]);

    expect(forward.enemy.damageTaken).toBeCloseTo(100, 8);
    expect(forward.enemy.damageBySource.tower_flash.corrosion).toBeCloseTo(50, 8);
    expect(reverse.enemy.damageBySource).toEqual(forward.enemy.damageBySource);
    expect(reverse.enemy.lastDamage?.sourceId).toBe(forward.enemy.lastDamage?.sourceId);
  });
});

describe("process telemetry outside the weapon model", () => {
  it("records a reaction burst without damaging hostiles in the room", () => {
    const { state, enemy } = assaultWithEnemy();
    const burst: HazardBurst = {
      sourceId: "hydrogen_oxygen_combustion",
      roomId: "switchyard",
      zone: null,
      reactionExtent: 6,
      pressureImpulse: 120,
      heatDelta: 20,
    };
    const health = enemy.health;

    resolveEnemyCombat(state, 0.1, [burst]);

    expect(enemy.health).toBe(health);
    expect(enemy.damageTaken).toBe(0);
    expect(state.incidents[0]).toMatchObject({
      sourceId: "hydrogen_oxygen_combustion",
      targets: [],
      reactionExtent: 6,
    });
  });
});
