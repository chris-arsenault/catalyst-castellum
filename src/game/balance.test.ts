import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";

describe("tutorial balance contract", () => {
  it("keeps the opening lesson inert until both simple player decisions are made", () => {
    const actions = LEVEL_DEFINITIONS.flash_point.playtestActions;
    expect(actions).toHaveLength(2);
    expect(actions.map((action) => action.type)).toEqual(["install_equipment", "set_conduit"]);
    expect(LEVEL_DEFINITIONS.flash_point.rounds[0]!.wave.length).toBeGreaterThan(0);
  });

  it("gates every checkpoint behind at least one authored conduit action that starts off", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      const startsOff = level.playtestActions.some((action) => {
        if (action.type !== "set_conduit" || !action.enabled) return false;
        const loadout =
          action.phase === "gas"
            ? level.loadout.gasConduits[action.runId]
            : level.loadout.liquidConduits[action.runId];
        return loadout?.installed === true && loadout.enabled === false;
      });
      expect(startsOff, level.name).toBe(true);
    }
  });

  it("leaves Monte Carlo evaluation outside normal CI", () => {
    // The expensive policy evaluator remains available through `pnpm playtest` only.
    expect(LEVEL_DEFINITIONS.flash_point.id).toBe("flash_point");
  });
});
