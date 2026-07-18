import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame, WORLD_MAP } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import type { LevelDefinition } from "./definitionTypes";
import { decodeGame, encodeGame } from "./persistence/saveCodec";
import { extractHullFragment } from "./world/hullFragment";
import { produceAuthoredSite } from "./world/producer";
import type { MapRoom, WorldMap } from "./world/map";
import { roomState } from "./world/instances";

const HULL_ROOMS = ["switchyard", "furnace"] as const;

const isHull = (roomId: string): boolean =>
  HULL_ROOMS.includes(roomId as (typeof HULL_ROOMS)[number]);

/**
 * Site A normalizes provenance so the test owns its hull set exactly (independent of
 * the pack's own seed hull): every room site except the two the player carries.
 */
const mapA: WorldMap = Object.freeze({
  ...WORLD_MAP,
  rooms: Object.fromEntries(
    Object.entries(WORLD_MAP.rooms).map(([roomId, room]) => [
      roomId,
      { ...room, provenance: isHull(roomId) ? "hull" : "site" } as MapRoom,
    ])
  ),
});

/**
 * Site B: the next dock. Hull rooms and their internal connections are absent (they
 * travel with the player); connections with one hull endpoint stay authored on the
 * site, dangling until the producer embeds the hull at the anchor.
 */
const hullInternal = (connectionRooms: readonly string[]): boolean =>
  connectionRooms.every((roomId) => HULL_ROOMS.includes(roomId as (typeof HULL_ROOMS)[number]));

const mapB: WorldMap = Object.freeze({
  ...WORLD_MAP,
  rooms: Object.fromEntries(
    Object.entries(WORLD_MAP.rooms)
      .filter(([roomId]) => !isHull(roomId))
      .map(([roomId, room]) => [roomId, { ...room, provenance: "site" } as MapRoom])
  ),
  connections: Object.fromEntries(
    Object.entries(WORLD_MAP.connections).filter(
      ([, connection]) => !hullInternal(connection.rooms)
    )
  ),
});

const makeReagentWithoutGeneratedSite: LevelDefinition = {
  ...DEFAULT_GAME_DEFINITION.levels.make_the_reagent,
  site: null,
};

const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
  map: mapA,
  levels: {
    ...DEFAULT_GAME_DEFINITION.levels,
    make_the_reagent: makeReagentWithoutGeneratedSite,
  },
});

describe("the hull fragment carries across consecutive authored maps", () => {
  it("extracts hull rooms, internal connections, and live contents from an ending state", () => {
    const ending = createScenarioGame("flash_point", [], definition);
    roomState(ending, "furnace").equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 2,
      enabled: true,
    };
    roomState(ending, "furnace").gas.lower.hydrogen = 9;
    roomState(ending, "switchyard").liquid.water = 4;

    const fragment = extractHullFragment(ending);
    expect(Object.keys(fragment.rooms).sort()).toEqual([...HULL_ROOMS].sort());
    expect(Object.keys(fragment.connections)).toEqual(["switchyard_to_furnace_shaft"]);
    expect(fragment.roomStates.furnace?.equipment.socket_a?.equipmentId).toBe("gas_agitator");
    expect(fragment.roomStates.furnace?.gas.lower.hydrogen).toBe(9);
    expect(fragment.roomStates.switchyard?.liquid.water).toBe(4);
  });

  it("plays two sites in sequence with hull installations intact and fresh interiors", () => {
    const ending = createScenarioGame("flash_point", [], definition);
    roomState(ending, "furnace").equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 2,
      enabled: true,
    };
    roomState(ending, "furnace").gas.lower.hydrogen = 9;
    roomState(ending, "switchyard").liquid.water = 4;

    const fragment = extractHullFragment(ending);
    const site = produceAuthoredSite(
      {
        map: mapB,
        rounds: definition.levels.make_the_reagent.rounds,
        hullAnchor: { columns: 0, elevations: 0 },
      },
      fragment
    );
    const next = createScenarioGame("make_the_reagent", ["flash_point"], definition, site);

    expect(Object.keys(next.map.rooms).sort()).toEqual(Object.keys(mapA.rooms).sort());
    expect(next.map.rooms.furnace?.provenance).toBe("hull");
    expect(next.map.connections.switchyard_to_furnace_shaft).toBeDefined();
    expect(roomState(next, "furnace").equipment.socket_a?.equipmentId).toBe("gas_agitator");
    expect(roomState(next, "furnace").gas.lower.hydrogen).toBe(0);
    expect(roomState(next, "switchyard").liquid.water).toBe(0);
    expect(next.run.position).toBe(definition.levelOrder.indexOf("make_the_reagent"));
  });
});

describe("the carried hull persists and translates", () => {
  it("round-trips the carried hull through the current save on the second site", () => {
    const ending = createScenarioGame("flash_point", [], definition);
    roomState(ending, "furnace").gas.lower.hydrogen = 9;
    const fragment = extractHullFragment(ending);
    const site = produceAuthoredSite(
      {
        map: mapB,
        rounds: definition.levels.make_the_reagent.rounds,
        hullAnchor: { columns: 0, elevations: 0 },
      },
      fragment
    );
    const next = createScenarioGame("make_the_reagent", ["flash_point"], definition, site);
    const decoded = decodeGame(encodeGame(next, definition), definition);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.map.rooms.furnace?.provenance).toBe("hull");
    expect(roomState(decoded, "furnace").gas.lower.hydrogen).toBe(0);
    expect(decoded.run).toEqual(next.run);
  });

  it("translates hull geometry when the anchor moves", () => {
    const ending = createScenarioGame("flash_point", [], definition);
    const fragment = extractHullFragment(ending);
    // A sparse site with room to dock the hull far from its old coordinates.
    const sparseSite: WorldMap = Object.freeze({
      ...mapB,
      width: 120,
      rooms: { core: mapB.rooms.core! },
      connections: {},
      utilityNodes: mapB.utilityNodes,
    });
    const site = produceAuthoredSite(
      {
        map: sparseSite,
        rounds: definition.levels.make_the_reagent.rounds,
        hullAnchor: { columns: 70, elevations: 0 },
      },
      fragment
    );
    const shifted = site.map.rooms.furnace;
    expect(shifted?.bounds.column).toBe(WORLD_MAP.rooms.furnace!.bounds.column + 70);
    expect(site.hull?.gasConduits).toEqual(fragment.gasConduits);
  });
});
