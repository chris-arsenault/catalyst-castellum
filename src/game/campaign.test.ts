import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { createInitialGame, createScenarioGame, executeCommand, stepGame } from "./simulation";
import type { GameCommand, GameState, ScenarioAvailability } from "./types";
import { primaryReferenceBuildFor } from "./content/playtestPortfolios";
import { gasConduitState, gasJunctionState, roomState } from "./world/instances";

const primaryCommands = (levelId: keyof typeof LEVEL_DEFINITIONS) =>
  primaryReferenceBuildFor(levelId).rounds.flatMap((round) => round.commands);

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const availabilitySubset = (before: ScenarioAvailability, after: ScenarioAvailability): boolean =>
  before.equipment.every((id) => after.equipment.includes(id)) &&
  before.gasLines.every((id) => after.gasLines.includes(id)) &&
  before.liquidLines.every((id) => after.liquidLines.includes(id));

describe("Flash Point scenario truth", () => {
  it("starts inert with one Core mixture, one gas conduit, and no Inner Bay starter state", () => {
    const game = createInitialGame();
    expect(game.phase).toBe("level_briefing");
    expect(game.gasSources.gas_reservoir!.gas.hydrogen).toBeGreaterThan(0);
    expect(game.gasSources.gas_reservoir!.gas.oxygen).toBeGreaterThan(0);
    expect(gasConduitState(game, "gas:core__furnace")).toMatchObject({
      enabled: false,
    });
    expect(gasJunctionState(game, "lower_intake").gas.hydrogen).toBe(0);
    expect(game.availability.gasLines).toEqual(["gas:core__furnace"]);
  });

  it("requires the authored equipment and shared fan action", () => {
    let state = command(createScenarioGame("flash_point"), { type: "begin_level" });
    for (const action of primaryCommands("flash_point").slice(0, 2)) {
      state = command(state, action);
    }
    expect(roomState(state, "furnace").equipment.socket_a?.equipmentId).toBe("gas_agitator");
    expect(gasConduitState(state, "gas:core__furnace").enabled).toBe(true);
  });

  it("emits the real prime flash before the automatic assault removes its action button", () => {
    let state = command(createScenarioGame("flash_point"), { type: "begin_level" });
    for (const action of primaryCommands("flash_point").slice(0, 2)) {
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
  it("authors at least five waves for every campaign site", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      expect(level.rounds.length, level.id).toBeGreaterThanOrEqual(5);
    }
  });

  it("skips the guided opening directly into Level 2", () => {
    const skipped = command(createInitialGame(), { type: "skip_tutorial" });
    expect(skipped.phase).toBe("build");
    expect(skipped.campaign.levelId).toBe("make_the_reagent");
    expect(skipped.campaign.completedLevelIds).toContain("flash_point");
    expect(skipped.availability.equipment).toContain("membrane_cell");
  });

  it("preserves room and conduit inventory between rounds", () => {
    let state = command(createScenarioGame("flash_point"), { type: "begin_level" });
    roomState(state, "furnace").gas.lower.steam = 9;
    gasConduitState(state, "gas:core__furnace").gas.hydrogen = 3;
    state = command(state, { type: "start_prime" });
    state = command(state, { type: "start_assault" });
    state.spawnCursor = LEVEL_DEFINITIONS.flash_point.rounds[0]!.wave.length;
    state.enemies = [];
    state = stepGame(state, 0.1);
    expect(state.phase).toBe("round_result");
    state = command(state, { type: "continue_round" });
    expect(
      roomState(state, "furnace").gas.lower.steam + roomState(state, "furnace").gas.upper.steam
    ).toBeGreaterThan(8.9);
    expect(gasConduitState(state, "gas:core__furnace").gas.hydrogen).toBeGreaterThan(2.9);
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
      const conduitActions = primaryCommands(level.id).filter(
        (action): action is Extract<GameCommand, { type: "set_conduit" }> =>
          action.type === "set_conduit"
      );
      expect(conduitActions.length, level.id).toBeGreaterThan(0);
      expect(conduitActions.every((action) => action.enabled)).toBe(true);
    }
  });
});
