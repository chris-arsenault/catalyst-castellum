import { describe, expect, it } from "vitest";
import { LEVEL_IDS } from "../types";
import {
  NARRATIVE_ACTS,
  NARRATIVE_ROUTE_EDGES,
  NARRATIVE_SITES,
  narrativeSiteAfter,
  narrativeSiteForLevel,
  narrativeSiteOpensAct,
  validateNarrativeCampaign,
} from "./narrativeCampaign";

describe("narrative campaign authoring", () => {
  it("defines one valid twelve-site route", () => {
    expect(validateNarrativeCampaign()).toEqual([]);
    expect(NARRATIVE_SITES).toHaveLength(12);
    expect(NARRATIVE_ROUTE_EDGES).toHaveLength(11);
    expect(NARRATIVE_SITES.map(({ order }) => order)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1)
    );
  });

  it("allocates four consecutive sites to each act", () => {
    for (const act of Object.values(NARRATIVE_ACTS)) {
      const sites = NARRATIVE_SITES.filter(({ actId }) => actId === act.id);
      expect(sites).toHaveLength(4);
      expect(sites.map(({ order }) => order)).toEqual(
        Array.from({ length: 4 }, (_, index) => index + (act.order - 1) * 4 + 1)
      );
    }
  });

  it("opens each act at its first site", () => {
    expect(NARRATIVE_SITES.filter(narrativeSiteOpensAct).map(({ order }) => order)).toEqual([
      1, 5, 9,
    ]);
  });

  it("binds every playable level to the opening Ratter sites", () => {
    expect(LEVEL_IDS.map((levelId) => narrativeSiteForLevel(levelId).levelId)).toEqual(LEVEL_IDS);
    expect(LEVEL_IDS.map((levelId) => narrativeSiteForLevel(levelId).order)).toEqual([1, 2, 3, 4]);
  });

  it("advances through authored sites independently of mechanical bindings", () => {
    expect(narrativeSiteAfter(NARRATIVE_SITES[3]!)?.id).toBe("kettleblack");
    expect(narrativeSiteAfter(NARRATIVE_SITES[11]!)).toBeNull();
  });

  it("increases the site-authored enemy baseline across the route", () => {
    const levels = NARRATIVE_SITES.map(({ authoredEnemyLevel }) => authoredEnemyLevel);
    expect(levels.every((level, index) => index === 0 || level > levels[index - 1]!)).toBe(true);
  });
});
