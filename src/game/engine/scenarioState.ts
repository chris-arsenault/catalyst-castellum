import {
  LEVEL_DEFINITIONS,
  LIQUID_SOURCES,
  ROOM_DEFINITIONS,
  ROOM_ORDER,
  TRANSPORT_RUNS,
  ambientGas,
  currentRound,
  emptyGas,
  emptyLiquid,
  roomVolume,
  initialPortalStates,
  type FacilityLoadout,
} from "../config";
import {
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  GAS_TYPES,
  LEVEL_IDS,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  PROCESS_IDS,
  ROOM_REACTION_IDS,
  TRANSPORT_RUN_IDS,
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

const emptyTelemetry = (): ReactionTelemetry => ({ lastRate: 0, limitingReactant: "conditions" });

const emptyRoomReactions = (): Record<RoomReactionId, ReactionTelemetry> =>
  Object.fromEntries(ROOM_REACTION_IDS.map((id) => [id, emptyTelemetry()])) as Record<
    RoomReactionId,
    ReactionTelemetry
  >;

const makeRoom = (id: RoomId, loadout: FacilityLoadout): RoomState => {
  const ambient = ambientGas();
  const equipment = emptyRoomEquipment();
  const scenarioEquipment = loadout.equipment[id];
  if (scenarioEquipment) {
    for (const [socketId, instance] of Object.entries(scenarioEquipment)) {
      if (instance) equipment[socketId as keyof typeof equipment] = { ...instance };
    }
  }
  const temperature = loadout.initialTemperatures[id] ?? ROOM_DEFINITIONS[id].ambientTemperature;
  const usableVolume = Math.max(8, roomVolume(id) - roomEquipmentVolume({ equipment }));
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
    reactions: emptyRoomReactions(),
    equipment,
  };
};

const makeRooms = (loadout: FacilityLoadout): Record<RoomId, RoomState> =>
  Object.fromEntries(ROOM_ORDER.map((id) => [id, makeRoom(id, loadout)])) as Record<
    RoomId,
    RoomState
  >;

const makeGasSources = (loadout: FacilityLoadout): GameState["gasSources"] =>
  Object.fromEntries(
    GAS_SOURCE_IDS.map((id) => [id, { gas: { ...emptyGas(), ...loadout.gasSourceGas[id] } }])
  ) as GameState["gasSources"];

const makeLiquidSources = (loadout: FacilityLoadout): GameState["liquidSources"] =>
  Object.fromEntries(
    LIQUID_SOURCE_IDS.map((id) => {
      const liquid = emptyLiquid();
      const definition = LIQUID_SOURCES[id];
      liquid[definition.substance] = loadout.liquidSourceAmounts[id] ?? 0;
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

const makeGasJunctions = (): GameState["gasJunctions"] =>
  Object.fromEntries(
    ROOM_ORDER.map((roomId) => [roomId, { gas: emptyGas(), temperature: 22 }])
  ) as GameState["gasJunctions"];

const makeLiquidJunctions = (): GameState["liquidJunctions"] =>
  Object.fromEntries(
    ROOM_ORDER.map((roomId) => [roomId, { liquid: emptyLiquid() }])
  ) as GameState["liquidJunctions"];

const makeGasConduits = (loadout: FacilityLoadout): GameState["gasConduits"] =>
  Object.fromEntries(
    TRANSPORT_RUN_IDS.map((runId) => {
      const definition = TRANSPORT_RUNS[runId].gas;
      const configured = loadout.gasConduits[runId];
      return [
        runId,
        {
          installed: configured?.installed ?? false,
          enabled: configured?.enabled ?? false,
          route: definition ? definition.blueprint.map((cell) => ({ ...cell })) : [],
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

const makeLiquidConduits = (loadout: FacilityLoadout): GameState["liquidConduits"] =>
  Object.fromEntries(
    TRANSPORT_RUN_IDS.map((runId) => {
      const definition = TRANSPORT_RUNS[runId].liquid;
      const configured = loadout.liquidConduits[runId];
      return [
        runId,
        {
          installed: configured?.installed ?? false,
          enabled: configured?.enabled ?? false,
          route: definition ? definition.blueprint.map((cell) => ({ ...cell })) : [],
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
        limitingReactant: "NaCl(aq)",
        powerDraw: 0,
        separatorLeakTotal: 0,
      },
    ])
  ) as GameState["processes"];

export const createScenarioGame = (
  levelId: LevelId,
  completedLevelIds: LevelId[] = []
): GameState => {
  const level = LEVEL_DEFINITIONS[levelId];
  const round = currentRound(levelId, 0);
  return {
    version: 9,
    phase: "level_briefing",
    campaign: {
      levelId,
      levelIndex: LEVEL_IDS.indexOf(levelId),
      roundIndex: 0,
      checkpointLevelId: levelId,
      completedLevelIds: [...completedLevelIds],
    },
    availability: {
      equipment: [...round.availability.equipment],
      gasRuns: [...round.availability.gasRuns],
      liquidRuns: [...round.availability.liquidRuns],
      gasSources: [...round.availability.gasSources],
      liquidSources: [...round.availability.liquidSources],
    },
    phaseTime: 0,
    elapsed: 0,
    rooms: makeRooms(level.loadout),
    gasSources: makeGasSources(level.loadout),
    liquidSources: makeLiquidSources(level.loadout),
    gasBuffers: makeGasBuffers(level.loadout),
    liquidBuffers: makeLiquidBuffers(level.loadout),
    gasJunctions: makeGasJunctions(),
    liquidJunctions: makeLiquidJunctions(),
    gasConduits: makeGasConduits(level.loadout),
    liquidConduits: makeLiquidConduits(level.loadout),
    portalStates: initialPortalStates(),
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
        title: `${level.kicker}: ${level.name}`,
        detail: level.briefing,
        roomId: null,
        elapsed: 0,
        incidentId: null,
      },
    ],
    incidents: [],
  };
};

export const createInitialGame = (): GameState => createScenarioGame("flash_point");
