import { describe, expect, it } from "vitest";
import { initialPortalStates } from "../../game/config";
import { WORLD_MAP } from "../../game/content/worldMap";
import { facilityModelForMap } from "../../game/world/derivedModel";
import { mapViewFor } from "./mapGeometry";
import { doorArchitectureModels, staticArchitectureModels } from "./architectureRenderModel";

describe("illustrated architecture projection", () => {
  it("projects platforms and portals as oversized art and tiles ladders within their cells", () => {
    const cells = facilityModelForMap(WORLD_MAP).cells();
    const expectedWalkways = cells.filter(({ terrain }) => terrain === "platform").length;
    const expectedLadders = cells.filter(
      ({ terrain, portalId }) => terrain === "ladder" && !portalId
    ).length;
    const models = staticArchitectureModels(WORLD_MAP);

    expect(models.filter(({ assetId }) => assetId === "walkway")).toHaveLength(expectedWalkways);
    expect(models.filter(({ assetId }) => assetId === "ladder")).toHaveLength(expectedLadders);
    expect(models.some(({ assetId }) => assetId === "passage")).toBe(true);
    expect(models.some(({ assetId }) => assetId === "ladder_shaft")).toBe(true);
    expect(models.some(({ assetId }) => assetId === "floor_hole")).toBe(true);
    const cellSize = mapViewFor(WORLD_MAP).pixelsPerUnit;
    const ladders = models.filter(({ assetId }) => assetId === "ladder");
    expect(ladders.every(({ width, height }) => width === cellSize && height === cellSize)).toBe(
      true
    );
    expect(
      models.filter(({ assetId }) => assetId !== "ladder").every(({ width }) => width > cellSize)
    ).toBe(true);
  });

  it("projects door state and leaves transition frames to presentation", () => {
    const states = initialPortalStates();
    const initial = doorArchitectureModels(WORLD_MAP, states);
    expect(initial.find(({ assetId }) => assetId === "core_door")?.open).toBe(false);
    expect(initial.find(({ assetId }) => assetId === "trapdoor")?.open).toBe(true);

    const coreState = states.washlock_to_core_door;
    states.washlock_to_core_door = {
      open: true,
      sealed: false,
      lastGasFlow: coreState?.lastGasFlow ?? 0,
      lastLiquidFlow: coreState?.lastLiquidFlow ?? 0,
    };
    expect(
      doorArchitectureModels(WORLD_MAP, states).find(({ assetId }) => assetId === "core_door")?.open
    ).toBe(true);
  });
});
