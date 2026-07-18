import { Graphics } from "pixi.js";
import { describe, expect, it } from "vitest";
import { createScenarioGame } from "../../game/simulation";
import { drawRoom } from "./roomGraphics";
import { roomRenderModel } from "./roomRenderModel";

describe("room status presentation", () => {
  it("keeps selection, hazard, reaction, and pressure indicators inside the room", () => {
    const game = createScenarioGame("flash_point");
    const model = roomRenderModel(game, "furnace", true, 0);
    model.analysis = { ...model.analysis, hazard: 90, liquidTotal: 0 };
    model.cells = [];
    model.gasInflowRate = 0;
    model.lowerGasFill = 0;
    model.pressurePulse = 160;
    model.reactionIntensity = 1;
    model.upperGasFill = 0;
    const graphics = new Graphics();

    drawRoom(graphics, model);

    const bounds = graphics.getLocalBounds();
    expect(bounds.left).toBeGreaterThanOrEqual(-model.width / 2);
    expect(bounds.top).toBeGreaterThanOrEqual(-model.height / 2);
    expect(bounds.right).toBeLessThanOrEqual(model.width / 2);
    expect(bounds.bottom).toBeLessThanOrEqual(model.height / 2);
  });
});
