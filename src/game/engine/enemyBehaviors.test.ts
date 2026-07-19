import { describe, expect, it } from "vitest";
import { roomAtWorldPoint } from "../content/facilityGeometry";
import { DEFAULT_GAME_DEFINITION } from "../definition";
import { createScenarioGame, findEnemyPath, resolveEnemyCombat } from "../simulation";
import type { EnemyState, EnemyType, GameState } from "../types";
import { roomState } from "../world/instances";
import { emptyDamageLedger, emptyHazardChannels, type HazardBurst } from "./damage";
import { initialEnemyBehaviorState, simulateEnemyBehaviors } from "./enemyBehaviors";
import { enemyGasZone } from "./enemyPosition";
import { enemyBehaviorSpeedMultiplier } from "./enemyMovementRules";

const positionedEnemy = (type: EnemyType, id: number, health?: number): EnemyState => {
  const definition = DEFAULT_GAME_DEFINITION.enemies[type];
  const path = findEnemyPath({
    flying: definition.flying,
    portalStates: createScenarioGame("flash_point").portalStates,
  });
  const pathIndex = path.findIndex(
    (step) =>
      roomAtWorldPoint({ x: step.cell.column + 0.5, elevation: step.cell.elevation + 0.5 }) ===
      "furnace"
  );
  const maximumHealth = health ?? definition.health;
  return {
    id,
    type,
    level: 20,
    health: maximumHealth,
    maxHealth: maximumHealth,
    routeId: "entry_to_core",
    path,
    pathIndex,
    progress: 0,
    mode: path[pathIndex]?.mode ?? (definition.flying ? "flying" : "walking"),
    facing: 1,
    spawnAge: 0,
    damageTaken: 0,
    damageBySource: emptyDamageLedger(),
    lastDamage: null,
    behavior: initialEnemyBehaviorState(definition, 20),
  };
};

const stateFor = (enemies: EnemyState[]): GameState => {
  const state = createScenarioGame("flash_point");
  state.phase = "assault";
  state.enemies = enemies;
  return state;
};

const burst = (pressure: number): HazardBurst => ({
  roomId: "furnace",
  zone: "lower",
  sourceId: "hydrogen_oxygen_combustion",
  reactionExtent: 3,
  pressureImpulse: 132,
  heatDelta: 33,
  channels: { ...emptyHazardChannels(), pressure },
});

describe("enemy behavior mechanics", () => {
  it("spends one shared field proportionally across same-room allies and leaves the Anchor exposed", () => {
    const anchor = positionedEnemy("anchor", 50, 300);
    const first = positionedEnemy("deckmouth", 51, 200);
    const second = positionedEnemy("deckmouth", 52, 200);
    const state = stateFor([anchor, first, second]);

    resolveEnemyCombat(state, 0.1, [burst(100)]);

    expect(anchor.damageTaken).toBeCloseTo(100, 8);
    expect(first.damageTaken).toBeCloseTo(15, 8);
    expect(second.damageTaken).toBeCloseTo(15, 8);
    expect(state.stats.fieldDamageAbsorbed).toBeCloseTo(170, 8);
    expect(state.stats.fieldDamageAbsorbedBySource.hydrogen_oxygen_combustion).toBeCloseTo(170, 8);
    expect(anchor.behavior).toMatchObject({ kind: "shared_field", charge: 0, active: false });
  });

  it("crosses the authored carapace threshold once and accelerates the exposed form", () => {
    const splitback = positionedEnemy("splitback", 60);
    const state = stateFor([splitback]);

    resolveEnemyCombat(state, 0.1, [burst(100)]);

    expect(splitback.health).toBeCloseTo(60, 8);
    expect(splitback.behavior).toMatchObject({ kind: "armored_molt", phase: "exposed" });
    expect(state.stats.armorTransitions).toBe(1);
    expect(state.events.filter((event) => event.code === "enemy_molted")).toHaveLength(1);
    splitback.mode = "walking";
    expect(
      enemyBehaviorSpeedMultiplier(splitback, DEFAULT_GAME_DEFINITION.enemies.splitback)
    ).toBeCloseTo(2.2, 8);
  });

  it("emits finite hydrogen into the occupied gas layer and debits its reservoir", () => {
    const glowbag = positionedEnemy("glowbag", 70);
    const state = stateFor([glowbag]);
    const zone = enemyGasZone(glowbag, state.map);
    const before = roomState(state, "furnace").gas[zone].hydrogen;

    simulateEnemyBehaviors(state, 1, DEFAULT_GAME_DEFINITION);

    expect(roomState(state, "furnace").gas[zone].hydrogen - before).toBeCloseTo(0.6, 8);
    expect(glowbag.behavior).toMatchObject({ kind: "gas_emitter", reservoir: 5.4 });
    expect(state.stats.reagentEmitted).toBeCloseTo(0.6, 8);
  });

  it("recharges a collapsed field to its authored activation threshold", () => {
    const anchor = positionedEnemy("anchor", 75);
    if (anchor.behavior.kind !== "shared_field") throw new Error("Expected Anchor field state.");
    anchor.behavior.charge = 0;
    anchor.behavior.active = false;
    const state = stateFor([anchor]);

    simulateEnemyBehaviors(state, 1, DEFAULT_GAME_DEFINITION);
    expect(anchor.behavior.charge).toBeCloseTo(15.3, 8);
    expect(anchor.behavior.active).toBe(false);

    simulateEnemyBehaviors(state, 2, DEFAULT_GAME_DEFINITION);
    expect(anchor.behavior.charge).toBeCloseTo(45.9, 8);
    expect(anchor.behavior.active).toBe(true);
  });

  it("applies the ladder runner's fast climb and deliberate walking multipliers", () => {
    const clatter = positionedEnemy("clatter", 80);
    const definition = DEFAULT_GAME_DEFINITION.enemies.clatter;
    clatter.mode = "walking";
    expect(enemyBehaviorSpeedMultiplier(clatter, definition)).toBeCloseTo(0.82, 8);
    clatter.mode = "climbing";
    expect(enemyBehaviorSpeedMultiplier(clatter, definition)).toBe(2);
  });
});
