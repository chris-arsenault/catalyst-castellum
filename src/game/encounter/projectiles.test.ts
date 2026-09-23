import { describe, expect, it } from "vitest";
import { corridorEncounter } from "./__fixtures__/corridor";
import { createEncounter } from "./create";
import { createEncounterRuntime } from "./runtime";
import { moveEnemies, spawnEnemies } from "../engine/combat";
import { firePhysicalTower } from "../engine/towerLaunch";
import { resolveProjectileImpact, resolvePhysicalHits } from "../engine/towerImpact";
import { advanceProjectiles, hasCombatLineOfSight } from "./projectiles";
import type { EnemyState } from "../types";
import { physicalCombat } from "./__fixtures__/physical";
import type { CatalystFieldSample } from "./catalystTypes";

const fixture = (strategy: "projectile" | "lob" = "projectile", armor = 1) => {
  const combat = physicalCombat(strategy, armor);
  const context = { combat, definition: corridorEncounter, process: null };
  const runtime = createEncounterRuntime(context);
  const state = runtime.execute(createEncounter(combat, corridorEncounter), {
    tick: 0,
    sequence: 0,
    command: {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 1, elevation: 1 },
      mountFace: "left_wall",
      orientation: "right",
    },
  }).state;
  spawnEnemies(state, context);
  const tower = Object.values(state.towers)[0]!;
  tower.placement.firingOrigin = { x: 2, elevation: 2.5 };
  const enemy = state.enemies[0]!;
  const position = (target: EnemyState, x: number, y = 2) => {
    target.path = [{ ...target.path[0]!, cell: { column: x, elevation: y } }];
    target.pathIndex = 0;
    target.progress = 0;
  };
  position(enemy, 8);
  const launch = (fieldSample?: CatalystFieldSample) =>
    firePhysicalTower(
      state,
      tower,
      [enemy],
      [enemy],
      [
        {
          key: "frozen",
          sourceId: "tower_flash",
          channels: { atmosphere: 0, corrosion: 0, heat: 5, pressure: 0, radiation: 0 },
        },
      ],
      context,
      fieldSample
    );
  const advance = (dt = 1) =>
    advanceProjectiles(state, dt, context, (impact) =>
      resolveProjectileImpact(state, impact, context)
    );
  return { state, context, runtime, tower, enemy, position, launch, advance };
};

describe("physical attack delivery", () => {
  it("launches without damage, intercepts the first enemy on a swept segment, and retains the source after sale", () => {
    const f = fixture();
    f.launch();
    expect(f.state.stats.damageDealt).toBe(0);
    const interceptor = structuredClone(f.enemy);
    interceptor.id = 2;
    f.position(interceptor, 5);
    f.state.enemies.push(interceptor);
    f.tower.placement.firingOrigin.x = 19;
    f.tower.upgrades.push("flash_calibration");
    delete f.state.towers[f.tower.id];
    f.advance();
    expect(interceptor.health).toBe(20);
    expect(f.enemy.health).toBe(25);
    expect(f.state.catalyst!.chargeByEnemy["2"]!.amount).toBe(20);
    expect(f.state.catalyst!.directBySource[f.tower.id]!.damage).toBe(5);
    expect(f.state.towerAttacks[0]!.source).toEqual({ x: 2, elevation: 2.5 });
    expect(f.state.pendingAttacks).toEqual([]);
  });

  it("misses a moved target and never acquires a replacement outside its fixed line", () => {
    const f = fixture();
    f.launch();
    f.position(f.enemy, 8, 3);
    f.advance();
    expect(f.state.stats.damageDealt).toBe(0);
    expect(f.state.catalyst!.accounting.input).toBe(0);
    expect(f.state.pendingAttacks).toEqual([]);
  });

  it("rechecks dead interceptors before later simultaneous impacts and counts damage once", () => {
    const f = fixture();
    f.enemy.health = 3;
    f.launch();
    f.launch();
    f.advance();
    expect(f.state.stats.damageDealt).toBe(3);
    expect(f.state.stats.killed).toBe(1);
    expect(f.state.catalyst!.accounting.input).toBe(0);
    expect(f.state.catalyst!.directBySource[f.tower.id]!.overkill).toBe(2);
  });

  it("blocks thin architecture across a long sweep and shares the exact sight test", () => {
    const f = fixture();
    f.state.map = structuredClone(f.state.map);
    f.state.map = {
      ...f.state.map,
      rooms: {
        ...f.state.map.rooms,
        core: { ...f.state.map.rooms.core!, platformCells: [{ column: 5, elevation: 2 }] },
      },
    };
    f.launch();
    f.advance();
    expect(f.state.stats.damageDealt).toBe(0);
    expect(
      hasCombatLineOfSight(f.state.map, { x: 2, elevation: 2.5 }, { x: 8.5, elevation: 2.5 })
    ).toBe(false);
  });
});

describe("splash and induction impacts", () => {
  it("travels a fixed lob above low architecture and splashes at its fixed destination", () => {
    const f = fixture("lob");
    f.state.map = structuredClone(f.state.map);
    f.state.map = {
      ...f.state.map,
      rooms: {
        ...f.state.map.rooms,
        core: { ...f.state.map.rooms.core!, platformCells: [{ column: 5, elevation: 2 }] },
      },
    };
    f.launch();
    f.position(f.enemy, 9);
    f.advance(0.2);
    expect(f.state.pendingAttacks[0]!.position.elevation).toBeGreaterThan(3);
    f.advance(1);
    expect(f.state.stats.damageDealt).toBe(5);
  });

  it("keeps charge yield independent of armor and suppresses it for a fully shielded hit", () => {
    const f = fixture("projectile", 0);
    f.launch();
    f.advance();
    expect(f.state.stats.damageDealt).toBe(0);
    expect(f.state.catalyst!.accounting.accepted).toBe(20);
    const blocked = fixture();
    const anchor = structuredClone(blocked.enemy);
    anchor.id = 2;
    anchor.behavior = {
      kind: "shared_field",
      active: true,
      charge: 100,
      maximumCharge: 100,
    } as EnemyState["behavior"];
    blocked.position(anchor, 3, 3);
    blocked.state.enemies.push(anchor);
    blocked.launch();
    blocked.advance();
    expect(blocked.state.stats.damageDealt).toBe(0);
    expect(blocked.state.catalyst!.accounting.input).toBe(0);
  });

  it("keeps an eligible splash primary ahead of lower IDs under the cap", () => {
    const f = fixture("lob");
    f.launch();
    const attack = f.state.pendingAttacks[0]!;
    const extra = structuredClone(f.enemy);
    extra.id = 0;
    f.position(extra, 9);
    f.state.enemies.push(extra);
    resolveProjectileImpact(
      f.state,
      { attack, enemyId: f.enemy.id, position: { x: 8.5, elevation: 2.5 }, time: 0 },
      f.context
    );
    expect(f.enemy.health).toBe(20);
    expect(extra.health).toBe(25);
    resolvePhysicalHits(f.state, attack.source, [], attack.target, "hitscan", f.context);
    expect(f.state.stats.damageDealt).toBe(5);
  });
});

describe("launch-time aim", () => {
  it("predicts with the tick's frozen field weights and the same movement clamp", () => {
    const f = fixture();
    f.tower.placement.firingOrigin = { x: 8.5, elevation: 4.5 };
    f.enemy.path = Array.from({ length: 10 }, (_, index) => ({
      ...f.enemy.path[0]!,
      cell: { column: 8 + index, elevation: 2 },
    }));
    f.launch();
    const unmodified = f.state.pendingAttacks[0]!.target.x;
    f.state.pendingAttacks = [];
    const fields: CatalystFieldSample = {
      byEnemy: {
        [f.enemy.id]: [
          { sourceId: "frozen", towardProjector: { x: 1, elevation: 0 }, weightedStrength: -2 },
        ],
      },
      servicedByDevice: {},
    };
    f.launch(fields);
    expect(f.state.pendingAttacks[0]!.target.x).toBeLessThan(unmodified);
    for (let tick = 0; tick < 15 && f.state.pendingAttacks.length > 0; tick += 1) {
      moveEnemies(f.state, 0.1, f.context, fields);
      f.advance(0.1);
    }
    expect(f.state.stats.damageDealt).toBe(5);
  });
  it("leads a moving route target while retaining the frozen aim after a later route change", () => {
    const f = fixture();
    f.enemy.path = Array.from({ length: 10 }, (_, index) => ({
      ...f.enemy.path[0]!,
      cell: { column: 8 + index, elevation: 2 },
    }));
    f.launch();
    const target = { ...f.state.pendingAttacks[0]!.target };
    expect(target.x).toBeGreaterThan(8.5);
    for (let tick = 0; tick < 15 && f.state.pendingAttacks.length > 0; tick += 1) {
      moveEnemies(f.state, 0.1, f.context);
      f.advance(0.1);
    }
    expect(f.state.stats.damageDealt).toBe(5);
    const turn = fixture();
    turn.enemy.path = Array.from({ length: 10 }, (_, index) => ({
      ...turn.enemy.path[0]!,
      cell: { column: 8 + index, elevation: 2 },
    }));
    turn.launch();
    const frozen = { ...turn.state.pendingAttacks[0]!.target };
    turn.position(turn.enemy, 8, 3);
    turn.advance(0.1);
    expect(turn.state.pendingAttacks[0]!.target).toEqual(frozen);
    turn.advance(1);
    expect(turn.state.stats.damageDealt).toBe(0);
  });
});
