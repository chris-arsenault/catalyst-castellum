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

export const produceAuthoredSite = (spec: SiteSpec, hull: HullFragment | null): ProducedSite => {
  if (emptyHull(hull) || !hull) {
    // Identity for hull-less sites: the script's frozen map object flows through, so
    // derived-geometry caches and the determinism snapshot see the same world.
    return { map: spec.map, rounds: spec.rounds, hull: null };
  }
  return {
    map: embedHullFragment(spec.map, hull, spec.hullAnchor),
    rounds: spec.rounds,
    hull: shiftFragmentStateRoutes(hull, spec.hullAnchor),
  };
};

/** The pack's levels as authored site specs (M6 re-authors these per site). */
export const authoredSiteSpec = (definition: GameDefinition, levelId: LevelId): SiteSpec => ({
  map: definition.map,
  rounds: definition.levels[levelId].rounds,
  hullAnchor: { columns: 0, elevations: 0 },
});
