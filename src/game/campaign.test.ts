import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { createInitialGame, createScenarioGame, executeCommand, stepGame } from "./simulation";
import type { GameCommand, GameState, ScenarioAvailability } from "./types";
import { LEVEL_IDS } from "./types";
import { primaryReferenceBuildFor } from "./content/playtestPortfolios";
import { roomState } from "./world/instances";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const availabilitySubset = (before: ScenarioAvailability, after: ScenarioAvailability): boolean =>
  before.towers.every((id) => after.towers.includes(id)) &&
  before.equipment.every((id) => after.equipment.includes(id)) &&
  before.gasLines.every((id) => after.gasLines.includes(id)) &&
  before.liquidLines.every((id) => after.liquidLines.includes(id));

describe("fixed campaign contract", () => {
  it("authors the twelve sites in campaign order with at least five waves each", () => {
    expect(Object.keys(LEVEL_DEFINITIONS)).toEqual(LEVEL_IDS);
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      expect(level.rounds.length, level.id).toBeGreaterThanOrEqual(5);
      expect(level.routes.length, level.id).toBeGreaterThan(0);
    }
  });

  it("opens a new campaign at Claim 8-Delta in planning", () => {
    const opened = command(createInitialGame(), { type: "begin_level" });
    expect(opened.phase).toBe("build");
    expect(opened.campaign.levelId).toBe("claim_8_delta");
    expect(opened.campaign.completedLevelIds).toEqual([]);
  });

  it("moves directly from planning into assault", () => {
    let state = command(createScenarioGame("claim_8_delta"), { type: "begin_level" });
    state = command(state, { type: "start_assault" });
    expect(state.phase).toBe("assault");
    expect(state.campaign.operationCheckpoint).not.toBeNull();
  });

  it("preserves environmental inventories between waves", () => {
    let state = command(createScenarioGame("claim_8_delta"), { type: "begin_level" });
    roomState(state, "furnace").gas.lower.steam = 9;
    state = command(state, { type: "start_assault" });
    state.spawnCursor = LEVEL_DEFINITIONS.claim_8_delta.rounds[0]!.wave.length;
    state.enemies = [];
    state = stepGame(state, 0.1);
    expect(state.phase).toBe("round_result");
    state = command(state, { type: "continue_round" });
    expect(
      roomState(state, "furnace").gas.lower.steam + roomState(state, "furnace").gas.upper.steam
    ).toBeGreaterThan(8.9);
  });

  it("keeps tower and process availability cumulative within each site", () => {
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

  it("gives every site a reference defense built from discrete towers", () => {
    for (const level of Object.values(LEVEL_DEFINITIONS)) {
      const commands = primaryReferenceBuildFor(level.id).rounds.flatMap((round) => round.commands);
      expect(
        commands.some((action) => action.type === "place_tower"),
        level.id
      ).toBe(true);
    }
  });
});
