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
    expect(DEFAULT_GAME_DEFINITION.contentVersion).toBe(15);
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
});

describe("species hazard authoring", () => {
  it("requires exact combat attribution for every hazardous species", () => {
    const chlorine = DEFAULT_GAME_DEFINITION.species.chlorine;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        species: {
          ...DEFAULT_GAME_DEFINITION.species,
          chlorine: { ...chlorine, damageSourceId: null },
        },
      })
    ).toThrow(/requires a combat damage source/);
  });

  it("rejects invalid saturating hazard bounds", () => {
    const chlorine = DEFAULT_GAME_DEFINITION.species.chlorine;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        species: {
          ...DEFAULT_GAME_DEFINITION.species,
          chlorine: {
            ...chlorine,
            hazards: chlorine.hazards.map((hazard, index) =>
              index === 0 ? { ...hazard, maximumExcess: 0 } : hazard
            ),
          },
        },
      })
    ).toThrow(/Maximum hazard excess must be finite and positive/);
  });
});

describe("game pack extension", () => {
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

describe("mass-action reaction authoring", () => {
  it("rejects a rate order that references a species outside its consumed side", () => {
    const reaction = DEFAULT_GAME_DEFINITION.reactions.water_gas_reaction;
    if (reaction.behavior.kind !== "mass_action") throw new Error("Expected mass-action fixture.");
    const behavior = reaction.behavior;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        reactions: {
          ...DEFAULT_GAME_DEFINITION.reactions,
          water_gas_reaction: {
            ...reaction,
            behavior: {
              ...behavior,
              forward: {
                ...behavior.forward,
                rateOrders: [{ species: "carbon_monoxide", order: 1 }],
              },
            },
          },
        },
      })
    ).toThrow(/is not consumed/);
  });
});

describe("equipment operation authoring", () => {
  it("rejects a powered operation backed by an incompatible reaction strategy", () => {
    const membraneCell = DEFAULT_GAME_DEFINITION.equipment.membrane_cell;
    const operation = membraneCell.operation;
    if (!operation) throw new Error("Expected membrane-cell operation.");
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        equipment: {
          ...DEFAULT_GAME_DEFINITION.equipment,
          membrane_cell: {
            ...membraneCell,
            operation: {
              ...operation,
              duties: [{ medium: null, reactionIds: ["acid_neutralization"] }],
            },
          },
        },
      })
    ).toThrow(/require electrolysis/);
  });

  it("rejects a dedicated port for a species the operation does not produce", () => {
    const membraneCell = DEFAULT_GAME_DEFINITION.equipment.membrane_cell;
    const operation = membraneCell.operation;
    if (!operation) throw new Error("Expected membrane-cell operation.");
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        equipment: {
          ...DEFAULT_GAME_DEFINITION.equipment,
          membrane_cell: {
            ...membraneCell,
            operation: {
              ...operation,
              outputs: operation.outputs.map((output) =>
                output.phase === "gas" && output.speciesId === "chlorine"
                  ? { ...output, speciesId: "oxygen" as const }
                  : output
              ),
            },
          },
        },
      })
    ).toThrow(/is not produced/);
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
