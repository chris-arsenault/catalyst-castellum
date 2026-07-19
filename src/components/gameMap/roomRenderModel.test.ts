import { describe, expect, it } from "vitest";
import { roomAtmosphericCells } from "../../game/config";
import { createScenarioGame } from "../../game/simulation";
import { roomHitArea } from "./roomHitArea";
import { roomRenderModel } from "./roomRenderModel";
import { gasConduitState, roomState } from "../../game/world/instances";
import { DEFAULT_GAME_PRESENTATION } from "../../presentation/services";

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
    roomState(game, "furnace").liquid.water = 140;
    const model = roomRenderModel(game, "furnace", false, 0);

    expect(model.cells.some(({ cell }) => cell.column === 9 && cell.elevation === 23)).toBe(false);
    expect(model.cells.some(({ liquidFill }) => liquidFill > 0)).toBe(true);
    expect(model.lowerGasFill).toBeGreaterThan(0);
    expect(model.upperGasFill).toBeGreaterThan(0);
  });

  it("renders empty atmosphere as empty instead of a decorative tint", () => {
    const game = createScenarioGame("flash_point");
    const gallery = roomState(game, "gallery");
    for (const gas of Object.keys(gallery.gas.upper)) {
      gallery.gas.upper[gas as keyof typeof gallery.gas.upper] = 0;
      gallery.gas.lower[gas as keyof typeof gallery.gas.lower] = 0;
    }
    const model = roomRenderModel(game, "gallery", false, 0);
    expect(model.upperGasFill).toBe(0);
    expect(model.lowerGasFill).toBe(0);
  });

  it("exposes delivered conduit flow to the room animation instead of relying on gas labels", () => {
    const game = createScenarioGame("flash_point");
    gasConduitState(game, "gas:core__furnace").lastFlow = 1.4;
    gasConduitState(game, "gas:core__furnace").flowCause = "fan";
    gasConduitState(game, "gas:core__furnace").lastSpeciesFlow.hydrogen = 0.9;
    gasConduitState(game, "gas:core__furnace").lastSpeciesFlow.oxygen = 0.5;

    const model = roomRenderModel(game, "furnace", false, 0);

    expect(model.gasInflowRate).toBeCloseTo(1.4);
    expect(model.gasInflowColors).toHaveLength(2);
    expect(new Set(model.gasInflowColors).size).toBe(2);
    expect(model.liquidInflowRate).toBe(0);
  });

  it("projects the Core's authored supply reservoirs into its cutaway", () => {
    const game = createScenarioGame("morrow_pocket");
    game.liquidSources.liquid_reservoir_a!.liquid.water = 90;
    const model = roomRenderModel(game, "core", false, 0, DEFAULT_GAME_PRESENTATION.supplies(game));

    expect(model.coreReservoirs.map(({ id }) => id)).toEqual(["gas_header", "water", "brine"]);
    expect(model.coreReservoirs.find(({ id }) => id === "water")?.fill).toBeCloseTo(0.5);
    expect(model.coreReservoirs.every(({ fill }) => fill >= 0 && fill <= 1)).toBe(true);
    expect(roomHitArea(model).contains(model.width / 2 + 18, 0)).toBe(true);
  });
});
