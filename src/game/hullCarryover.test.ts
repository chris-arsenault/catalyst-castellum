import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame, WORLD_MAP } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import { decodeGame, encodeGame } from "./persistence/saveCodec";
import { extractHullFragment } from "./world/hullFragment";
import { produceAuthoredSite } from "./world/producer";
import type { MapRoom, WorldMap } from "./world/map";
import { roomState } from "./world/instances";

const HULL_ROOMS = ["switchyard", "furnace"] as const;

/** Site A: today's world with the player's two-room castellum tagged as hull. */
const mapA: WorldMap = Object.freeze({
  ...WORLD_MAP,
  rooms: Object.fromEntries(
    Object.entries(WORLD_MAP.rooms).map(([roomId, room]) => [
      roomId,
      HULL_ROOMS.includes(roomId as (typeof HULL_ROOMS)[number])
        ? ({ ...room, provenance: "hull" } as MapRoom)
        : room,
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
    Object.entries(WORLD_MAP.rooms).filter(
      ([roomId]) => !HULL_ROOMS.includes(roomId as (typeof HULL_ROOMS)[number])
    )
  ),
  connections: Object.fromEntries(
    Object.entries(WORLD_MAP.connections).filter(
      ([, connection]) => !hullInternal(connection.rooms)
    )
  ),
});

const definition = deriveGame(DEFAULT_GAME_DEFINITION, { map: mapA });

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

  it("plays two sites in sequence with the hull and all its contents intact", () => {
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
    expect(roomState(next, "furnace").gas.lower.hydrogen).toBe(9);
    expect(roomState(next, "switchyard").liquid.water).toBe(4);
    expect(next.run.position).toBe(definition.levelOrder.indexOf("make_the_reagent"));
  });
});

describe("the carried hull persists and translates", () => {
  it("round-trips the carried hull through the v13 save on the second site", () => {
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
    expect(roomState(decoded, "furnace").gas.lower.hydrogen).toBe(9);
    expect(decoded.run).toEqual(next.run);
  });

  it("translates hull geometry when the anchor moves", () => {
    const ending = createScenarioGame("flash_point", [], definition);
    const fragment = extractHullFragment(ending);
    // A site that anchors the hull elsewhere must author its hull-facing connections
    // against that anchor; this one has none, so any legal offset embeds.
    const detachedMapB: WorldMap = Object.freeze({
      ...mapB,
      width: mapB.width + 6,
      connections: Object.fromEntries(
        Object.entries(mapB.connections).filter(([, connection]) =>
          connection.rooms.every(
            (roomId) => !HULL_ROOMS.includes(roomId as (typeof HULL_ROOMS)[number])
          )
        )
      ),
    });
    const site = produceAuthoredSite(
      {
        map: detachedMapB,
        rounds: definition.levels.make_the_reagent.rounds,
        hullAnchor: { columns: 6, elevations: 0 },
      },
      fragment
    );
    const shifted = site.map.rooms.furnace;
    expect(shifted?.bounds.column).toBe(WORLD_MAP.rooms.furnace!.bounds.column + 6);
    expect(site.hull?.gasConduits).toEqual(fragment.gasConduits);
  });
});
