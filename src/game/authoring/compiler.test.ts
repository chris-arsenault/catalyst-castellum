import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../definition";
import { GamePackCompilationError } from "./compiler";
import { createGameRuntime } from "../runtime";
import type { ReactionId, RoomReactionId } from "../types";
import { roomState } from "../world/instances";

describe("game pack compiler", () => {
  it("freezes a compiled definition and validates its identity", () => {
    expect(Object.isFrozen(DEFAULT_GAME_DEFINITION)).toBe(true);
    expect(DEFAULT_GAME_DEFINITION.packId).toBe("catalyst-castellum");
    expect(DEFAULT_GAME_DEFINITION.contentVersion).toBe(7);
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
                wave: [
                  {
                    at: 0,
                    type: "missing_enemy" as never,
                    routeId: "entry_to_core",
                    levelOffset: 0,
                  },
                ],
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
    expect(roomState(game, "furnace").reactions[fixtureId as RoomReactionId]).toMatchObject({
      lastRate: 0,
      limitingFactor: { kind: "condition", code: "conditions", zone: null },
    });
  });
});

describe("enemy level authoring", () => {
  it("rejects a site baseline outside the enemy level domain", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.flash_point;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          flash_point: { ...level, enemyLevel: 100 },
        },
      })
    ).toThrow(/Site enemy level must be an integer between 1 and 99/);
  });

  it("rejects a wave offset that resolves outside the enemy level domain", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.flash_point;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          flash_point: {
            ...level,
            rounds: level.rounds.map((round, index) =>
              index === 0
                ? {
                    ...round,
                    wave: round.wave.map((entry) => ({ ...entry, levelOffset: -20 })),
                  }
                : round
            ),
          },
        },
      })
    ).toThrow(/Resolved enemy level must be between 1 and 99/);
  });
});

describe("enemy behavior authoring", () => {
  it("rejects an empty shared-field budget", () => {
    const anchor = DEFAULT_GAME_DEFINITION.enemies.anchor;
    if (anchor.behavior.kind !== "shared_field") throw new Error("Expected Anchor field behavior.");
    const fieldBehavior = anchor.behavior;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        enemies: {
          ...DEFAULT_GAME_DEFINITION.enemies,
          anchor: { ...anchor, behavior: { ...fieldBehavior, capacity: 0 } },
        },
      })
    ).toThrow(/Field capacity must be positive/);
  });

  it("caps a wave at one shared-field enemy", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.flash_point;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          flash_point: {
            ...level,
            rounds: level.rounds.map((round, index) =>
              index === 0 ? { ...round, wave: enemySequenceForFieldTest() } : round
            ),
          },
        },
      })
    ).toThrow(/at most one shared-field enemy/);
  });
});

const enemySequenceForFieldTest = () => [
  { at: 0, type: "anchor" as const, routeId: "entry_to_core", levelOffset: 0 },
  { at: 1, type: "anchor" as const, routeId: "entry_to_core", levelOffset: 0 },
];
