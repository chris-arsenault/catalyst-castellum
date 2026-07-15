import type { FacilityLoadout } from "../definitionTypes";
import { emptyGas, emptyLiquid } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import {
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  GAS_TYPES,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  PROCESS_IDS,
  type GameState,
  type GasAmounts,
  type LevelId,
  type ReactionTelemetry,
  type RoomId,
  type RoomReactionId,
  type RoomState,
} from "../types";
import { emptyRoomEquipment, roomEquipmentVolume } from "./equipment";
import { makeStats } from "./events";
import { kelvin, STANDARD_TEMPERATURE } from "./physics";
import { assertValidGameState } from "./stateValidation";
import { worldCatalogsFor } from "../world/catalogs";
import { maybeLineDefinition, processLineIds } from "../world/instances";
import { definitionRoom } from "../world/instances";

const emptyTelemetry = (): ReactionTelemetry => ({
  lastRate: 0,
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

const makeRoom = (id: RoomId, loadout: FacilityLoadout, definition: GameDefinition): RoomState => {
  const ambient = definition.ambientGas;
  const equipment = emptyRoomEquipment();
  const scenarioEquipment = loadout.equipment[id];
  if (scenarioEquipment) {
    for (const [socketId, instance] of Object.entries(scenarioEquipment)) {
      if (instance) equipment[socketId as keyof typeof equipment] = { ...instance };
    }
  }
  const temperature =
    loadout.initialTemperatures[id] ?? definitionRoom(definition, id).ambientTemperature;
  const usableVolume = Math.max(
    8,
    definition.facility.roomVolume(id) - roomEquipmentVolume({ equipment }, definition)
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

const makeRooms = (
  loadout: FacilityLoadout,
  definition: GameDefinition
): Record<RoomId, RoomState> =>
  Object.fromEntries(
    definition.roomOrder.map((id) => [id, makeRoom(id, loadout, definition)])
  ) as Record<RoomId, RoomState>;

const makeGasSources = (
  loadout: FacilityLoadout,
  definition: GameDefinition
): GameState["gasSources"] =>
  Object.fromEntries(
    GAS_SOURCE_IDS.map((id) => [
      id,
      {
        gas: definition.gasSources[id].infinite
          ? { ...emptyGas(), ...definition.gasSources[id].initialGas }
          : { ...emptyGas(), ...loadout.gasSourceGas[id] },
      },
    ])
  ) as GameState["gasSources"];

const makeLiquidSources = (
  loadout: FacilityLoadout,
  definition: GameDefinition
): GameState["liquidSources"] =>
  Object.fromEntries(
    LIQUID_SOURCE_IDS.map((id) => {
      const liquid = emptyLiquid();
      const source = definition.liquidSources[id];
      liquid[source.substance] = loadout.liquidSourceAmounts[id] ?? 0;
      return [id, { liquid }];
    })
  ) as GameState["liquidSources"];

const makeGasBuffers = (loadout: FacilityLoadout): GameState["gasBuffers"] =>
  Object.fromEntries(
    GAS_BUFFER_IDS.map((id) => [id, { gas: { ...emptyGas(), ...loadout.gasBuffers[id] } }])
  ) as GameState["gasBuffers"];

const makeLiquidBuffers = (loadout: FacilityLoadout): GameState["liquidBuffers"] =>
  Object.fromEntries(
    LIQUID_BUFFER_IDS.map((id) => [
      id,
      { liquid: { ...emptyLiquid(), ...loadout.liquidBuffers[id] } },
    ])
  ) as GameState["liquidBuffers"];

const makeGasJunctions = (definition: GameDefinition): GameState["gasJunctions"] =>
  Object.fromEntries(
    definition.roomOrder.map((roomId) => [roomId, { gas: emptyGas(), temperature: 22 }])
  ) as GameState["gasJunctions"];

const makeLiquidJunctions = (definition: GameDefinition): GameState["liquidJunctions"] =>
  Object.fromEntries(
    definition.roomOrder.map((roomId) => [roomId, { liquid: emptyLiquid() }])
  ) as GameState["liquidJunctions"];

const makeGasConduits = (
  loadout: FacilityLoadout,
  gameDefinition: GameDefinition
): GameState["gasConduits"] =>
  Object.fromEntries(
    processLineIds(gameDefinition, "gas_line").map((runId) => {
      const definition = maybeLineDefinition(gameDefinition, runId, "gas");
      const configured = loadout.gasConduits[runId];
      return [
        runId,
        {
          installed: configured?.installed ?? false,
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

const makeLiquidConduits = (
  loadout: FacilityLoadout,
  gameDefinition: GameDefinition
): GameState["liquidConduits"] =>
  Object.fromEntries(
    processLineIds(gameDefinition, "liquid_line").map((runId) => {
      const definition = maybeLineDefinition(gameDefinition, runId, "liquid");
      const configured = loadout.liquidConduits[runId];
      return [
        runId,
        {
          installed: configured?.installed ?? false,
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

const makeProcesses = (): GameState["processes"] =>
  Object.fromEntries(
    PROCESS_IDS.map((id) => [
      id,
      {
        setting: 1,
        lastRate: 0,
        totalProcessed: 0,
        limitingFactor: { kind: "species", speciesId: "sodium_chloride", zone: null },
        powerDraw: 0,
        separatorLeakTotal: 0,
      },
    ])
  ) as GameState["processes"];

export const createScenarioGame = (
  levelId: LevelId,
  completedLevelIds: LevelId[] = [],
  definition: GameDefinition
): GameState => {
  const level = definition.levels[levelId];
  const round = level.rounds[0];
  if (!round) throw new Error(`Level ${levelId} has no rounds`);
  const state: GameState = {
    version: 12,
    pack: { id: definition.packId, contentVersion: definition.contentVersion },
    phase: "level_briefing",
    campaign: {
      levelId,
      levelIndex: definition.levelOrder.indexOf(levelId),
      roundIndex: 0,
      checkpointLevelId: levelId,
      completedLevelIds: [...completedLevelIds],
    },
    world: worldCatalogsFor(definition),
    availability: {
      equipment: [...round.availability.equipment],
      gasLines: [...round.availability.gasLines],
      liquidLines: [...round.availability.liquidLines],
      gasSources: [...round.availability.gasSources],
      liquidSources: [...round.availability.liquidSources],
    },
    phaseTime: 0,
    elapsed: 0,
    rooms: makeRooms(level.loadout, definition),
    gasSources: makeGasSources(level.loadout, definition),
    liquidSources: makeLiquidSources(level.loadout, definition),
    gasBuffers: makeGasBuffers(level.loadout),
    liquidBuffers: makeLiquidBuffers(level.loadout),
    gasJunctions: makeGasJunctions(definition),
    liquidJunctions: makeLiquidJunctions(definition),
    gasConduits: makeGasConduits(level.loadout, definition),
    liquidConduits: makeLiquidConduits(level.loadout, definition),
    portalStates: definition.facility.initialPortalStates(),
    processes: makeProcesses(),
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
    events: [
      {
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
      },
    ],
    incidents: [],
  };
  assertValidGameState(state, definition);
  return state;
};

export const createInitialGame = (definition: GameDefinition): GameState =>
  createScenarioGame("flash_point", [], definition);
