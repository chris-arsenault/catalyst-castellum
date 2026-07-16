import type { GameState } from "../types";
import { worldCatalogsForMap } from "../world/catalogs";
import type { WorldMap } from "../world/map";

const keepRecords = <Value>(
  records: Readonly<Record<string, Value>>,
  ids: readonly string[]
): Record<string, Value> =>
  Object.fromEntries(ids.flatMap((id) => (records[id] ? [[id, records[id]]] : []))) as Record<
    string,
    Value
  >;

/** Replace map geometry and discard runtime records owned by the departed site. */
export const replaceStateMap = (state: GameState, map: WorldMap): void => {
  state.map = map;
  state.mapRevision += 1;
  state.world = worldCatalogsForMap(map);
  state.rooms = keepRecords(state.rooms, state.world.rooms);
  state.gasJunctions = keepRecords(state.gasJunctions, state.world.rooms);
  state.liquidJunctions = keepRecords(state.liquidJunctions, state.world.rooms);
  state.gasConduits = keepRecords(state.gasConduits, state.world.connections);
  state.liquidConduits = keepRecords(state.liquidConduits, state.world.connections);
  state.portalStates = keepRecords(state.portalStates, state.world.connections);
};
