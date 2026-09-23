import type { WorldMap } from "../world/map";
import type { ProcessDefinition, ProcessSimulationDefinition } from "./processTypes";

export const processDefinitionForMap = (
  definition: ProcessDefinition,
  map: WorldMap
): ProcessSimulationDefinition => ({ ...definition, map });
