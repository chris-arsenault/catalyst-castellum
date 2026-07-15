import type { FacilityModel } from "../definitionTypes";
import type { GameState } from "../gameStateTypes";
import { createFacilityModel } from "../engine/facilityModel";
import type { WorldMap } from "./map";

const modelCache = new WeakMap<WorldMap, FacilityModel>();

/**
 * Map-derived geometry (plan M2): the facility model is a pure derivation of the
 * state's map, cached per map object. Clones share their map reference, so a whole
 * session reuses one model until a map edit (plan M3) replaces the object and bumps
 * `mapRevision`.
 */
export const facilityModelForMap = (map: WorldMap): FacilityModel => {
  const cached = modelCache.get(map);
  if (cached) return cached;
  const model = createFacilityModel(map);
  modelCache.set(map, model);
  return model;
};

export const facilityModelFor = (state: GameState): FacilityModel => facilityModelForMap(state.map);
