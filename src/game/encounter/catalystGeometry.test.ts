import { describe, expect, it } from "vitest";
import { catalystFixture } from "./__fixtures__/catalyst";
import { addImpactCharge } from "./catalystCharge";
import { sampleCatalystFields, previewCatalystField } from "./catalystFields";
import { previewDischarge } from "./catalystDischarge";
import { moveEnemies } from "../engine/combat";

describe("catalyst geometry and movement", () => {
  it("reprojects frozen force after crossing a walking-to-climbing bend in one tick", () => {
    const f = catalystFixture();
    const enemy = f.state.enemies[0]!;
    const step = enemy.path[0]!;
    enemy.path = [
      { ...step, cell: { column: 2, elevation: 1 }, mode: "walking" },
      { ...step, cell: { column: 3, elevation: 1 }, mode: "walking" },
      { ...step, cell: { column: 3, elevation: 2 }, mode: "climbing" },
      { ...step, cell: { column: 4, elevation: 2 }, mode: "walking" },
    ];
    enemy.progress = 0.9;
    moveEnemies(f.state, 0.1, f.context, {
      byEnemy: {
        "1": [
          { sourceId: "field", towardProjector: { x: 1, elevation: 0 }, weightedStrength: 0.5 },
        ],
      },
      servicedByDevice: {},
    });
    expect(enemy.pathIndex).toBe(1);
    expect(enemy.mode).toBe("climbing");
    expect(enemy.progress).toBeCloseTo((0.1 - 0.1 / 4.8) * 3.2 * 0.68, 12);
  });

  it("keeps the positive speed floor after stun and stops additional breaches after defeat", () => {
    const f = catalystFixture();
    const enemy = f.state.enemies[0]!;
    enemy.effects = [
      {
        sourceTowerId: f.towers[0]!.id,
        kind: "stun",
        magnitude: 1,
        remaining: 2,
        stacking: "strongest",
        floor: 0,
      },
    ];
    moveEnemies(f.state, 0.1, f.context);
    expect(enemy.progress).toBeCloseTo(0.112, 12);
    f.state.coreIntegrity = 1;
    f.state.enemies.forEach((target) => {
      target.pathIndex = target.path.length - 1;
    });
    addImpactCharge(f.state, enemy, f.towers[0]!.id, 20, f.context);
    moveEnemies(f.state, 0.1, f.context);
    expect(f.state.stats.breached).toBe(1);
    expect(f.state.catalyst!.accounting.breach).toBe(20);
    expect(f.state.enemies).toHaveLength(3);
  });
});

describe("catalyst coverage", () => {
  it("orders field capacity by charge, range, then identity and freezes sampled inputs", () => {
    const f = catalystFixture(["flash_chamber", "quench_coil"]);
    f.state.elapsed = 1;
    const original = f.state.enemies[0]!;
    for (let id = 5; id <= 8; id += 1) f.state.enemies.push({ ...structuredClone(original), id });
    f.state.enemies.forEach((enemy) => {
      enemy.pathIndex = 0;
      addImpactCharge(f.state, enemy, f.towers[0]!.id, enemy.id >= 7 ? 100 : 20, f.context);
    });
    const sample = sampleCatalystFields(f.state, f.context);
    expect(sample.servicedByDevice[f.towers[1]!.id]).toEqual([7, 8, 1, 2, 3, 4]);
    const before = structuredClone(sample);
    addImpactCharge(f.state, original, f.towers[0]!.id, 80, f.context);
    f.towers[1]!.placement.firingOrigin.x += 3;
    expect(sample).toEqual(before);
    expect(sampleCatalystFields(f.state, f.context)).not.toEqual(before);
  });

  it("filters layers and walls in fields and terminates a chain at blocked links", () => {
    const f = catalystFixture(["flash_chamber", "carbonyl_marker", "quench_coil"]);
    f.state.elapsed = 1;
    f.state.enemies.forEach((enemy, index) =>
      addImpactCharge(f.state, enemy, f.towers[0]!.id, index === 0 ? 60 : 20, f.context)
    );
    const flying = {
      ...f.context,
      combat: {
        ...f.context.combat,
        enemies: { deckmouth: { ...f.context.combat.enemies.deckmouth!, flying: true } },
      },
    };
    expect(sampleCatalystFields(f.state, flying).servicedByDevice[f.towers[2]!.id]).toEqual([]);
    expect(previewDischarge(f.state, f.towers[1]!.id, flying)?.seedEnemyId).toBeNull();
    f.state.map = {
      ...f.state.map,
      rooms: { core: { ...f.state.map.rooms.core!, platformCells: [{ column: 4, elevation: 1 }] } },
    };
    const preview = previewDischarge(f.state, f.towers[1]!.id, f.context)!;
    expect(preview.chainEnemyIds).toEqual([1, 2]);
    expect(preview.blockedLinks).toContainEqual({ fromEnemyId: 2, toEnemyId: 3 });
    expect(
      sampleCatalystFields(f.state, f.context).servicedByDevice[f.towers[2]!.id]
    ).not.toContain(3);
  });
});

describe("committed field accounting", () => {
  it("records enemy-seconds once per tick regardless of repeated presentation queries", () => {
    const f = catalystFixture(["flash_chamber", "quench_coil"]);
    f.state.elapsed = 1;
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 100, f.context);
    for (let repeat = 0; repeat < 10; repeat += 1) {
      sampleCatalystFields(f.state, f.context);
      previewCatalystField(f.state, f.towers[1]!.id, f.context);
    }
    expect(f.state.catalyst!.fieldByDevice).toEqual({});
    const advanced = f.runtime.advanceTicks(f.state, 1).state;
    const account = advanced.catalyst!.fieldByDevice[f.towers[1]!.id]!;
    expect(account.activeSeconds).toBeCloseTo(0.1);
    expect(account.servicedEnemySeconds).toBeCloseTo(0.1);
    expect(f.runtime.load(f.runtime.save(advanced))).toEqual(advanced);
  });
});
