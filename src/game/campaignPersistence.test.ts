import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_DEFINITION } from "./definition";
import { createGameRuntime } from "./runtime";

const runtime = createGameRuntime(DEFAULT_GAME_DEFINITION);

const preparedDefense = () => {
  let state = runtime.execute(runtime.createScenario("claim_8_delta"), {
    type: "begin_level",
  }).state;
  state.encounter.matter = 400;
  state = runtime.execute(state, {
    type: "place_tower",
    chassisId: "flash_chamber",
    anchor: { column: 6, elevation: 8 },
    mountFace: "left_wall",
    orientation: "right",
  }).state;
  state = runtime.execute(state, {
    type: "place_tower",
    chassisId: "flash_chamber",
    anchor: { column: 51, elevation: 8 },
    mountFace: "left_wall",
    orientation: "right",
  }).state;
  const [siteTower, hullTower] = Object.values(state.encounter.towers);
  if (!siteTower || !hullTower) throw new Error("Expected both campaign test towers.");
  expect(siteTower.provenance).toBe("site");
  expect(hullTower.provenance).toBe("hull");
  state = runtime.execute(state, {
    type: "upgrade_tower",
    towerId: hullTower.id,
    upgradeId: "flash_calibration",
  }).state;
  return { state, siteTowerId: siteTower.id, hullTowerId: hullTower.id };
};

describe("fixed-campaign operation state", () => {
  it("restores the validated pre-assault checkpoint and discards mid-assault construction", () => {
    const prepared = preparedDefense();
    const assault = runtime.execute(prepared.state, { type: "start_assault" }).state;
    const checkpoint = assault.campaign.operationCheckpoint;
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) throw new Error("Expected an operation checkpoint.");

    const added = runtime.execute(assault, {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 9 },
      mountFace: "left_wall",
      orientation: "right",
    });
    expect(added.accepted).toBe(true);
    added.state.encounter.coreIntegrity = 0;
    added.state.phase = "defeat";

    const retried = runtime.execute(added.state, { type: "retry_level" });
    expect(retried.accepted).toBe(true);
    expect(retried.state.phase).toBe("build");
    expect(Object.keys(retried.state.encounter.towers)).toEqual([
      prepared.siteTowerId,
      prepared.hullTowerId,
    ]);
    expect(retried.state.encounter.coreIntegrity).toBe(100);
    expect(retried.state.campaign.retryCount).toBe(1);
    expect(runtime.save.decode(checkpoint)).not.toBeNull();
  });

  it("recovers site tower value and carries Matter, Core, hull towers, and upgrades", () => {
    const prepared = preparedDefense();
    prepared.state.phase = "level_complete";
    prepared.state.encounter.coreIntegrity = 73;
    const matterBeforeDeparture = prepared.state.encounter.matter;
    const siteTower = prepared.state.encounter.towers[prepared.siteTowerId]!;
    const expectedRecovery = Math.floor(
      siteTower.totalMatterSpent * DEFAULT_GAME_DEFINITION.towers[siteTower.chassisId].recoveryRatio
    );

    const traveling = runtime.execute(prepared.state, { type: "start_next_level" });
    expect(traveling.accepted).toBe(true);
    expect(traveling.state.encounter.towers[prepared.siteTowerId]).toBeUndefined();
    expect(traveling.state.encounter.towers[prepared.hullTowerId]?.upgrades).toEqual([
      "flash_calibration",
    ]);
    expect(traveling.state.encounter.matter).toBe(matterBeforeDeparture + expectedRecovery);

    const docked = runtime.execute(traveling.state, { type: "dock_at_site" });
    expect(docked.accepted).toBe(true);
    expect(docked.state.campaign.levelId).toBe("harkers_brace");
    expect(docked.state.encounter.coreIntegrity).toBe(73);
    expect(docked.state.encounter.matter).toBe(matterBeforeDeparture + expectedRecovery);
    expect(docked.state.encounter.towers[prepared.hullTowerId]).toMatchObject({
      provenance: "hull",
      upgrades: ["flash_calibration"],
    });
    expect(runtime.save.decode(runtime.save.encode(docked.state))).not.toBeNull();
  });
});
