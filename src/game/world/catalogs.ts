import type { GameDefinition } from "../definitionTypes";
import type { WorldCatalogs } from "../gameStateTypes";

/**
 * World catalogs are pack-derived while topology is pack-static; they are rebuilt from
 * the definition at scenario creation and save decode rather than serialized. The
 * mutable-Map save (plan M4) takes ownership when topology becomes player-editable.
 */
export const worldCatalogsFor = (definition: GameDefinition): WorldCatalogs => ({
  rooms: [...definition.roomOrder],
  connections: Object.keys(definition.transportRuns),
});
