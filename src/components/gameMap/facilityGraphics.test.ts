import { Graphics } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { initialPortalStates } from "../../game/config";
import { drawBackdrop, drawFacilityPortalFlows } from "./facilityGraphics";
import { WORLD_MAP } from "../../game/content/worldMap";

describe("facility architecture rendering", () => {
  it("draws Site 01 inside a curved pressure shell with distant plant equipment", () => {
    const graphics = new Graphics();
    const clear = vi.spyOn(graphics, "clear");
    const roundRect = vi.spyOn(graphics, "roundRect");
    const bezierCurveTo = vi.spyOn(graphics, "bezierCurveTo");

    drawBackdrop(graphics, WORLD_MAP);

    expect(clear).toHaveBeenCalledOnce();
    expect(roundRect.mock.calls.length).toBeGreaterThanOrEqual(8);
    expect(bezierCurveTo.mock.calls.length).toBeGreaterThanOrEqual(10);
  });

  it("draws portal flow overlays separately from the illustrated structures", () => {
    const graphics = new Graphics();
    const clear = vi.spyOn(graphics, "clear");
    const lineTo = vi.spyOn(graphics, "lineTo");

    drawFacilityPortalFlows(graphics, WORLD_MAP, initialPortalStates());

    expect(clear).toHaveBeenCalledOnce();
    expect(lineTo).not.toHaveBeenCalled();
  });
});
