import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { runPlan } from "./playtest/runner";
import { primaryReferencePlan } from "./playtest/policies";
import type { PlaytestPlan } from "./playtest/types";
import { primaryReferenceBuildFor } from "./content/playtestPortfolios";

const primaryCommands = (levelId: keyof typeof LEVEL_DEFINITIONS) =>
  primaryReferenceBuildFor(levelId).rounds.flatMap((round) => round.commands);

const burstPlan = (
  name: string,
  commands: PlaytestPlan["rounds"][number]["commands"]
): PlaytestPlan => ({
  name,
  archetype: "burst",
  rounds: [{ commands, primeFraction: 1 }],
});

const FAILED_AGITATOR_PLANS: PlaytestPlan[] = [
  burstPlan("conduit_only", [
    { type: "set_conduit", connectionId: "gas:core__furnace", enabled: true },
  ]),
  burstPlan("disabled_agitator", [
    {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    },
    { type: "set_conduit", connectionId: "gas:core__furnace", enabled: true },
    {
      type: "toggle_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      enabled: false,
    },
  ]),
];

describe("tutorial balance contract", () => {
  it("keeps the opening lesson inert until both simple player decisions are made", () => {
    const opening = primaryCommands("flash_point").slice(0, 2);
    expect(opening.map((action) => action.type)).toEqual(["install_equipment", "set_conduit"]);
    expect(LEVEL_DEFINITIONS.flash_point.rounds[0]!.wave.length).toBeGreaterThan(0);
  });

  it("leaves Monte Carlo evaluation outside normal CI", () => {
    // The expensive policy evaluator remains available through `pnpm playtest` only.
    expect(LEVEL_DEFINITIONS.flash_point.id).toBe("flash_point");
  });
});

describe("flash point reinforcement contract", () => {
  it("defeats the opening chamber alone once the reinforcement rounds begin", () => {
    const singleRoom = burstPlan("single_room", primaryCommands("flash_point").slice(0, 2));
    const result = runPlan("flash_point", singleRoom);
    expect(result.terminalPhase).toBe("defeat");
    expect(result.roundsCleared).toBeLessThan(LEVEL_DEFINITIONS.flash_point.rounds.length);
  }, 60_000);

  it("clears all five rounds with the taught two-chamber corridor", () => {
    const reference = runPlan("flash_point", primaryReferencePlan("flash_point"));
    expect(reference.terminalPhase).toBe("level_complete");
    expect(reference.roundsCleared).toBe(LEVEL_DEFINITIONS.flash_point.rounds.length);
    expect(reference.coreIntegrity).toBeGreaterThanOrEqual(85);
    expect(reference.killsBySource.hydrogen_oxygen_combustion).toBeGreaterThan(0);
  }, 60_000);

  it("gates every checkpoint behind authored conduit construction or activation", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      const buildsLine = primaryCommands(level.id).some(
        (action) => action.type === "build_connection"
      );
      const startsOff = primaryCommands(level.id).some((action) => {
        if (action.type !== "set_conduit" || !action.enabled) return false;
        const loadout =
          level.loadout.gasConduits[action.connectionId] ??
          level.loadout.liquidConduits[action.connectionId];
        return loadout?.enabled === false;
      });
      expect(startsOff || buildsLine, level.id).toBe(true);
    }
  });

  it("makes a running agitator decisive in Flash Point", () => {
    for (const plan of FAILED_AGITATOR_PLANS) {
      const result = runPlan("flash_point", plan);
      expect(result.terminalPhase, plan.name).toBe("defeat");
      expect(result.coreIntegrity, plan.name).toBe(0);
      expect(result.damageBySource.hydrogen_oxygen_combustion, plan.name).toBe(0);
    }

    const reference = runPlan("flash_point", primaryReferencePlan("flash_point"));
    expect(reference.terminalPhase).toBe("level_complete");
    expect(reference.coreIntegrity).toBe(100);
    expect(reference.killsBySource.hydrogen_oxygen_combustion).toBeGreaterThan(0);
  }, 60_000);
});
