import type { GameDefinition, RoundDefinition } from "../definitionTypes";
import type { LevelId } from "../types";
import type { HullFragment, HullOffset } from "./hullFragment";
import {
  alignHullFragmentToMap,
  hullLayoutFromMap,
  shiftFragmentStateRoutes,
} from "./hullFragment";
import type { WorldMap } from "./map";
import { generateSiteLayoutCandidates } from "./siteGenerator";
import { layoutHullAtAuthoredSite } from "./authoredHullLayout";

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
  seed: string;
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
  const utilityNodes = { ...spec.map.utilityNodes };
  for (const roomId of Object.keys(hull.rooms)) delete rooms[roomId];
  for (const connectionId of Object.keys(hull.connections)) delete connections[connectionId];
  for (const utilityNodeId of Object.keys(hull.utilityNodes)) delete utilityNodes[utilityNodeId];
  return { ...spec, map: { ...spec.map, rooms, connections, utilityNodes } };
};

export const produceAuthoredSite = (spec: SiteSpec, hull: HullFragment | null): ProducedSite => {
  if (emptyHull(hull) || !hull) {
    // Identity for hull-less sites: the script's frozen map object flows through, so
    // derived-geometry caches and the determinism snapshot see the same world.
    return { map: spec.map, rounds: spec.rounds, hull: null, seed: "authored" };
  }
  const siteSpec = siteWithoutHull(spec, hull);
  const layout = layoutHullAtAuthoredSite(siteSpec.map, hull, siteSpec.hullAnchor);
  return {
    map: layout.map,
    rounds: siteSpec.rounds,
    hull: layout.hull,
    seed: "authored",
  };
};

/** The pack's levels as authored site specs (M6 re-authors these per site). */
export const authoredSiteSpec = (definition: GameDefinition, levelId: LevelId): SiteSpec => ({
  map: {
    ...definition.map,
    connections: {
      ...definition.map.connections,
      ...Object.fromEntries(
        [
          ...Object.keys(definition.levels[levelId].loadout.gasConduits),
          ...Object.keys(definition.levels[levelId].loadout.liquidConduits),
        ].map((id) => {
          const blueprint = definition.lineBlueprints[id];
          if (!blueprint) throw new Error(`Level ${levelId} has no line blueprint for ${id}.`);
          return [id, blueprint];
        })
      ),
    },
  },
  rounds: definition.levels[levelId].rounds,
  hullAnchor: { columns: 0, elevations: 0 },
});

/**
 * One production entry point for scenario creation and docking. Tutorial-generated
 * sites use a fixed seed; an isolated scenario receives the pack's fresh seed hull.
 */
export const produceLevelSite = (
  definition: GameDefinition,
  levelId: LevelId,
  incomingHull: HullFragment | null
): ProducedSite => {
  const level = definition.levels[levelId];
  const hull = incomingHull
    ? alignHullFragmentToMap(incomingHull, definition.map)
    : hullLayoutFromMap(definition.map);
  if (!level.site)
    return produceAuthoredSite(
      authoredSiteSpec(definition, levelId),
      incomingHull ? hull : incomingHull
    );
  const candidate = generateSiteLayoutCandidates(level.site.spec, hull, {
    seed: level.site.seed,
    count: 1,
  })[0];
  if (!candidate) throw new Error(`${level.site.spec.id} produced no dockable site candidate.`);
  return {
    map: candidate.map,
    rounds: level.rounds,
    hull: shiftFragmentStateRoutes(hull, level.site.spec.hullAnchor),
    seed: `${level.site.spec.id}:${candidate.seed}`,
  };
};
