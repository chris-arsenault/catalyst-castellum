import type { GameDefinition } from "../definitionTypes";
import type { WorldMap } from "./map";

/**
 * Content catalogs are pack-owned; topology is state-owned after a producer runs.
 * Bind the active map without mutating or recompiling the frozen pack definition.
 */
export const definitionForMap = (definition: GameDefinition, map: WorldMap): GameDefinition =>
  definition.map === map ? definition : { ...definition, map };
