import { describe, expect, it } from "vitest";
import { catalystCombat, catalystFixture } from "./__fixtures__/catalyst";
import {
  addImpactCharge,
  beginCatalystTick,
  clearEnemyCharge,
  cleanupCatalystCharge,
  removeEnemyCharge,
} from "./catalystCharge";
import { resolveCatalystDischarges, previewDischarge } from "./catalystDischarge";
import { commitDischargeDamage } from "../engine/towerImpact";
import { validateCatalystState } from "./catalystValidation";
import {
  projectCatalystMovement,
  sampleCatalystFields,
  previewCatalystField,
  previewCatalystPlacement,
} from "./catalystFields";
import { setCatalystFieldMode, suspendCatalystField } from "./catalystDevices";
import { catalystReport } from "./catalystReport";

describe("charge conservation", () => {
  it("caps input, apportions consumption and decay, and records each loss independently", () => {
    const f = catalystFixture(["flash_chamber", "flash_chamber"]);
    const enemy = f.state.enemies[0]!;
    const [first, second] = f.towers;
    addImpactCharge(f.state, enemy, first!.id, 60, f.context);
    addImpactCharge(f.state, enemy, second!.id, 40, f.context);
    addImpactCharge(f.state, enemy, second!.id, 20, f.context);
    expect(removeEnemyCharge(f.state, enemy.id, 60, "consumed")).toEqual({
      [first!.id]: 36,
      [second!.id]: 24,
    });
    f.state.tick = 11;
    beginCatalystTick(f.state, f.context);
    expect(f.state.catalyst!.accounting.decay).toBe(0);
    f.state.tick = 12;
    beginCatalystTick(f.state, f.context);
    expect(f.state.catalyst!.accounting.decay).toBe(0.5);
    expect(f.state.catalyst!.accountingBySource[first!.id]!.decay).toBeCloseTo(0.3);
    clearEnemyCharge(f.state, enemy.id, "death");
    for (const [index, reason] of ["breach", "cleanup"].entries()) {
      const target = f.state.enemies[index + 1]!;
      addImpactCharge(f.state, target, first!.id, 20, f.context);
      if (reason === "breach") clearEnemyCharge(f.state, target.id, "breach");
      else cleanupCatalystCharge(f.state);
    }
    expect(f.state.catalyst!.accounting).toEqual({
      input: 160,
      accepted: 140,
      overflow: 20,
      consumed: 60,
      decay: 0.5,
      death: 39.5,
      breach: 20,
      cleanup: 20,
    });
    expect(validateCatalystState(f.state, f.context)).toEqual([]);
  });

  it("retains sold source attribution in the ledger and report", () => {
    const f = catalystFixture();
    const source = f.towers[0]!;
    addImpactCharge(f.state, f.state.enemies[0]!, source.id, 60, f.context);
    delete f.state.towers[source.id];
    resolveCatalystDischarges(f.state, f.context, commitDischargeDamage);
    const report = catalystReport(f.state)!;
    expect(report.sources[source.id]!.chassisId).toBe("flash_chamber");
    expect(report.accountingBySource[source.id]!.consumed).toBe(60);
    expect(report.remainingCharge).toBe(0);
    expect(validateCatalystState(f.state, f.context)).toEqual([]);
    expect(f.runtime.load(f.runtime.save(f.state))).toEqual(f.state);
  });
});

describe("deterministic catalyst transactions", () => {
  it("converts the worked 120-charge chain to exactly 90 raw damage", () => {
    const f = catalystFixture();
    f.state.enemies.forEach((enemy, index) =>
      addImpactCharge(f.state, enemy, f.towers[0]!.id, index === 0 ? 60 : 20, f.context)
    );
    expect(previewDischarge(f.state, f.towers[1]!.id, f.context)?.chainEnemyIds).toEqual([
      1, 2, 3, 4,
    ]);
    resolveCatalystDischarges(f.state, f.context, commitDischargeDamage);
    expect(f.state.catalyst!.accounting.consumed).toBe(120);
    expect(f.state.catalyst!.damageByDevice[f.towers[1]!.id]).toEqual({
      raw: 90,
      actual: 90,
      mitigation: 0,
      overkill: 0,
      kills: 0,
    });
    expect(f.state.stats.damageDealt).toBe(90);
    expect(f.state.enemies.map((enemy) => enemy.health)).toEqual([155, 185, 185, 185]);
    expect(validateCatalystState(f.state, f.context)).toEqual([]);
  });

  it("gives the oldest ready catalyst the transaction and prevents a second visit this tick", () => {
    const f = catalystFixture(["flash_chamber", "carbonyl_marker", "carbonyl_marker"]);
    f.state.elapsed = 3;
    const older = f.state.catalyst!.devices[f.towers[2]!.id]!;
    const newer = f.state.catalyst!.devices[f.towers[1]!.id]!;
    if (older.kind !== "discharge" || newer.kind !== "discharge") throw new Error("fixture roles");
    older.readyAt = 0;
    newer.readyAt = 1;
    f.state.enemies.forEach((enemy) =>
      addImpactCharge(f.state, enemy, f.towers[0]!.id, 100, f.context)
    );
    resolveCatalystDischarges(f.state, f.context, commitDischargeDamage);
    expect(f.state.catalyst!.pulses).toHaveLength(1);
    expect(f.state.catalyst!.pulses[0]!.sourceId).toBe(f.towers[2]!.id);
    expect(f.state.catalyst!.accounting.consumed).toBe(240);
    expect(newer.readyAt).toBe(1);
  });
});

describe("frozen route-tangent fields", () => {
  it("projects again at bends, sums opposition before clamping, and enforces the control floor", () => {
    if (catalystCombat.mechanics.kind !== "catalyst") throw new Error("fixture mechanics");
    const rules = catalystCombat.mechanics.rules;
    const a = { sourceId: "a", towardProjector: { x: 1, elevation: 0 }, weightedStrength: 0.5 };
    const from = { x: 0, elevation: 0 };
    const horizontal = { x: 1, elevation: 0 };
    const vertical = { x: 0, elevation: 1 };
    const sample = { byEnemy: { "1": [a] }, servicedByDevice: {} };
    expect(projectCatalystMovement(sample, 1, from, horizontal, 1, rules)).toBe(1.5);
    expect(projectCatalystMovement(sample, 1, from, vertical, 1, rules)).toBe(1);
    expect(projectCatalystMovement(sample, 1, from, vertical, 0, rules)).toBeCloseTo(0.35);
    const cancellation = {
      ...sample,
      byEnemy: { "1": [a, { ...a, sourceId: "b", weightedStrength: -0.5 }] },
    };
    expect(projectCatalystMovement(cancellation, 1, from, horizontal, 1, rules)).toBeCloseTo(1);
  });

  it("shows placement arrows before activation and restarts suspension on repeated edits", () => {
    const f = catalystFixture(["flash_chamber", "quench_coil"]);
    const tower = f.towers[1]!;
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 100, f.context);
    expect(
      previewCatalystPlacement(f.state, tower.placement, "attract", tower.chassisId, f.context)
        .length
    ).toBeGreaterThan(0);
    expect(sampleCatalystFields(f.state, f.context).byEnemy).toEqual({});
    f.state.elapsed = 1;
    expect(sampleCatalystFields(f.state, f.context).servicedByDevice[tower.id]).toEqual([1]);
    setCatalystFieldMode(f.state, tower.id, "repel", f.context);
    f.state.elapsed = 1.5;
    suspendCatalystField(f.state, tower.id, f.context);
    expect(previewCatalystField(f.state, tower.id, f.context)?.activationRemaining).toBe(1);
    f.state.elapsed = 2;
    expect(sampleCatalystFields(f.state, f.context).byEnemy).toEqual({});
    f.state.elapsed = 2.5;
    expect(
      sampleCatalystFields(f.state, f.context).byEnemy["1"]![0]!.weightedStrength
    ).toBeLessThan(0);
  });
});

describe("discharge damage accounting", () => {
  it("records lethal overkill and remaining charge loss through the central death transaction", () => {
    const f = catalystFixture();
    const enemy = f.state.enemies[0]!;
    enemy.health = 3;
    addImpactCharge(f.state, enemy, f.towers[0]!.id, 100, f.context);
    resolveCatalystDischarges(f.state, f.context, commitDischargeDamage);
    expect(f.state.catalyst!.accounting.consumed).toBe(60);
    expect(f.state.catalyst!.accounting.death).toBe(40);
    expect(f.state.catalyst!.damageByDevice[f.towers[1]!.id]).toEqual({
      raw: 45,
      actual: 3,
      mitigation: 0,
      overkill: 42,
      kills: 1,
    });
    expect(f.state.stats.killed).toBe(1);
    expect(f.state.pendingMatter).toBe(3);
    expect(f.state.enemies).not.toContain(enemy);
    expect(validateCatalystState(f.state, f.context)).toEqual([]);
  });
});
