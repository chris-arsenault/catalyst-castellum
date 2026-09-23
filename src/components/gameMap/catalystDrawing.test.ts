import { Graphics } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { createCatalystExerciseRuntime } from "../../game/exercise";
import { drawPendingAttacks, drawDischargePulses } from "./catalystDrawing";
import { mapViewFor } from "./mapGeometry";

describe("catalyst committed drawing", () => {
  it("renders the committed projectile position and launch color after its tower is removed", () => {
    const state = createCatalystExerciseRuntime().create().encounter;
    state.pendingAttacks.push({
      id: 1,
      strategy: "projectile",
      position: { x: 12.5, elevation: 5 },
      target: { x: 19, elevation: 5 },
      speed: 18,
      lobHeight: 0,
      collisionRadius: 0.3,
      age: 0.2,
      travelSeconds: 1,
      source: {
        sourceId: "removed",
        towerId: "removed",
        chassisId: "caustic_jet",
        color: "#123abc",
        origin: { x: 8, elevation: 5 },
        packets: [],
        controlEffects: [],
        chargePerHit: 20,
        eligibleLayers: ["ground"],
        radius: 0,
        targetCap: 1,
      },
    });
    const graphics = new Graphics();
    const circle = vi.spyOn(graphics, "circle"),
      fill = vi.spyOn(graphics, "fill");
    const position = mapViewFor(state.map).worldToMapPoint(state.pendingAttacks[0]!.position);
    expect(state.towers.removed).toBeUndefined();
    drawPendingAttacks(graphics, state);
    expect(circle).toHaveBeenCalledExactlyOnceWith(position.x, position.y, 3);
    expect(fill).toHaveBeenCalledWith({ color: 0x123abc, alpha: 0.95 });
    graphics.destroy();
  });

  it("shows committed discharge links from snapshots when the enemy has already died", () => {
    const state = createCatalystExerciseRuntime().create().encounter;
    state.elapsed = 1;
    state.catalyst!.pulses.push({
      id: 1,
      sourceId: "removed",
      elapsed: 0.9,
      origin: { x: 8, elevation: 5 },
      targets: [
        {
          enemyId: 42,
          position: { x: 12, elevation: 5 },
          consumed: 60,
          contributions: { inducer: 60 },
          damage: 45,
        },
      ],
    });
    const graphics = new Graphics(),
      line = vi.spyOn(graphics, "lineTo");
    const target = mapViewFor(state.map).worldToMapPoint({ x: 12, elevation: 5 });
    drawDischargePulses(graphics, state);
    expect(line).toHaveBeenCalledExactlyOnceWith(target.x, target.y);
    graphics.destroy();
  });
});
