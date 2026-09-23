import { Graphics } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { towerVariantFixture } from "../../presentation/__fixtures__/towerVariant";
import { createTowerPresentation } from "../../presentation/towers";
import { drawTower } from "./towerDrawing";
import { mapViewFor } from "./mapGeometry";

describe("variant tower drawing", () => {
  it("draws the injected color, arc, range and coverage eligibility", () => {
    const { runtime, game, tower } = towerVariantFixture();
    const service = createTowerPresentation(runtime);
    const towers = { ...service, coversPoint: vi.fn(service.coversPoint) };
    const graphics = new Graphics();
    const arc = vi.spyOn(graphics, "arc");
    const stroke = vi.spyOn(graphics, "stroke");
    drawTower(graphics, game.encounter, tower, true, towers);
    const coverageArc = arc.mock.calls[0]!;
    expect(coverageArc[2]).toBe(5 * mapViewFor(game.encounter.map).pixelsPerUnit);
    expect(coverageArc[4]! - coverageArc[3]!).toBeCloseTo(Math.PI / 2);
    expect(stroke).toHaveBeenCalledWith(expect.objectContaining({ color: 0x123abc }));
    expect(towers.coversPoint).toHaveBeenCalled();
    for (const [index, args] of towers.coversPoint.mock.calls.entries()) {
      expect(towers.coversPoint.mock.results[index]?.value).toBe(
        runtime.queries.towerCoversPoint(...args)
      );
    }
    graphics.destroy();
  });
});
