import { describe, expect, it } from "vitest";
import { defensivePosture } from "./engine/defensivePosture";
import { conduitDefensiveImpact } from "./engine/defensivePostureProjection";
import { DEFAULT_GAME_RUNTIME } from "./runtime";
import { roomState } from "./world/instances";

const enterFlashPoint = () =>
  DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("flash_point"), {
    type: "begin_level",
  }).state;

describe("defensive posture", () => {
  it("reports one enemy-adjusted traversal rather than multiplying room-wide damage by wave size", () => {
    const game = enterFlashPoint();
    roomState(game, "furnace").gas.lower.chlorine += 20;

    const posture = defensivePosture(game, DEFAULT_GAME_RUNTIME.definition);
    const deckmouth = posture.enemies[0];

    expect(deckmouth).toMatchObject({ type: "deckmouth", count: 10, health: 85 });
    expect(deckmouth?.damagePerTraversal).toBeGreaterThan(0);
    expect(deckmouth?.rooms.find((room) => room.roomId === "furnace")?.damagePerTraversal).toBe(
      deckmouth?.damagePerTraversal
    );
  });

  it("converts projected OX-1 flashes into the defensive effect of opening its feed", () => {
    let game = enterFlashPoint();
    game = DEFAULT_GAME_RUNTIME.execute(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    }).state;

    const impact = conduitDefensiveImpact(
      game,
      "gas:core__furnace",
      true,
      DEFAULT_GAME_RUNTIME.definition
    );

    expect(impact.seconds).toBe(24);
    expect(impact.enemies).toMatchObject([
      {
        type: "deckmouth",
        health: 85,
      },
    ]);
    expect(impact.enemies[0]?.damageDelta).toBeGreaterThan(10);
    expect(impact.rooms).toContainEqual(
      expect.objectContaining({ roomId: "furnace", tone: "gain" })
    );
  }, 30_000);
});
