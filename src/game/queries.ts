import { DEFAULT_GAME_DEFINITION } from "./definition";
import type { GameDefinition } from "./definitionTypes";
import type { EnemyState } from "./types";
import * as campaign from "./engine/campaign";
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
    operation(...args, definition);

/** Definition-bound, read-only engine queries for application and presentation code. */
export const createGameQueries = (definition: GameDefinition) =>
  Object.freeze({
    enemyGasZone: (enemy: EnemyState) => enemyPosition.enemyGasZone(enemy, definition.map),
    enemyRoomId: (enemy: EnemyState) => enemyPosition.enemyRoomId(enemy, definition.map),
    enemyWorldPosition: enemyPosition.enemyWorldPosition,
    levelDefinitionFor: bindDefinition(campaign.levelDefinitionFor, definition),
    roundDefinitionFor: bindDefinition(campaign.roundDefinitionFor, definition),
    roomEquipmentIsActive: equipment.roomEquipmentIsActive,
    installedEquipment: equipment.installedEquipment,
    roomEquipmentVolume: bindDefinition(equipment.roomEquipmentVolume, definition),
    roomSocketIds: bindDefinition(equipment.roomSocketIds, definition),
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
    liquidMovementMultiplier: bindDefinition(physics.liquidMovementMultiplier, definition),
    pressureMovementMultiplier: bindDefinition(physics.pressureMovementMultiplier, definition),
    roomHazards: bindDefinition(physics.roomHazards, definition),
    liquidSurfaceElevation: bindDefinition(physics.liquidSurfaceElevation, definition),
    roomStaticPressure: bindDefinition(physics.roomStaticPressure, definition),
    analyzeRoom: bindDefinition(roomState.analyzeRoom, definition),
    transportRunChannels: bindDefinition(telemetry.transportRunChannels, definition),
    transportRunMaterialFlow: bindDefinition(telemetry.transportRunMaterialFlow, definition),
    transportRunPhaseStatus: bindDefinition(telemetry.transportRunPhaseStatus, definition),
  });

export type GameQueries = ReturnType<typeof createGameQueries>;

export const DEFAULT_GAME_QUERIES = createGameQueries(DEFAULT_GAME_DEFINITION);

export const {
  enemyGasZone,
  enemyRoomId,
  enemyWorldPosition,
  levelDefinitionFor,
  roundDefinitionFor,
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
