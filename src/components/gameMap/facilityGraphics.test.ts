import { Graphics } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { initialPortalStates } from "../../game/config";
import { drawFacilityCorridors, drawFacilityPortalFlows } from "./facilityGraphics";
import { WORLD_MAP } from "../../game/content/worldMap";
import { architecturalConnections } from "../../game/world/map";

describe("facility architecture rendering", () => {
  it("keeps portal cuts behind the illustrated structures while the Core owns its shell", () => {
    const graphics = new Graphics();
    const clear = vi.spyOn(graphics, "clear");
    const rect = vi.spyOn(graphics, "rect");
    const connectorCells = architecturalConnections(WORLD_MAP).reduce(
      (total, portal) => total + portal.connectorCells.length,
      0
    );

    drawFacilityCorridors(graphics, WORLD_MAP);

    expect(clear).toHaveBeenCalledOnce();
    expect(rect).toHaveBeenCalledTimes(connectorCells);
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
