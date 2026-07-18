import { describe, expect, it } from "vitest";
import { WORLD_MAP } from "../../game/content/worldMap";
import { facilityModelForMap } from "../../game/world/derivedModel";
import { mapViewFor } from "./mapGeometry";
import { staticArchitectureModels } from "./architectureRenderModel";

describe("illustrated architecture projection", () => {
  it("projects interior platforms as oversized art and tiles ladders within their cells", () => {
    const cells = facilityModelForMap(WORLD_MAP).cells();
    const expectedWalkways = cells.filter(({ terrain }) => terrain === "platform").length;
    const expectedLadders = cells.filter(
      ({ terrain, portalId }) => terrain === "ladder" && !portalId
    ).length;
    const expectedHullLadders = cells.filter(
      ({ terrain, portalId, roomId }) =>
        terrain === "ladder" &&
        !portalId &&
        roomId !== null &&
        WORLD_MAP.rooms[roomId]?.provenance === "hull"
    ).length;
    const models = staticArchitectureModels(WORLD_MAP);

    expect(models.filter(({ assetId }) => assetId.startsWith("walkway"))).toHaveLength(
      expectedWalkways
    );
    expect(models.filter(({ assetId }) => assetId.startsWith("ladder"))).toHaveLength(
      expectedLadders
    );
    expect(models.filter(({ assetId }) => assetId === "ladder_hull")).toHaveLength(
      expectedHullLadders
    );
    const cellSize = mapViewFor(WORLD_MAP).pixelsPerUnit;
    const ladders = models.filter(({ assetId }) => assetId.startsWith("ladder"));
    expect(ladders.every(({ width, height }) => width === cellSize && height === cellSize)).toBe(
      true
    );
    expect(
      models
        .filter(({ assetId }) => !assetId.startsWith("ladder"))
        .every(({ width }) => width > cellSize)
    ).toBe(true);
  });
});
