import { describe, expect, it } from "vitest";
import { roomAtmosphericCells } from "../../game/config";
import { createScenarioGame } from "../../game/simulation";
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

  it("excludes authored platform solids from atmosphere and liquid rendering cells", () => {
    const game = createScenarioGame("flash_point");
    game.rooms.furnace.liquid.water = 140;
    const model = roomRenderModel(game, "furnace", false, 0);

    expect(model.cells.some(({ cell }) => cell.column === 9 && cell.elevation === 23)).toBe(false);
    expect(model.cells.some(({ liquidFill }) => liquidFill > 0)).toBe(true);
  });
});
