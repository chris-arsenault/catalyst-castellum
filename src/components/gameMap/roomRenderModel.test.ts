import { describe, expect, it } from "vitest";
import { roomAtmosphericCells } from "../../game/config";
import { createScenarioGame } from "../../game/simulation";
import { roomHitArea } from "./roomHitArea";
import { roomRenderModel } from "./roomRenderModel";

describe("canonical room rendering projection", () => {
  it("projects the same owned cells used by room physics, including portal connectors", () => {
    const game = createScenarioGame("flash_point");
    const model = roomRenderModel(game, "washlock", false, 0);

    expect(model.cells).toHaveLength(roomAtmosphericCells("washlock").length);
    expect(model.cells.map(({ cell }) => cell)).toEqual(
      expect.arrayContaining([
        { column: 42, elevation: 13 },
        { column: 49, elevation: 4 },
        { column: 50, elevation: 4 },
      ])
    );
  });

  it("keeps the chamber shell and its owned portal connectors selectable", () => {
    const game = createScenarioGame("flash_point");
    const model = roomRenderModel(game, "washlock", false, 0);
    const hitArea = roomHitArea(model);
    const connector = model.cells.find(({ cell }) => cell.column === 42 && cell.elevation === 13);
    if (!connector) throw new Error("Washlock connector is absent from the room render model");

    expect(hitArea.contains(0, 0)).toBe(true);
    expect(
      hitArea.contains(connector.left + connector.size / 2, connector.top + connector.size / 2)
    ).toBe(true);
    expect(hitArea.contains(model.width, model.height)).toBe(false);
  });

  it("excludes authored platform solids from atmosphere and liquid rendering cells", () => {
    const game = createScenarioGame("flash_point");
    game.rooms.furnace.liquid.water = 140;
    const model = roomRenderModel(game, "furnace", false, 0);

    expect(model.cells.some(({ cell }) => cell.column === 9 && cell.elevation === 23)).toBe(false);
    expect(model.cells.some(({ liquidFill }) => liquidFill > 0)).toBe(true);
    expect(model.lowerGasFill).toBeGreaterThan(0);
    expect(model.upperGasFill).toBeGreaterThan(0);
  });

  it("renders empty atmosphere as empty instead of a decorative tint", () => {
    const game = createScenarioGame("flash_point");
    for (const gas of Object.keys(game.rooms.gallery.gas.upper)) {
      game.rooms.gallery.gas.upper[gas as keyof typeof game.rooms.gallery.gas.upper] = 0;
      game.rooms.gallery.gas.lower[gas as keyof typeof game.rooms.gallery.gas.lower] = 0;
    }
    const model = roomRenderModel(game, "gallery", false, 0);
    expect(model.upperGasFill).toBe(0);
    expect(model.lowerGasFill).toBe(0);
  });

  it("exposes delivered conduit flow to the room animation instead of relying on gas labels", () => {
    const game = createScenarioGame("flash_point");
    game.gasConduits.core_furnace.lastFlow = 1.4;
    game.gasConduits.core_furnace.flowCause = "fan";
    game.gasConduits.core_furnace.lastSpeciesFlow.hydrogen = 0.9;
    game.gasConduits.core_furnace.lastSpeciesFlow.oxygen = 0.5;

    const model = roomRenderModel(game, "furnace", false, 0);

    expect(model.gasInflowRate).toBeCloseTo(1.4);
    expect(model.gasInflowColors).toHaveLength(2);
    expect(new Set(model.gasInflowColors).size).toBe(2);
    expect(model.liquidInflowRate).toBe(0);
  });
});
