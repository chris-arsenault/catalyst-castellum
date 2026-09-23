import { describe, expect, it } from "vitest";
import { createScenarioGame } from "./simulation";
import { resolveEnemyCombat, spawnEnemies } from "./engine/combat";
import { applyDamagePackets } from "./engine/damage";
import { DEFAULT_GAME_DEFINITION } from "./definition";
import { campaignEncounterContext } from "./engine/campaignEncounter";
import { emptyHazardChannels, type HazardBurst } from "./engine/damage";

const assaultWithEnemy = () => {
  const state = createScenarioGame("claim_8_delta");
  state.phase = "assault";
  state.encounter.phaseTime = 1;
  state.encounter.phase = "assault";
  spawnEnemies(state.encounter, campaignEncounterContext(state, DEFAULT_GAME_DEFINITION));
  const enemy = state.encounter.enemies[0];
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
    applyDamagePackets(
      forward.state.encounter,
      forward.enemy,
      [flash, acid],
      DEFAULT_GAME_DEFINITION
    );

    const reverse = assaultWithEnemy();
    reverse.enemy.health = 100;
    reverse.enemy.maxHealth = 100;
    applyDamagePackets(
      reverse.state.encounter,
      reverse.enemy,
      [acid, flash],
      DEFAULT_GAME_DEFINITION
    );

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

    resolveEnemyCombat(
      state.encounter,
      0.1,
      [burst],
      campaignEncounterContext(state, DEFAULT_GAME_DEFINITION)
    );

    expect(enemy.health).toBe(health);
    expect(enemy.damageTaken).toBe(0);
    expect(state.encounter.incidents[0]).toMatchObject({
      sourceId: "hydrogen_oxygen_combustion",
      targets: [],
      reactionExtent: 6,
    });
  });
});
