import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../definition";
import { GamePackCompilationError } from "./compiler";
import { createGameRuntime } from "../runtime";
import type { ReactionId, RoomReactionId } from "../types";

describe("game pack compiler", () => {
  it("freezes a compiled definition and validates its identity", () => {
    expect(Object.isFrozen(DEFAULT_GAME_DEFINITION)).toBe(true);
    expect(DEFAULT_GAME_DEFINITION.packId).toBe("catalyst-castellum");
    expect(DEFAULT_GAME_DEFINITION.contentVersion).toBe(1);
  });

  it("rejects an unknown wave enemy before a scenario starts", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.flash_point;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          flash_point: {
            ...level,
            rounds: [
              {
                ...level.rounds[0]!,
                wave: [{ at: 0, type: "missing_enemy" as never, routeId: "entry_to_core" }],
              },
            ],
          },
        },
      })
    ).toThrow(GamePackCompilationError);
  });

  it("rejects unbalanced authored chemistry", () => {
    const reaction = DEFAULT_GAME_DEFINITION.reactions.acid_neutralization;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        reactions: {
          ...DEFAULT_GAME_DEFINITION.reactions,
          acid_neutralization: {
            ...reaction,
            products: reaction.products.map((participant, index) =>
              index === 0
                ? { ...participant, coefficient: participant.coefficient + 1 }
                : participant
            ),
          },
        },
      })
    ).toThrow(/unbalanced/);
  });

  it("adds a balanced reaction through an existing strategy without engine changes", () => {
    const fixtureId = "fixture_contact_reaction" as ReactionId;
    const source = DEFAULT_GAME_DEFINITION.reactions.acid_neutralization;
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "reaction-extension-fixture",
      reactions: {
        ...DEFAULT_GAME_DEFINITION.reactions,
        [fixtureId]: { ...source, id: fixtureId },
      },
    });
    const game = createGameRuntime(definition).createScenario("flash_point");

    expect(definition.reactions[fixtureId].behavior.kind).toBe("mixed_contact");
    expect(game.rooms.furnace.reactions[fixtureId as RoomReactionId]).toMatchObject({
      lastRate: 0,
      limitingFactor: { kind: "condition", code: "conditions", zone: null },
    });
  });
});
