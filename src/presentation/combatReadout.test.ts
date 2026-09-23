import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { roomRoundCombat } from "./combatReadout";

describe("room combat totals", () => {
  it("totals the active encounter's room records independently of campaign round numbering", () => {
    const game = DEFAULT_GAME_RUNTIME.createInitial();
    game.campaign.roundIndex = 2;
    game.encounter.incidents = [
      {
        id: 1,
        encounterId: game.encounter.definition.id,
        elapsed: 1,
        phase: "assault",
        roomId: "furnace",
        zone: "lower",
        sourceId: "hydrogen_oxygen_combustion",
        reactionExtent: 1,
        pressureImpulse: 10,
        heatDelta: 2,
        damageByChannel: { atmosphere: 0, corrosion: 0, heat: 2, pressure: 10, radiation: 0 },
        targets: [
          {
            enemyId: 1,
            enemyType: "deckmouth",
            worldPosition: { x: 1, elevation: 1 },
            healthBefore: 12,
            healthAfter: 0,
            damageByChannel: { atmosphere: 0, corrosion: 0, heat: 2, pressure: 10, radiation: 0 },
            killed: true,
          },
        ],
      },
    ];
    expect(roomRoundCombat(game, "furnace")).toEqual({ damage: 12, kills: 1 });
    expect(roomRoundCombat(game, "reservoir")).toEqual({ damage: 0, kills: 0 });
  });
});
