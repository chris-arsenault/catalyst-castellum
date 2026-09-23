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
  state.encounter.map = map;
  state.encounter.mapRevision += 1;
  state.encounter.world = worldCatalogsForMap(map);
  state.encounter.process.rooms = keepRecords(
    state.encounter.process.rooms,
    state.encounter.world.rooms
  );
  state.encounter.process.gasJunctions = keepRecords(
    state.encounter.process.gasJunctions,
    state.encounter.world.rooms
  );
  state.encounter.process.liquidJunctions = keepRecords(
    state.encounter.process.liquidJunctions,
    state.encounter.world.rooms
  );
  state.encounter.process.gasConduits = keepRecords(
    state.encounter.process.gasConduits,
    state.encounter.world.connections
  );
  state.encounter.process.liquidConduits = keepRecords(
    state.encounter.process.liquidConduits,
    state.encounter.world.connections
  );
  state.encounter.portalStates = keepRecords(
    state.encounter.portalStates,
    state.encounter.world.connections
  );
};
