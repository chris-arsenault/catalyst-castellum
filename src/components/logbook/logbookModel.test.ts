import { describe, expect, it } from "vitest";
import { createScenarioGame } from "../../game/simulation";
import type { GameState } from "../../game/types";
import { defaultLogbookSelection, logbookGroups, selectionMatches } from "./logbookModel";

const gameAt = (levelId: Parameters<typeof createScenarioGame>[0], phase: GameState["phase"]) => {
  const game = createScenarioGame(levelId);
  return { ...game, phase };
};

describe("captain's log entries", () => {
  it("opens on the act when the current site starts one and on the site otherwise", () => {
    expect(defaultLogbookSelection(gameAt("flash_point", "level_briefing"))).toEqual({
      kind: "act",
      actId: "good_standing",
    });
    expect(defaultLogbookSelection(gameAt("make_the_reagent", "level_briefing"))).toEqual({
      kind: "site",
      siteId: "harkers_brace",
    });
  });

  it("opens on the secured site once the castellum clears it", () => {
    expect(defaultLogbookSelection(gameAt("flash_point", "level_complete"))).toEqual({
      kind: "site",
      siteId: "claim_8_delta",
    });
  });

  it("reads acts up to the current one and only the current site", () => {
    const groups = logbookGroups(gameAt("kettleblack", "level_briefing"));
    const [actOne, actTwo, actThree] = groups;

    expect(actOne?.status).toBe("secured");
    expect(actOne?.readable).toBe(true);
    expect(actTwo?.status).toBe("current");
    expect(actThree?.status).toBe("sealed");
    expect(actThree?.readable).toBe(false);

    const sites = groups.flatMap((group) => group.sites);
    expect(sites.filter((entry) => entry.readable).map((entry) => entry.site.id)).toEqual([
      "kettleblack",
    ]);
    expect(sites.find((entry) => entry.site.id === "claim_8_delta")?.status).toBe("secured");
    expect(sites.find((entry) => entry.site.id === "pell_cordon")?.status).toBe("sealed");
  });

  it("matches a selection only against an entry of the same kind", () => {
    expect(
      selectionMatches(
        { kind: "act", actId: "good_standing" },
        { kind: "act", actId: "good_standing" }
      )
    ).toBe(true);
    expect(
      selectionMatches(
        { kind: "act", actId: "good_standing" },
        { kind: "site", siteId: "kettleblack" }
      )
    ).toBe(false);
    expect(
      selectionMatches(
        { kind: "site", siteId: "kettleblack" },
        { kind: "site", siteId: "pell_cut" }
      )
    ).toBe(false);
  });
});
