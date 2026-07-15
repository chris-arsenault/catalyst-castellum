import { Graphics } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { facilityCells, initialPortalStates } from "../../game/config";
import { drawFacilityCorridors, drawFacilityDoors } from "./facilityGraphics";
import { WORLD_MAP } from "../../game/content/worldMap";

describe("facility architecture rendering", () => {
  it("draws canonical shell, platform, ladder, and opening geometry", () => {
    const graphics = new Graphics();
    const clear = vi.spyOn(graphics, "clear");
    const rect = vi.spyOn(graphics, "rect");
    const moveTo = vi.spyOn(graphics, "moveTo");
    const fill = vi.spyOn(graphics, "fill");
    const cells = facilityCells();
    const coreShells = cells.filter(({ terrain }) => terrain === "core_shell").length;
    const platforms = cells.filter(({ terrain }) => terrain === "platform").length;
    const ladders = cells.filter(({ terrain }) => terrain === "ladder").length;

    drawFacilityCorridors(graphics, WORLD_MAP);

    expect(clear).toHaveBeenCalledOnce();
    expect(rect.mock.calls.length).toBeGreaterThanOrEqual(coreShells + platforms);
    expect(moveTo.mock.calls.length).toBeGreaterThanOrEqual(coreShells + ladders * 3);
    expect(fill.mock.calls.length).toBeGreaterThanOrEqual(coreShells + platforms);
  });

  it("draws the closed Core door and the authored open trapdoor", () => {
    const graphics = new Graphics();
    const clear = vi.spyOn(graphics, "clear");
    const roundRect = vi.spyOn(graphics, "roundRect");
    const moveTo = vi.spyOn(graphics, "moveTo");
    const stroke = vi.spyOn(graphics, "stroke");

    drawFacilityDoors(graphics, WORLD_MAP, initialPortalStates());

    expect(clear).toHaveBeenCalledOnce();
    expect(roundRect).toHaveBeenCalledTimes(2);
    expect(moveTo.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(stroke.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
