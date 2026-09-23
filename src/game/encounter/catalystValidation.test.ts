import { describe, expect, it } from "vitest";
import { catalystCombat, catalystFixture } from "./__fixtures__/catalyst";
import { addImpactCharge } from "./catalystCharge";
import { validateCatalystDefinition, validateCatalystState } from "./catalystValidation";
import { resolveCatalystDischarges } from "./catalystDischarge";
import { commitDischargeDamage } from "../engine/towerImpact";
import type { CombatDefinition } from "./types";
import { createEncounterRuntime } from "./runtime";
import { removeCatalystDevice } from "./catalystDevices";

describe("catalyst durable validation", () => {
  it("prunes an unused dismantled source while retaining sources that have recorded outcomes", () => {
    const f = catalystFixture();
    const unused = f.towers[1]!;
    delete f.state.towers[unused.id];
    removeCatalystDevice(f.state, unused.id);
    expect(f.state.catalyst!.sources[unused.id]).toBeUndefined();
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 20, f.context);
    delete f.state.towers[f.towers[0]!.id];
    removeCatalystDevice(f.state, f.towers[0]!.id);
    expect(f.state.catalyst!.sources[f.towers[0]!.id]).toBeDefined();
    expect(f.runtime.load(f.runtime.save(f.state))).toEqual(f.state);
  });

  it("preserves charge and source shares in a timed-out snapshot", () => {
    const f = catalystFixture();
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 20, f.context);
    f.towers[0]!.cooldown = 1;
    const context = { ...f.context, definition: { ...f.context.definition, maximumTicks: 2 } };
    const runtime = createEncounterRuntime(context);
    const result = runtime.advanceTicks(f.state, 1);
    expect(result.termination).toBe("timeout");
    expect(result.state.catalyst!.accounting.cleanup).toBe(0);
    expect(result.state.catalyst!.chargeByEnemy["1"]!.amount).toBe(20);
    expect(runtime.load(runtime.save(result.state))).toEqual(result.state);
  });

  it("rejects reuse of a retired installation sequence", () => {
    const f = catalystFixture(["flash_chamber"]);
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 20, f.context);
    delete f.state.towers[f.towers[0]!.id];
    const saved = JSON.parse(f.runtime.save(f.state));
    saved.encounter.nextTowerSequence = 1;
    expect(f.runtime.load(JSON.stringify(saved))).toBeNull();
  });

  it("round trips source shares and rejects forged accounting and incomplete device state", () => {
    const f = catalystFixture();
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 100, f.context);
    const saved = f.runtime.save(f.state);
    expect(f.runtime.load(saved)).toEqual(f.state);
    const forged = JSON.parse(saved);
    forged.encounter.catalyst.accounting.accepted += 1;
    expect(f.runtime.load(JSON.stringify(forged))).toBeNull();
    delete f.state.catalyst!.devices[f.towers[1]!.id];
    expect(validateCatalystState(f.state, f.context).join(";")).toContain("missing device state");
  });
});

describe("catalyst account and definition rejection", () => {
  it("validates pulse source shares, sequence, and damage account signs", () => {
    const f = catalystFixture();
    addImpactCharge(f.state, f.state.enemies[0]!, f.towers[0]!.id, 60, f.context);
    resolveCatalystDischarges(f.state, f.context, commitDischargeDamage);
    expect(f.runtime.load(f.runtime.save(f.state))).toEqual(f.state);
    f.state.catalyst!.pulses[0]!.targets[0]!.contributions[f.towers[0]!.id] = 100;
    f.state.catalyst!.pulses[0]!.id = f.state.catalyst!.nextPulseId;
    f.state.catalyst!.damageByDevice[f.towers[1]!.id]!.actual = -1;
    const issues = validateCatalystState(f.state, f.context).join(";");
    expect(issues).toContain("consumed amount differs");
    expect(issues).toContain("invalid pulse sequence");
    expect(issues).toContain(".actual: expected finite value");
  });

  it("rejects unsupported JavaScript authoring values and extra catalog references", () => {
    const combat = structuredClone(catalystCombat);
    if (combat.mechanics.kind !== "catalyst") throw new Error("fixture mechanics");
    const invalid = {
      ...combat,
      mechanics: {
        ...combat.mechanics,
        devices: {
          ...combat.mechanics.devices,
          quench_coil: {
            kind: "field",
            radius: 4,
            targetCap: 6,
            strength: 0.5,
            activationSeconds: 1,
            defaultMode: "sideways",
            eligibleLayers: ["underground"],
          },
          invented: { kind: "weapon", chargePerHit: 20 },
        },
      },
    } as unknown as CombatDefinition;
    const issues = validateCatalystDefinition(invalid).join(";");
    expect(issues).toContain("defaultMode: unsupported field mode");
    expect(issues).toContain("eligibleLayers: expected unique supported layers");
    expect(issues).toContain("devices.invented: unknown chassis");
  });
});
