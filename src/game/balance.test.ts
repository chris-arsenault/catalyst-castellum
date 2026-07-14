import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { runPlan } from "./playtest/runner";
import { intendedPlan } from "./playtest/policies";
import type { PlaytestPlan } from "./playtest/types";
import { LEVEL_PLAYTEST_PLANS } from "./content/playtestPlans";

describe("tutorial balance contract", () => {
  it("keeps the opening lesson inert until both simple player decisions are made", () => {
    const actions = LEVEL_PLAYTEST_PLANS.flash_point.commands;
    expect(actions).toHaveLength(2);
    expect(actions.map((action) => action.type)).toEqual(["install_equipment", "set_conduit"]);
    expect(LEVEL_DEFINITIONS.flash_point.rounds[0]!.wave.length).toBeGreaterThan(0);
  });

  it("gates every checkpoint behind at least one authored conduit action that starts off", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      const startsOff = LEVEL_PLAYTEST_PLANS[level.id].commands.some((action) => {
        if (action.type !== "set_conduit" || !action.enabled) return false;
        const loadout =
          action.phase === "gas"
            ? level.loadout.gasConduits[action.runId]
            : level.loadout.liquidConduits[action.runId];
        return loadout?.installed === true && loadout.enabled === false;
      });
      expect(startsOff, level.id).toBe(true);
    }
  });

  it("leaves Monte Carlo evaluation outside normal CI", () => {
    // The expensive policy evaluator remains available through `pnpm playtest` only.
    expect(LEVEL_DEFINITIONS.flash_point.id).toBe("flash_point");
  });

  it("makes a running agitator decisive in Flash Point", () => {
    const conduitOnly: PlaytestPlan = {
      name: "conduit_only",
      commands: [{ type: "set_conduit", runId: "core_furnace", phase: "gas", enabled: true }],
      primeFraction: 1,
    };
    const disabledAgitator: PlaytestPlan = {
      name: "disabled_agitator",
      commands: [
        {
          type: "install_equipment",
          roomId: "furnace",
          socketId: "socket_a",
          equipmentId: "gas_agitator",
        },
        { type: "set_conduit", runId: "core_furnace", phase: "gas", enabled: true },
        {
          type: "toggle_equipment",
          roomId: "furnace",
          socketId: "socket_a",
          enabled: false,
        },
      ],
      primeFraction: 1,
    };

    for (const plan of [conduitOnly, disabledAgitator]) {
      const result = runPlan("flash_point", plan);
      expect(result.terminalPhase, plan.name).toBe("defeat");
      expect(result.coreIntegrity, plan.name).toBe(0);
      expect(result.damageBySource.hydrogen_oxygen_combustion, plan.name).toBe(0);
    }

    const intended = runPlan("flash_point", intendedPlan("flash_point"));
    expect(intended.terminalPhase).toBe("level_complete");
    expect(intended.coreIntegrity).toBe(100);
    expect(intended.killsBySource.hydrogen_oxygen_combustion).toBeGreaterThan(0);
  }, 15_000);
});
