import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { createInitialGame, createScenarioGame, executeCommand, stepGame } from "./simulation";
import type { GameCommand, GameState, ScenarioAvailability } from "./types";
import { LEVEL_PLAYTEST_PLANS } from "./content/playtestPlans";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const availabilitySubset = (before: ScenarioAvailability, after: ScenarioAvailability): boolean =>
  before.equipment.every((id) => after.equipment.includes(id)) &&
  before.gasRuns.every((id) => after.gasRuns.includes(id)) &&
  before.liquidRuns.every((id) => after.liquidRuns.includes(id)) &&
  before.gasSources.every((id) => after.gasSources.includes(id)) &&
  before.liquidSources.every((id) => after.liquidSources.includes(id));

describe("Flash Point scenario truth", () => {
  it("starts inert with one Core mixture, one gas conduit, and no Inner Bay starter state", () => {
    const game = createInitialGame();
    expect(game.phase).toBe("level_briefing");
    expect(game.gasSources.starter_gas_header.gas.hydrogen).toBeGreaterThan(0);
    expect(game.gasSources.starter_gas_header.gas.oxygen).toBeGreaterThan(0);
    expect(game.gasConduits.core_furnace).toMatchObject({ installed: true, enabled: false });
    expect(game.gasBuffers.cathode_header.gas.hydrogen).toBe(0);
    expect(game.gasJunctions.lower_intake.gas.hydrogen).toBe(0);
    expect(game.availability.gasRuns).toEqual(["core_furnace"]);
  });

  it("requires the authored equipment and shared fan action", () => {
    let state = command(createScenarioGame("flash_point"), { type: "begin_level" });
    for (const action of LEVEL_PLAYTEST_PLANS.flash_point.commands) {
      state = command(state, action);
    }
    expect(state.rooms.furnace.equipment.socket_a?.equipmentId).toBe("gas_agitator");
    expect(state.gasConduits.core_furnace.enabled).toBe(true);
  });

  it("emits the real prime flash before the automatic assault removes its action button", () => {
    let state = command(createScenarioGame("flash_point"), { type: "begin_level" });
    for (const action of LEVEL_PLAYTEST_PLANS.flash_point.commands) {
      state = command(state, action);
    }
    state = command(state, { type: "start_prime" });
    for (let step = 0; step < 300 && state.incidents.length === 0; step += 1) {
      state = stepGame(state, 0.1);
    }
    expect(state.incidents[0]?.phase).toBe("prime");
    expect(state.phase).toBe("prime");
    expect(state.phaseTime).toBeLessThan(LEVEL_DEFINITIONS.flash_point.rounds[0]!.primeSeconds);
  });
});

describe("campaign checkpoints", () => {
  it("skips the guided opening directly into Level 2", () => {
    const skipped = command(createInitialGame(), { type: "skip_tutorial" });
    expect(skipped.phase).toBe("build");
    expect(skipped.campaign.levelId).toBe("make_the_reagent");
    expect(skipped.campaign.completedLevelIds).toContain("flash_point");
    expect(skipped.availability.equipment).toContain("membrane_cell");
  });

  it("preserves room and conduit inventory between rounds", () => {
    let state = command(createScenarioGame("flash_point"), { type: "begin_level" });
    state.rooms.furnace.gas.lower.steam = 9;
    state.gasConduits.core_furnace.gas.hydrogen = 3;
    state = command(state, { type: "start_prime" });
    state = command(state, { type: "start_assault" });
    state.spawnCursor = LEVEL_DEFINITIONS.flash_point.rounds[0]!.wave.length;
    state.enemies = [];
    state = stepGame(state, 0.1);
    expect(state.phase).toBe("round_result");
    state = command(state, { type: "continue_round" });
    expect(
      state.rooms.furnace.gas.lower.steam + state.rooms.furnace.gas.upper.steam
    ).toBeGreaterThan(8.9);
    expect(state.gasConduits.core_furnace.gas.hydrogen).toBeGreaterThan(2.9);
  });

  it("keeps unlocks cumulative inside every authored level", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      for (let index = 1; index < level.rounds.length; index += 1) {
        expect(
          availabilitySubset(
            level.rounds[index - 1]!.availability,
            level.rounds[index]!.availability
          ),
          `${level.id} round ${index + 1}`
        ).toBe(true);
      }
    }
  });

  it("authors every level around typed whole-conduit controls", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      const conduitActions = LEVEL_PLAYTEST_PLANS[level.id].commands.filter(
        (action): action is Extract<GameCommand, { type: "set_conduit" }> =>
          action.type === "set_conduit"
      );
      expect(conduitActions.length, level.id).toBeGreaterThan(0);
      expect(conduitActions.every((action) => action.enabled)).toBe(true);
    }
  });
});
