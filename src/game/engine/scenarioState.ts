import type { FacilityLoadout, GameDefinition, RouteIngressDefinition } from "../definitionTypes";
import type { GameState, LevelId } from "../types";
import type { HullFragment } from "../world/hullFragment";
import { materializeLevelSite, type MaterializedSite } from "../world/siteMaterialization";
import { isProcessLine, type WorldMap } from "../world/map";
import { facilityModelForMap } from "../world/derivedModel";
import { materializeRouteGraph } from "../world/routes";
import { validateWorldMap } from "../world/mapValidation";
import { createEncounter } from "../encounter/create";
import { RETAINED_PROCESS_BRIDGE } from "../encounter/processBridge";
import { campaignEncounterDefinition, combatDefinitionFor } from "./campaignEncounter";
import { assertValidGameState } from "./stateValidation";
export { freshRoomState } from "../encounter/processState";

const initialLineIds = (loadout: FacilityLoadout, hull: HullFragment | null): Set<string> =>
  new Set([
    ...Object.keys(loadout.gasConduits),
    ...Object.keys(loadout.liquidConduits),
    ...(hull ? Object.keys(hull.gasConduits) : []),
    ...(hull ? Object.keys(hull.liquidConduits) : []),
  ]);

const physicalConnections = (
  source: WorldMap,
  lineIds: ReadonlySet<string>
): WorldMap["connections"] =>
  Object.fromEntries(
    Object.entries(source.connections).filter(
      ([id, connection]) => !isProcessLine(connection) || lineIds.has(id)
    )
  );

const seedMissingLines = (
  connections: WorldMap["connections"],
  lineIds: ReadonlySet<string>,
  definition: GameDefinition
): void => {
  for (const id of lineIds) {
    const existing = connections[id];
    if (existing && isProcessLine(existing)) continue;
    if (existing) throw new Error(`Process line ${id} collides with an architectural connection.`);
    const blueprint = definition.lineBlueprints[id];
    if (!blueprint) throw new Error(`Installed conduit ${id} has no process-line blueprint.`);
    connections[id] = { ...blueprint, route: blueprint.route.map((target) => ({ ...target })) };
  }
};

const assertPhysicalTopology = (map: WorldMap): void => {
  const issues = validateWorldMap(map);
  if (issues.length === 0) return;
  const detail = issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
  throw new Error(`Physical scenario topology is invalid: ${detail}`);
};

/** A live map contains physical topology only; absent loadout entries never exist. */
const activeScenarioMap = (
  source: WorldMap,
  loadout: FacilityLoadout,
  hull: HullFragment | null,
  routes: readonly RouteIngressDefinition[],
  definition: GameDefinition
): WorldMap => {
  const installedIds = initialLineIds(loadout, hull);
  const connections = physicalConnections(source, installedIds);
  seedMissingLines(connections, installedIds, definition);
  const topologicalMap = { ...source, connections };
  const map = {
    ...topologicalMap,
    routeGraph: materializeRouteGraph(
      topologicalMap,
      routes,
      facilityModelForMap(topologicalMap).initialPortalStates()
    ),
  };
  assertPhysicalTopology(map);
  return Object.freeze(map);
};

const seedHullContents = (state: GameState, hull: HullFragment | null): void => {
  if (!hull) return;
  for (const [roomId, roomState] of Object.entries(hull.roomStates)) {
    const destination = state.encounter.process.rooms[roomId];
    if (destination) {
      destination.equipment = structuredClone(roomState.equipment);
      destination.stationary = structuredClone(roomState.stationary);
    }
  }
  for (const [id, conduit] of Object.entries(hull.gasConduits)) {
    const destination = state.encounter.process.gasConduits[id];
    if (destination) destination.enabled = conduit.enabled;
  }
  for (const [id, conduit] of Object.entries(hull.liquidConduits)) {
    const destination = state.encounter.process.liquidConduits[id];
    if (destination) destination.enabled = conduit.enabled;
  }
  state.encounter.towers = structuredClone(hull.towers);
  state.encounter.process.towerResources = structuredClone(hull.towerResources);
};

export interface CampaignCarryover {
  matter: number;
  coreIntegrity: number;
  retryCount: number;
  settledEncounterIds: string[];
}

export const createScenarioGame = (
  levelId: LevelId,
  completedLevelIds: LevelId[] = [],
  definition: GameDefinition,
  site: MaterializedSite = materializeLevelSite(definition, levelId, null),
  carryover: CampaignCarryover | null = null
): GameState => {
  const level = definition.levels[levelId];
  const map = activeScenarioMap(site.map, level.loadout, site.hull, level.routes, definition);
  const encounter = createEncounter(
    combatDefinitionFor(definition),
    campaignEncounterDefinition(definition, level, 0, map),
    RETAINED_PROCESS_BRIDGE
  );
  if (!encounter.process)
    throw new Error("Campaign encounter requires its configured process state.");
  const state: GameState = {
    version: 30,
    pack: { id: definition.packId, contentVersion: definition.contentVersion },
    phase: "level_briefing",
    campaign: {
      levelId: level.id,
      levelIndex: definition.levelOrder.indexOf(level.id),
      roundIndex: 0,
      completedLevelIds: completedLevelIds.map((completed) => definition.levels[completed].id),
      operationCheckpoint: null,
      retryCount: carryover?.retryCount ?? 0,
      settledEncounterIds: [...(carryover?.settledEncounterIds ?? [])],
    },
    encounter: { ...encounter, process: encounter.process },
    events: [
      {
        id: 1,
        levelId: level.id,
        round: 1,
        phase: "level_briefing",
        tone: "info",
        code: "scenario_started",
        parameters: {},
        roomId: null,
        elapsed: 0,
        incidentId: null,
      },
    ],
  };
  state.encounter.nextEventId = 2;
  if (carryover) {
    state.encounter.matter = carryover.matter;
    state.encounter.coreIntegrity = carryover.coreIntegrity;
  }
  seedHullContents(state, site.hull);
  assertValidGameState(state, definition);
  return state;
};

export const createInitialGame = (definition: GameDefinition): GameState => {
  const first = definition.levelOrder[0];
  if (!first) throw new Error("Campaign requires a first site.");
  return createScenarioGame(first, [], definition);
};
