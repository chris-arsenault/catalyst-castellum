/**
 * Default-pack compatibility surface.
 *
 * New application code should use createGameRuntime/createGameQueries. Tests and legacy callers may
 * use this module when they intentionally exercise the repository's default authored pack.
 */
import { DEFAULT_GAME_DEFINITION } from "./definition";
import type { GameDefinition } from "./definitionTypes";
import * as campaign from "./engine/campaign";
import * as architecturalFlow from "./engine/architecturalFlow";
import * as combat from "./engine/combat";
import * as commandPolicy from "./engine/commandPolicy";
import * as commands from "./engine/commands";
import * as equipment from "./engine/equipment";
import * as damage from "./engine/damage";
import * as flashReaction from "./engine/flashReaction";
import * as flow from "./engine/flow";
import * as networkGeometry from "./engine/networkGeometry";
import * as navigation from "./engine/navigation";
import * as reactions from "./engine/reactions";
import * as roomState from "./engine/roomState";
import * as routing from "./engine/routing";
import * as scenarioState from "./engine/scenarioState";
import * as step from "./engine/step";
import * as stratification from "./engine/stratification";
import * as telemetry from "./engine/transportTelemetry";
import * as validation from "./engine/stateValidation";

const bindDefinition =
  <Arguments extends unknown[], Result>(
    operation: (...args: [...Arguments, GameDefinition]) => Result
  ) =>
  (...args: Arguments): Result =>
    operation(...args, DEFAULT_GAME_DEFINITION);

export const evaluateCommand = bindDefinition(commandPolicy.evaluateCommand);
export const executeCommand = bindDefinition(commands.executeCommand);
export const equipmentDismantleRefund = bindDefinition(equipment.equipmentDismantleRefund);
export const findEquipmentInstallation = bindDefinition(equipment.findEquipmentInstallation);
export const roomEquipmentVolume = bindDefinition(equipment.roomEquipmentVolume);
export const roomSocketIds = bindDefinition(equipment.roomSocketIds);
export const gasConduitPressure = bindDefinition(flow.gasConduitPressure);
export const liquidConduitCrestElevation = flow.liquidConduitCrestElevation;
export const liquidConduitFillRatio = bindDefinition(flow.liquidConduitFillRatio);
export const simulateNetworks = bindDefinition(flow.simulateNetworks);
export const simulateArchitecturalGas = bindDefinition(architecturalFlow.simulateArchitecturalGas);
export const simulateArchitecturalLiquid = bindDefinition(
  architecturalFlow.simulateArchitecturalLiquid
);
export const verticalPortalOrder = architecturalFlow.verticalPortalOrder;
export const conduitCapacity = bindDefinition(networkGeometry.conduitCapacity);
export const conduitCrestElevation = networkGeometry.conduitCrestElevation;
export const conduitEndpoint = networkGeometry.conduitEndpoint;
export const conduitLength = networkGeometry.conduitLength;
export const conduitMaxFlow = bindDefinition(networkGeometry.conduitMaxFlow);
export const conduitWorldRoute = networkGeometry.conduitWorldRoute;
export const simulateReactions = bindDefinition(reactions.simulateReactions);
export const hydrogenOxygenFlashStatus = bindDefinition(flashReaction.hydrogenOxygenFlashStatus);
export const simulateHydrogenOxygenFlash = bindDefinition(
  flashReaction.simulateHydrogenOxygenFlash
);
export const applyDamagePackets = bindDefinition(damage.applyDamagePackets);
export const enemyRoomId = (enemy: Parameters<typeof combat.enemyRoomId>[0]) =>
  combat.enemyRoomId(enemy, DEFAULT_GAME_DEFINITION.map);
export const moveEnemies = bindDefinition(combat.moveEnemies);
export const resolveEnemyCombat = bindDefinition(combat.resolveEnemyCombat);
export const spawnEnemies = bindDefinition(combat.spawnEnemies);
export const findEnemyPath = (options: Parameters<typeof navigation.findEnemyPath>[0]) =>
  navigation.findEnemyPath(options, DEFAULT_GAME_DEFINITION.map);
export const findEnemyPathOnMap = navigation.findEnemyPath;
export const findEnemyPathBetween = (
  options: Parameters<typeof navigation.findEnemyPathBetween>[0]
) => navigation.findEnemyPathBetween(options, DEFAULT_GAME_DEFINITION.map);
export const pathMovementModes = navigation.pathMovementModes;
export const simulateRoomStratification = bindDefinition(stratification.simulateRoomStratification);
export const simulateStratification = bindDefinition(stratification.simulateStratification);
export const transportRunChannels = bindDefinition(telemetry.transportRunChannels);
export const transportRunMaterialFlow = bindDefinition(telemetry.transportRunMaterialFlow);
export const transportRunPhaseStatus = bindDefinition(telemetry.transportRunPhaseStatus);
export const analyzeRoom = bindDefinition(roomState.analyzeRoom);
export const createInitialGame = bindDefinition(scenarioState.createInitialGame);
export const createScenarioGame = (
  levelId: Parameters<typeof scenarioState.createScenarioGame>[0],
  completedLevelIds: Parameters<typeof scenarioState.createScenarioGame>[1] = []
) => scenarioState.createScenarioGame(levelId, completedLevelIds, DEFAULT_GAME_DEFINITION);
export const levelDefinitionFor = bindDefinition(campaign.levelDefinitionFor);
export const roundDefinitionFor = bindDefinition(campaign.roundDefinitionFor);
export const stepGame = bindDefinition(step.stepGame);
export const validateGameState = bindDefinition(validation.validateGameState);
export const assertValidGameState = bindDefinition(validation.assertValidGameState);

export const cloneGame = roomState.cloneGame;
export const installedEquipment = equipment.installedEquipment;
export const gridRouteLength = networkGeometry.gridRouteLength;
export const transportPhaseEnabled = routing.transportPhaseEnabled;
export const transportPhaseExists = routing.transportPhaseExists;
export const transportPhaseInstalled = routing.transportPhaseInstalled;
export const equipmentAvailable = campaign.equipmentAvailable;
export const gasSourceAvailable = campaign.gasSourceAvailable;
export const liquidSourceAvailable = campaign.liquidSourceAvailable;
export const transportPhaseAvailable = campaign.transportPhaseAvailable;

export {
  gasAmountTotal,
  gasPercent,
  gasTotal,
  liquidAmountTotal,
  liquidPercent,
  liquidStrength,
  liquidTotal,
} from "./engine/physics";

export const gasCapacity = bindDefinition(roomState.gasCapacity);
export const liquidFillRatio = bindDefinition(roomState.liquidFillRatio);
export const liquidMovementMultiplier = bindDefinition(roomState.liquidMovementMultiplier);
export const pressureMovementMultiplier = bindDefinition(roomState.pressureMovementMultiplier);
export const roomGasHeadroom = bindDefinition(roomState.roomGasHeadroom);
export const roomHazards = (
  room: Parameters<typeof roomState.roomHazards>[0],
  floorContact = true,
  needsOxygen = true,
  zone: Parameters<typeof roomState.roomHazards>[3] = "lower"
) => roomState.roomHazards(room, floorContact, needsOxygen, zone, DEFAULT_GAME_DEFINITION);
export const roomLiquidHeadroom = bindDefinition(roomState.roomLiquidHeadroom);
export const roomMovementMultiplier = bindDefinition(roomState.roomMovementMultiplier);
export const roomPressure = bindDefinition(roomState.roomPressure);
export const roomStaticPressure = bindDefinition(roomState.roomStaticPressure);

export { createGameRuntime, DEFAULT_GAME_RUNTIME, type GameRuntime } from "./runtime";
