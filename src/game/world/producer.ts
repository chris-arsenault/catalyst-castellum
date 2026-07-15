import type { GameDefinition, RoundDefinition } from "../definitionTypes";
import type { LevelId } from "../types";
import type { HullFragment, HullOffset } from "./hullFragment";
import { embedHullFragment, shiftFragmentStateRoutes } from "./hullFragment";
import type { WorldMap } from "./map";

/**
 * Map production is a pre-level pipeline (ADR-0001): a producer takes a site spec and
 * the player's hull fragment and returns a validated Map plus the site's waves. The
 * simulation consumes the output and never composes hull and site itself. Producers
 * are interchangeable; this module ships the authored one.
 */
export interface SiteSpec {
  map: WorldMap;
  rounds: readonly RoundDefinition[];
  /** Where the incoming hull fragment translates onto this site's grid. */
  hullAnchor: HullOffset;
}

export interface ProducedSite {
  map: WorldMap;
  rounds: readonly RoundDefinition[];
  /** The embedded fragment (routes shifted) whose contents seed the scenario. */
  hull: HullFragment | null;
}

const emptyHull = (hull: HullFragment | null): boolean =>
  !hull || Object.keys(hull.rooms).length === 0;

/**
 * The hull's rooms belong to the player, so the site map must not also supply them:
 * strip any room (and its map data) the incoming hull provides before embedding.
 * For an empty hull nothing is stripped, so the site map flows through untouched.
 */
const siteWithoutHull = (spec: SiteSpec, hull: HullFragment): SiteSpec => {
  const rooms = { ...spec.map.rooms };
  const connections = { ...spec.map.connections };
  for (const roomId of Object.keys(hull.rooms)) delete rooms[roomId];
  for (const connectionId of Object.keys(hull.connections)) delete connections[connectionId];
  return { ...spec, map: { ...spec.map, rooms, connections } };
};

export const produceAuthoredSite = (spec: SiteSpec, hull: HullFragment | null): ProducedSite => {
  if (emptyHull(hull) || !hull) {
    // Identity for hull-less sites: the script's frozen map object flows through, so
    // derived-geometry caches and the determinism snapshot see the same world.
    return { map: spec.map, rounds: spec.rounds, hull: null };
  }
  const siteSpec = siteWithoutHull(spec, hull);
  return {
    map: embedHullFragment(siteSpec.map, hull, siteSpec.hullAnchor),
    rounds: siteSpec.rounds,
    hull: shiftFragmentStateRoutes(hull, siteSpec.hullAnchor),
  };
};

/** The pack's levels as authored site specs (M6 re-authors these per site). */
export const authoredSiteSpec = (definition: GameDefinition, levelId: LevelId): SiteSpec => ({
  map: definition.map,
  rounds: definition.levels[levelId].rounds,
  hullAnchor: { columns: 0, elevations: 0 },
});
