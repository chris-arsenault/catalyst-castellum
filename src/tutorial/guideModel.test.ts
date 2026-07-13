import { describe, expect, it } from "vitest";
import { emptyHazardChannels } from "../game/engine/damage";
import { createScenarioGame, executeCommand } from "../game/simulation";
import type { CombatIncident, GameCommand, GameState } from "../game/types";
import { assaultFlashIncident, guideDefinitionFor, guideStepIndexFor } from "./guideModel";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.reason ?? undefined).toBe(true);
  return result.state;
};

const incident = (
  game: GameState,
  phase: "prime" | "assault",
  killed: boolean
): CombatIncident => ({
  id: game.nextIncidentId,
  elapsed: game.elapsed,
  levelId: "flash_point",
  round: 1,
  phase,
  roomId: "furnace",
  zone: "lower",
  sourceId: "hydrogen_oxygen_combustion",
  reactionExtent: 3,
  pressureImpulse: 120,
  heatDelta: 30,
  damageByChannel: {
    ...emptyHazardChannels(),
    pressure: phase === "assault" ? 64 : 0,
  },
  targets:
    phase === "assault"
      ? [
          {
            enemyId: 9,
            enemyType: "crawler",
            worldPosition: { x: 98, elevation: 14 },
            healthBefore: 64,
            healthAfter: killed ? 0 : 12,
            damageByChannel: { ...emptyHazardChannels(), pressure: killed ? 64 : 52 },
            killed,
          },
        ]
      : [],
});

describe("Flash Point guide", () => {
  it("teaches one mixed conduit and waits for separate prime and combat evidence", () => {
    let game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    expect(guide).not.toBeNull();
    if (!guide) throw new Error("Flash Point guide missing");

    expect(guide.steps.map((step) => step.id)).toEqual([
      "install-agitator",
      "start-shared-duct",
      "begin-prime",
      "accelerate-clock",
      "observe-prime-flash",
      "start-assault",
      "observe-combat-flash",
      "combat-confirmed",
    ]);
    expect(guide.steps.filter((step) => step.target.includes("conduit-control"))).toHaveLength(1);
    expect(guide.steps.some((step) => /oxygen|hydrogen/i.test(step.target))).toBe(false);

    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    expect(guide.steps[0]?.completed(game)).toBe(true);
    expect(guideStepIndexFor(game, guide)).toBe(1);

    game = command(game, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    expect(guide.steps[1]?.completed(game)).toBe(true);
    game = command(game, { type: "start_prime" });
    game = command(game, { type: "set_speed", speed: 2 });

    game.incidents.unshift(incident(game, "prime", false));
    expect(guide.steps[4]?.completed(game)).toBe(true);
    expect(assaultFlashIncident(game)).toBeNull();
    expect(guideStepIndexFor(game, guide)).toBe(5);

    game = command(game, { type: "start_assault" });
    game.incidents.unshift(incident(game, "assault", false));
    expect(assaultFlashIncident(game)).not.toBeNull();
    expect(guide.steps[6]?.completed(game)).toBe(false);

    game.incidents.unshift(incident(game, "assault", true));
    expect(guide.steps[6]?.completed(game)).toBe(true);
    expect(guideStepIndexFor(game, guide)).toBe(7);
  });
});
