import { describe, expect, it } from "vitest";
import { createTowerPresentation } from "./towers";
import { towerVariantFixture } from "./__fixtures__/towerVariant";

describe("runtime-bound tower presentation", () => {
  it("shares variant definitions, defaults, stats and upgrades with command evaluation", () => {
    const { runtime, game, tower } = towerVariantFixture();
    const towers = createTowerPresentation(runtime);
    expect(towers.definition("flash_chamber")).toMatchObject({ buildCost: 29, color: "#123abc" });
    expect(towers.defaultPlacement("flash_chamber")).toEqual({
      chassisId: "flash_chamber",
      mountFace: "ceiling",
      orientation: "down",
    });
    expect(towers.packetDamage("flash_chamber")).toBe(40);
    expect(towers.stats(tower, game.encounter)).toMatchObject({
      cadence: 2,
      range: 5,
      firingArc: 90,
    });
    const upgraded = runtime.execute(game, {
      type: "upgrade_tower",
      towerId: tower.id,
      upgradeId: "flash_calibration",
    });
    expect(upgraded.accepted).toBe(true);
    expect(upgraded.state.encounter.matter).toBe(game.encounter.matter - 7);
    expect(
      towers.stats(upgraded.state.encounter.towers[tower.id]!, upgraded.state.encounter)
    ).toMatchObject({
      cadence: 2.5,
      range: 6,
      damageMultiplier: 1.5,
    });
    expect(
      runtime.evaluate(game, { type: "rotate_tower", towerId: tower.id, orientation: "left" })
        .allowed
    ).toBe(false);
    expect(
      runtime.evaluate(game, { type: "set_tower_targeting", towerId: tower.id, policy: "first" })
        .allowed
    ).toBe(false);
  });
});
