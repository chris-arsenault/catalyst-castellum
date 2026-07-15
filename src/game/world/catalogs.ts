import type { GameDefinition } from "../definitionTypes";
import type { WorldCatalogs } from "../gameStateTypes";
import type { WorldMap } from "./map";

/**
 * World catalogs derive from whichever map the state runs on; iteration order is the
 * map's insertion order (ADR-0002 — iteration order is simulation order).
 */
export const worldCatalogsForMap = (map: WorldMap): WorldCatalogs => ({
  rooms: Object.keys(map.rooms),
  connections: Object.keys(map.connections),
});

export const worldCatalogsFor = (definition: GameDefinition): WorldCatalogs =>
  worldCatalogsForMap(definition.map);
