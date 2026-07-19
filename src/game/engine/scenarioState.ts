import { facilityModelForMap } from "../world/derivedModel";
import type { FacilityLoadout } from "../definitionTypes";
import { emptyGas, emptyLiquid, emptyStationary } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import {
  GAS_TYPES,
  type GameState,
  type GasAmounts,
  type LevelId,
  type ReactionTelemetry,
  type RoomId,
  type RoomReactionId,
  type RoomState,
} from "../types";
import { createEquipmentInstance, emptyRoomEquipment, roomEquipmentVolume } from "./equipment";
import { makeStats } from "./events";
import { kelvin, STANDARD_TEMPERATURE } from "./physics";
import { assertValidGameState } from "./stateValidation";
import { worldCatalogsForMap } from "../world/catalogs";
import type { HullFragment } from "../world/hullFragment";
import { produceLevelSite, type ProducedSite } from "../world/producer";
import type { RoundDefinition } from "../definitionTypes";
import { isProcessLine, type WorldMap } from "../world/map";
import { maybeLineDefinition, processLineIds } from "../world/instances";
import { definitionRoom } from "../world/instances";
import { validateWorldMap } from "../world/mapValidation";

const emptyTelemetry = (): ReactionTelemetry => ({
  lastRate: 0,
  direction: "idle",
  limitingFactor: { kind: "condition", code: "conditions", zone: null },
});

const emptyRoomReactions = (
  definition: GameDefinition
): Record<RoomReactionId, ReactionTelemetry> =>
  Object.fromEntries(
    Object.values(definition.reactions)
      .filter(({ behavior }) => behavior.kind !== "electrolysis")
      .map(({ id }) => [id, emptyTelemetry()])
  ) as Record<RoomReactionId, ReactionTelemetry>;

const makeRoom = (
  id: RoomId,
  loadout: FacilityLoadout,
  definition: GameDefinition,
  map: WorldMap
): RoomState => {
  const ambient = definition.ambientGas;
  const equipment = emptyRoomEquipment();
  const scenarioEquipment = loadout.equipment[id];
  if (scenarioEquipment) {
    for (const [socketId, instance] of Object.entries(scenarioEquipment)) {
      if (instance)
        equipment[socketId as keyof typeof equipment] = createEquipmentInstance(
          instance,
          definition
        );
    }
  }
  const temperature =
    loadout.initialTemperatures[id] ?? definitionRoom({ map }, id).ambientTemperature;
  const usableVolume = Math.max(
    8,
    facilityModelForMap(map).roomVolume(id) - roomEquipmentVolume({ equipment }, definition)
  );
  // A newly excavated room starts at the same ambient pressure even when its authored
  // temperature or usable geometry differs. Gas inventory therefore scales with both
  // free volume and absolute temperature, rather than assuming every room is 100 units at 22 °C.
  const ambientReferenceAmount = GAS_TYPES.reduce((total, gas) => total + ambient[gas], 0);
  const ambientScale =
    (usableVolume / ambientReferenceAmount) * (kelvin(STANDARD_TEMPERATURE) / kelvin(temperature));
  return {
    id,
    gas: {
      lower: Object.fromEntries(
        GAS_TYPES.map((gas) => [gas, (ambient[gas] * ambientScale) / 2])
      ) as GasAmounts,
      upper: Object.fromEntries(
        GAS_TYPES.map((gas) => [gas, (ambient[gas] * ambientScale) / 2])
      ) as GasAmounts,
    },
    gasTemperature: { lower: temperature, upper: temperature },
    liquid: emptyLiquid(),
    stationary: { ...emptyStationary(), ...loadout.stationary[id] },
    temperature,
    residue: 0,
    reactionIntensity: 0,
    pressurePulse: 0,
    flashCooldown: { lower: 0, upper: 0 },
    combustionCount: 0,
    reactions: emptyRoomReactions(definition),
    equipment,
  };
};

/** A just-grafted room's state: ambient contents, no loadout. */
export const freshRoomState = (id: RoomId, definition: GameDefinition, map: WorldMap): RoomState =>
  makeRoom(id, emptyFacilityLoadout(), definition, map);

const emptyFacilityLoadout = (): FacilityLoadout => ({
  equipment: {},
  initialTemperatures: {},
  gasConduits: {},
  liquidConduits: {},
  stationary: {},
});

const makeRooms = (
  loadout: FacilityLoadout,
  definition: GameDefinition,
  map: WorldMap
): Record<RoomId, RoomState> =>
  Object.fromEntries(
    Object.keys(map.rooms).map((id) => [id, makeRoom(id, loadout, definition, map)])
  ) as Record<RoomId, RoomState>;

const makeGasSources = (levelId: LevelId, definition: GameDefinition): GameState["gasSources"] =>
  Object.fromEntries(
    definition.levels[levelId].supplies.flatMap((supply) =>
      supply.phase === "gas" ? [[supply.id, { gas: { ...emptyGas(), ...supply.initial } }]] : []
    )
  ) as GameState["gasSources"];

const makeLiquidSources = (
  levelId: LevelId,
  definition: GameDefinition
): GameState["liquidSources"] =>
  Object.fromEntries(
    definition.levels[levelId].supplies.flatMap((supply) =>
      supply.phase === "liquid"
        ? [[supply.id, { liquid: { ...emptyLiquid(), ...supply.initial } }]]
        : []
    )
  ) as GameState["liquidSources"];

const makeGasJunctions = (map: WorldMap): GameState["gasJunctions"] =>
  Object.fromEntries(
    Object.keys(map.rooms).map((roomId) => [roomId, { gas: emptyGas(), temperature: 22 }])
  ) as GameState["gasJunctions"];

const makeLiquidJunctions = (map: WorldMap): GameState["liquidJunctions"] =>
  Object.fromEntries(
    Object.keys(map.rooms).map((roomId) => [roomId, { liquid: emptyLiquid() }])
  ) as GameState["liquidJunctions"];

const makeGasConduits = (loadout: FacilityLoadout, map: WorldMap): GameState["gasConduits"] =>
  Object.fromEntries(
    processLineIds({ map }, "gas_line").map((runId) => {
      const definition = maybeLineDefinition({ map }, runId, "gas");
      const configured = loadout.gasConduits[runId];
      return [
        runId,
        {
          enabled: configured?.enabled ?? false,
          route: definition ? definition.route.map((cell) => ({ ...cell })) : [],
          gas: { ...emptyGas(), ...(configured?.gas ?? {}) },
          temperature: 22,
          lastFlow: 0,
          lastSpeciesFlow: emptyGas(),
          blocked: false,
          flowCause: "idle",
        },
      ];
    })
  ) as GameState["gasConduits"];

const makeLiquidConduits = (loadout: FacilityLoadout, map: WorldMap): GameState["liquidConduits"] =>
  Object.fromEntries(
    processLineIds({ map }, "liquid_line").map((runId) => {
      const definition = maybeLineDefinition({ map }, runId, "liquid");
      const configured = loadout.liquidConduits[runId];
      return [
        runId,
        {
          enabled: configured?.enabled ?? false,
          route: definition ? definition.route.map((cell) => ({ ...cell })) : [],
          liquid: { ...emptyLiquid(), ...(configured?.liquid ?? {}) },
          lastFlow: 0,
          lastSpeciesFlow: emptyLiquid(),
          blocked: false,
          flowCause: "idle",
        },
      ];
    })
  ) as GameState["liquidConduits"];

const copyAvailability = (
  availability: RoundDefinition["availability"]
): GameState["availability"] => ({
  equipment: [...availability.equipment],
  gasLines: [...availability.gasLines],
  liquidLines: [...availability.liquidLines],
});

const scenarioStartedEvent = (levelId: LevelId): GameState["events"][number] => ({
  id: 1,
  levelId,
  round: 1,
  phase: "level_briefing",
  tone: "info",
  code: "scenario_started",
  parameters: {},
  roomId: null,
  elapsed: 0,
  incidentId: null,
});

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

const sharesConnectionRecords = (source: WorldMap, connections: WorldMap["connections"]): boolean =>
  Object.keys(connections).length === Object.keys(source.connections).length &&
  Object.keys(connections).every((id) => connections[id] === source.connections[id]);

/** A live map contains physical topology only; absent loadout entries never exist. */
const activeScenarioMap = (
  source: WorldMap,
  loadout: FacilityLoadout,
  hull: HullFragment | null,
  definition: GameDefinition
): WorldMap => {
  const installedIds = initialLineIds(loadout, hull);
  const connections = physicalConnections(source, installedIds);
  seedMissingLines(connections, installedIds, definition);
  const map = { ...source, connections };
  assertPhysicalTopology(map);
  if (Object.isFrozen(source) && sharesConnectionRecords(source, connections)) return source;
  return Object.freeze(map);
};

/**
 * Carry durable hull installations into a fresh site. Atmosphere, liquids, heat,
 * gases, liquids, heat, reaction residue, conduit contents, and damage telemetry reset during
 * travel. Installed equipment and stationary material remain aboard the hull.
 */
const seedHullContents = (state: GameState, hull: HullFragment | null): void => {
  if (!hull) return;
  for (const [roomId, roomState] of Object.entries(hull.roomStates)) {
    const destination = state.rooms[roomId];
    if (destination) {
      destination.equipment = structuredClone(roomState.equipment);
      destination.stationary = structuredClone(roomState.stationary);
    }
  }
  for (const [id, conduit] of Object.entries(hull.gasConduits)) {
    const destination = state.gasConduits[id];
    if (destination) destination.enabled = conduit.enabled;
  }
  for (const [id, conduit] of Object.entries(hull.liquidConduits)) {
    const destination = state.liquidConduits[id];
    if (destination) destination.enabled = conduit.enabled;
  }
};

export const createScenarioGame = (
  levelId: LevelId,
  completedLevelIds: LevelId[] = [],
  definition: GameDefinition,
  site: ProducedSite = produceLevelSite(definition, levelId, null)
): GameState => {
  const level = definition.levels[levelId];
  const round = site.rounds[0];
  if (!round) throw new Error(`Level ${levelId} has no rounds`);
  const map = activeScenarioMap(site.map, level.loadout, site.hull, definition);
  const state: GameState = {
    version: 22,
    pack: { id: definition.packId, contentVersion: definition.contentVersion },
    phase: "level_briefing",
    campaign: {
      levelId,
      levelIndex: definition.levelOrder.indexOf(levelId),
      roundIndex: 0,
      checkpointLevelId: levelId,
      completedLevelIds: [...completedLevelIds],
    },
    map,
    mapRevision: 0,
    world: worldCatalogsForMap(map),
    run: { seed: site.seed, position: definition.levelOrder.indexOf(levelId), outcome: "active" },
    availability: copyAvailability(round.availability),
    phaseTime: 0,
    elapsed: 0,
    rooms: makeRooms(level.loadout, definition, map),
    gasSources: makeGasSources(levelId, definition),
    liquidSources: makeLiquidSources(levelId, definition),
    gasJunctions: makeGasJunctions(map),
    liquidJunctions: makeLiquidJunctions(map),
    gasConduits: makeGasConduits(level.loadout, map),
    liquidConduits: makeLiquidConduits(level.loadout, map),
    portalStates: facilityModelForMap(map).initialPortalStates(),
    gasVent: emptyGas(),
    liquidDrain: emptyLiquid(),
    enemies: [],
    spawnCursor: 0,
    nextEnemyId: 1,
    nextEventId: 2,
    nextIncidentId: 1,
    coreIntegrity: level.startingCoreIntegrity,
    matter: level.startingMatter,
    pendingMatter: 0,
    paused: false,
    speed: 1,
    stats: makeStats(),
    lastReport: null,
    events: [scenarioStartedEvent(levelId)],
    incidents: [],
  };
  seedHullContents(state, site.hull);
  assertValidGameState(state, definition);
  return state;
};

export const createInitialGame = (definition: GameDefinition): GameState =>
  createScenarioGame("flash_point", [], definition);
