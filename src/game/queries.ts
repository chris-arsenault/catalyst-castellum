import { DEFAULT_GAME_DEFINITION } from "./definition";
import type { GameDefinition } from "./definitionTypes";
import type { EnemyState, RoomId } from "./types";
import type { MapCarrier } from "./world/instances";
import { definitionForMap } from "./world/activeDefinition";
import * as campaign from "./engine/campaign";
import * as enemyLevel from "./engine/enemyLevel";
import * as enemyPosition from "./engine/enemyPosition";
import * as equipment from "./engine/equipment";
import * as flashReaction from "./engine/flashReaction";
import * as flow from "./engine/flow";
import * as networkGeometry from "./engine/networkGeometry";
import * as physics from "./engine/physics";
import * as reactions from "./engine/reactions";
import * as roomState from "./engine/roomState";
import * as telemetry from "./engine/transportTelemetry";

export type { FlashIgnitionStatus } from "./engine/flashReaction";
export type { HydrogenChlorineReactionStatus } from "./engine/reactions";
export type {
  MaterialRunFlow,
  TransportChannelTelemetry,
  TransportPhaseStatus,
} from "./engine/transportTelemetry";

const bindDefinition =
  <Arguments extends unknown[], Result>(
    operation: (...args: [...Arguments, GameDefinition]) => Result,
    definition: GameDefinition
  ) =>
  (...args: Arguments): Result =>
    operation(
      ...args,
      definitionForMap(
        definition,
        args.find(
          (argument): argument is MapCarrier =>
            typeof argument === "object" && argument !== null && "map" in argument
        )?.map ?? definition.map
      )
    );

/** Definition-bound, read-only engine queries for application and presentation code. */
export const createGameQueries = (definition: GameDefinition) =>
  Object.freeze({
    enemyGasZone: (enemy: EnemyState, carrier: MapCarrier = definition) =>
      enemyPosition.enemyGasZone(enemy, carrier.map),
    resolveEnemyLevel: enemyLevel.resolveEnemyLevel,
    enemyRoomId: (enemy: EnemyState, carrier: MapCarrier = definition) =>
      enemyPosition.enemyRoomId(enemy, carrier.map),
    enemyWorldPosition: enemyPosition.enemyWorldPosition,
    levelDefinitionFor: bindDefinition(campaign.levelDefinitionFor, definition),
    roundDefinitionFor: bindDefinition(campaign.roundDefinitionFor, definition),
    supplyDefinitionsFor: bindDefinition(campaign.supplyDefinitionsFor, definition),
    supplyDefinitionFor: bindDefinition(campaign.supplyDefinitionFor, definition),
    supplyAvailable: bindDefinition(campaign.supplyAvailable, definition),
    roomEquipmentIsActive: equipment.roomEquipmentIsActive,
    installedEquipment: equipment.installedEquipment,
    roomEquipmentVolume: bindDefinition(equipment.roomEquipmentVolume, definition),
    roomSocketIds: (roomId: RoomId, carrier: MapCarrier = definition) =>
      equipment.roomSocketIds(roomId, carrier),
    hydrogenOxygenFlashStatus: bindDefinition(flashReaction.hydrogenOxygenFlashStatus, definition),
    hydrogenChlorineReactionStatus: bindDefinition(
      reactions.hydrogenChlorineReactionStatus,
      definition
    ),
    conduitCapacity: bindDefinition(networkGeometry.conduitCapacity, definition),
    gasConduitPressure: bindDefinition(flow.gasConduitPressure, definition),
    liquidConduitFillRatio: bindDefinition(flow.liquidConduitFillRatio, definition),
    transportPhaseAvailable: campaign.transportPhaseAvailable,
    connectionAvailable: campaign.connectionAvailable,
    gasAmountTotal: physics.gasAmountTotal,
    gasPercent: physics.gasPercent,
    gasPartialRatio: bindDefinition(physics.gasPartialRatio, definition),
    liquidAmountTotal: physics.liquidAmountTotal,
    liquidPercent: physics.liquidPercent,
    liquidStrength: physics.liquidStrength,
    liquidMovementMultiplier: (
      room: Parameters<typeof physics.liquidMovementMultiplier>[0],
      flying: boolean,
      carrier: MapCarrier = definition
    ) => physics.liquidMovementMultiplier(room, flying, definitionForMap(definition, carrier.map)),
    pressureMovementMultiplier: (
      room: Parameters<typeof physics.pressureMovementMultiplier>[0],
      carrier: MapCarrier = definition
    ) => physics.pressureMovementMultiplier(room, definitionForMap(definition, carrier.map)),
    roomHazards: (
      room: Parameters<typeof physics.roomHazards>[0],
      floorContact: boolean,
      needsOxygen: boolean,
      zone: Parameters<typeof physics.roomHazards>[3],
      carrier: MapCarrier = definition
    ) =>
      physics.roomHazards(
        room,
        floorContact,
        needsOxygen,
        zone,
        definitionForMap(definition, carrier.map)
      ),
    liquidSurfaceElevation: (
      room: Parameters<typeof physics.liquidSurfaceElevation>[0],
      carrier: MapCarrier = definition
    ) => physics.liquidSurfaceElevation(room, definitionForMap(definition, carrier.map)),
    roomStaticPressure: (
      room: Parameters<typeof physics.roomStaticPressure>[0],
      carrier: MapCarrier = definition
    ) => physics.roomStaticPressure(room, definitionForMap(definition, carrier.map)),
    analyzeRoom: (
      room: Parameters<typeof roomState.analyzeRoom>[0],
      carrier: MapCarrier = definition
    ) => roomState.analyzeRoom(room, definitionForMap(definition, carrier.map)),
    transportRunChannels: bindDefinition(telemetry.transportRunChannels, definition),
    transportRunMaterialFlow: bindDefinition(telemetry.transportRunMaterialFlow, definition),
    transportRunPhaseStatus: bindDefinition(telemetry.transportRunPhaseStatus, definition),
  });

export type GameQueries = ReturnType<typeof createGameQueries>;

export const DEFAULT_GAME_QUERIES = createGameQueries(DEFAULT_GAME_DEFINITION);

export const {
  enemyGasZone,
  resolveEnemyLevel,
  enemyRoomId,
  enemyWorldPosition,
  levelDefinitionFor,
  roundDefinitionFor,
  supplyDefinitionsFor,
  supplyDefinitionFor,
  supplyAvailable,
  roomEquipmentIsActive,
  installedEquipment,
  roomEquipmentVolume,
  roomSocketIds,
  hydrogenOxygenFlashStatus,
  hydrogenChlorineReactionStatus,
  conduitCapacity,
  gasConduitPressure,
  liquidConduitFillRatio,
  transportPhaseAvailable,
  connectionAvailable,
  gasAmountTotal,
  gasPercent,
  gasPartialRatio,
  liquidAmountTotal,
  liquidPercent,
  liquidStrength,
  liquidMovementMultiplier,
  pressureMovementMultiplier,
  roomHazards,
  liquidSurfaceElevation,
  roomStaticPressure,
  analyzeRoom,
  transportRunChannels,
  transportRunMaterialFlow,
  transportRunPhaseStatus,
} = DEFAULT_GAME_QUERIES;

export const STANDARD_PRESSURE = physics.STANDARD_PRESSURE;
