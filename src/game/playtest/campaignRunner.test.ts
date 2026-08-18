import { describe, expect, it } from "vitest";
import { LEVEL_IDS } from "../types";
import { runReferenceCampaign } from "./campaignRunner";

describe("continuous campaign reference", () => {
  it("carries one legal economy and hull state from a new save to victory", () => {
    const campaign = runReferenceCampaign();

    expect(campaign.failure).toBeNull();
    expect(campaign.success).toBe(true);
    expect(campaign.stable).toBe(true);
    expect(campaign.terminalPhase).toBe("victory");
    expect(campaign.completedLevelIds).toEqual(LEVEL_IDS);
    expect(campaign.sites.map(({ levelId }) => levelId)).toEqual(LEVEL_IDS);
    expect(campaign.rejectedActions).toBe(0);
    expect(campaign.reusedTowerPlacements).toBeGreaterThan(0);
    expect(campaign.retryCount).toBe(0);
    expect(campaign.minimumMatter).toBeGreaterThanOrEqual(0);
    expect(campaign.finalCoreIntegrity).toBeGreaterThanOrEqual(40);
    for (const site of campaign.sites) {
      expect(site.reports).toHaveLength(5);
    }
  }, 120_000);
});
