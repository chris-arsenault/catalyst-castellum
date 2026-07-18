import { describe, expect, it } from "vitest";
import { WORLD_MAP } from "../../game/content/worldMap";
import { facilityModelForMap } from "../../game/world/derivedModel";
import { architecturalConnections } from "../../game/world/map";
import {
  roomClosureModels,
  roomSectionAssembly,
  type RoomSectionSpriteModel,
} from "./roomSectionRenderModel";
import { ROOM_SECTION_DISPLAY_SIZE, ROOM_SECTION_SPRITE_IDS } from "./roomSectionSprites";

const idsAreUnique = (models: readonly RoomSectionSpriteModel[]): boolean =>
  new Set(models.map(({ id }) => id)).size === models.length;

describe("topology-derived room section assembly", () => {
  it("tiles every non-Core room interior and every connector span exactly once", () => {
    const rooms = Object.values(WORLD_MAP.rooms).filter(({ structure }) => structure !== "core");
    const expectedBackPanels = rooms.reduce(
      (total, { bounds }) => total + bounds.width * bounds.height,
      0
    );
    const portals = architecturalConnections(WORLD_MAP);
    const expectedSpans = portals.reduce(
      (total, { connectorCells }) => total + connectorCells.length,
      0
    );
    const expectedMouths = portals.reduce(
      (total, portal) =>
        total +
        portal.rooms.filter((roomId) => WORLD_MAP.rooms[roomId]?.structure !== "core").length,
      0
    );
    const assembly = roomSectionAssembly(WORLD_MAP);
    const backPanels = assembly.background.filter(({ id }) => id.startsWith("back:"));
    const spans = assembly.background.filter(({ id }) => id.startsWith("portal-span:"));
    const mouths = assembly.background.filter(({ id }) => id.startsWith("portal-mouth:"));

    expect(backPanels).toHaveLength(expectedBackPanels);
    expect(spans).toHaveLength(expectedSpans);
    expect(mouths).toHaveLength(expectedMouths);
    expect(assembly.background.some(({ id }) => id.startsWith("back:core:"))).toBe(false);
    expect(idsAreUnique(assembly.background)).toBe(true);
  });

  it("replaces boundary tiles with integrated frames and completes the Core socket", () => {
    const portals = architecturalConnections(WORLD_MAP);
    const expectedFrames = portals.reduce(
      (total, portal) =>
        total +
        portal.rooms.filter(
          (roomId) => WORLD_MAP.rooms[roomId]?.structure !== "core" || portal.kind === "core_door"
        ).length,
      0
    );
    const foreground = roomSectionAssembly(WORLD_MAP).foreground;
    const frames = foreground.filter(({ id }) => id.startsWith("portal-frame:"));
    const assets = new Set(ROOM_SECTION_SPRITE_IDS);

    expect(frames).toHaveLength(expectedFrames);
    expect(frames.filter(({ assetId }) => assetId.includes("core_door"))).toHaveLength(2);
    expect(frames.filter(({ assetId }) => assetId.includes("trapdoor"))).toHaveLength(2);
    expect(foreground.filter(({ id }) => id.startsWith("corner:"))).toHaveLength(28);
    expect(foreground.every(({ assetId }) => assets.has(assetId))).toBe(true);
    expect(
      foreground.every(
        ({ width, height }) =>
          width === ROOM_SECTION_DISPLAY_SIZE && height === ROOM_SECTION_DISPLAY_SIZE
      )
    ).toBe(true);
    expect(idsAreUnique(foreground)).toBe(true);
  });

  it("caches static assembly while deriving closure state from live portal state", () => {
    expect(roomSectionAssembly(WORLD_MAP)).toBe(roomSectionAssembly(WORLD_MAP));
    const states = facilityModelForMap(WORLD_MAP).initialPortalStates();
    const initial = roomClosureModels(WORLD_MAP, states);

    expect(initial.map(({ assetId }) => assetId).sort()).toEqual([
      "core_door_leaf",
      "trapdoor_leaf",
    ]);
    expect(initial.find(({ assetId }) => assetId === "core_door_leaf")?.open).toBe(false);
    expect(initial.find(({ assetId }) => assetId === "trapdoor_leaf")?.open).toBe(true);

    const trapdoorId = "reservoir_to_gallery_trapdoor";
    const closed = roomClosureModels(WORLD_MAP, {
      ...states,
      [trapdoorId]: { ...states[trapdoorId]!, open: false },
    });
    expect(closed.find(({ assetId }) => assetId === "trapdoor_leaf")?.open).toBe(false);
  });
});

describe("provenance-aware room assembly", () => {
  it("gives hull rooms their own palette, lived-in details, and a Core-side door socket", () => {
    const assembly = roomSectionAssembly(WORLD_MAP);
    const washlockBack = assembly.background.filter(({ id }) => id.startsWith("back:washlock:"));
    const switchyardBack = assembly.background.filter(({ id }) =>
      id.startsWith("back:switchyard:")
    );
    const washlockBoundary = assembly.foreground.filter(({ id }) =>
      id.startsWith("boundary:washlock:")
    );
    const washlockDropFrame = assembly.foreground.find(
      ({ id }) => id === "portal-frame:lower_intake_to_washlock_drop:washlock"
    );
    const washlockDropMouth = assembly.background.find(
      ({ id }) => id === "portal-mouth:lower_intake_to_washlock_drop:washlock"
    );
    const washlockDropSpans = assembly.background.filter(({ id }) =>
      id.startsWith("portal-span:lower_intake_to_washlock_drop:")
    );

    expect(washlockBack.every(({ assetId }) => assetId.includes("_hull_"))).toBe(true);
    expect(switchyardBack.every(({ assetId }) => !assetId.includes("hull"))).toBe(true);
    expect(washlockBoundary.every(({ assetId }) => assetId.endsWith("_hull"))).toBe(true);
    expect(washlockDropFrame?.assetId).toBe("ceiling_hole_hull");
    expect(washlockDropMouth?.assetId).toBe("vertical_hole_span_hull");
    expect(washlockDropSpans.every(({ assetId }) => assetId === "vertical_hole_span_hull")).toBe(
      true
    );
    expect(
      assembly.background.filter(({ id }) => id.startsWith("hull-detail:washlock:"))
    ).toHaveLength(2);
    expect(
      assembly.foreground.filter(({ id }) => id.startsWith("portal-core-mouth:"))
    ).toHaveLength(1);
  });
});
