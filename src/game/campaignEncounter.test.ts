import { describe, expect, it } from "vitest";
import { directFireFixture } from "./__fixtures__/postM1Scenarios";
import { campaignEncounterContext } from "./engine/campaignEncounter";
import { createEncounterRuntime } from "./encounter/runtime";
import type { EncounterCommand } from "./encounter/types";

describe("campaign encounter composition", () => {
  it("uses the same authoritative state at command and tick boundaries", () => {
    const fixture = directFireFixture();
    const { runtime } = fixture;
    let campaign = fixture.state;
    const core = createEncounterRuntime(campaignEncounterContext(campaign, runtime.definition));
    let encounter = campaign.encounter;
    const commands: EncounterCommand[] = [
      { type: "upgrade_tower", towerId: fixture.towerId, upgradeId: "flash_calibration" },
      { type: "start_assault" },
    ];
    for (const command of commands) {
      const standalone = core.execute(encounter, {
        tick: encounter.tick,
        sequence: encounter.commandCursor.sequence + 1,
        command,
      });
      const applied = runtime.execute(campaign, command);
      expect(applied.accepted).toBe(standalone.decision.allowed);
      campaign = applied.state;
      expect(campaign.encounter).toEqual(standalone.state);
      encounter = campaign.encounter;
    }
    for (const count of [1, 39, 40, 40]) {
      const standalone = core.advanceTicks(encounter, count);
      campaign = runtime.advanceTicks(campaign, count);
      expect(campaign.encounter).toEqual(standalone.state);
      encounter = campaign.encounter;
    }
    const standalone = core.advanceTicks(encounter, 1_000).state;
    campaign = runtime.advanceTicks(campaign, 1_000);
    expect(standalone.result?.termination).toBe("complete");
    expect(campaign.encounter.result).toEqual(standalone.result);
    expect(campaign.encounter.matter).toBe(standalone.matter + standalone.pendingMatter);
    expect(campaign.encounter.pendingMatter).toBe(0);
    expect(campaign.encounter.stats).toEqual(standalone.stats);
    expect(campaign.encounter.process).toEqual(standalone.process);
    const saved = runtime.save.decode(runtime.save.encode(campaign));
    expect(saved).not.toBeNull();
    expect(runtime.advanceTicks(saved!, 20)).toEqual(saved);
  });
});
