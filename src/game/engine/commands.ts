import {
  EQUIPMENT_DEFINITIONS,
  GAS_SOURCES,
  LIQUID_SOURCES,
  ROOM_DEFINITIONS,
  roomRing,
} from "../config";
import type {
  CommandResult,
  EquipmentInstance,
  GameCommand,
  GameState,
  GasSourceId,
  LiquidSourceId,
  RoomId,
} from "../types";
import { addEvent, makeStats } from "./events";
import {
  equipmentAvailable,
  gasSourceAvailable,
  liquidSourceAvailable,
  roundDefinitionFor,
} from "./campaign";
import { equipmentDismantleRefund, findEquipmentInstallation, roomSocketIds } from "./equipment";
import { cloneGame, gasAmountTotal, liquidAmountTotal } from "./roomState";
import { roomUsableVolume } from "./physics";
import { beginAssault } from "./phases";
import {
  beginLevelCommand,
  continueRoundCommand,
  retryLevelCommand,
  skipTutorialCommand,
  startNextLevelCommand,
} from "./campaignCommands";
import {
  buildTransportCommand,
  dismantleTransportCommand,
  setConduitCommand,
} from "./transportCommands";

const reject = (state: GameState, reason: string): CommandResult => ({
  state,
  accepted: false,
  reason,
});

const accept = (state: GameState): CommandResult => ({ state, accepted: true, reason: null });

const configurationUnlocked = (state: GameState): boolean =>
  state.phase === "build" || state.phase === "prime";

const startPrime = (source: GameState): CommandResult => {
  if (source.phase !== "build") return reject(source, "Prime can only begin from planning.");
  const state = cloneGame(source);
  Object.assign(state, {
    phase: "prime",
    phaseTime: 0,
    paused: false,
    stats: makeStats(),
    pendingMatter: 0,
    spawnCursor: 0,
    enemies: [],
  });
  addEvent(
    state,
    "info",
    `Round ${state.campaign.roundIndex + 1} prime running`,
    `The real process is live for at most ${roundDefinitionFor(state).primeSeconds} seconds. Materials and byproducts persist.`
  );
  return accept(state);
};

const startAssault = (source: GameState): CommandResult => {
  if (source.phase !== "prime") return reject(source, "The plant must be primed before assault.");
  const state = cloneGame(source);
  beginAssault(state, false);
  return accept(state);
};

const constructionUnlocked = (state: GameState): boolean => state.phase === "build";

const equipmentFits = (state: GameState, roomId: RoomId, instance: EquipmentInstance): boolean => {
  const room = state.rooms[roomId];
  const original = room.equipment;
  const temporary = { ...original };
  const emptySocket = roomSocketIds(roomId).find((socketId) => temporary[socketId] === null);
  if (!emptySocket) return false;
  temporary[emptySocket] = instance;
  const candidate = { ...room, equipment: temporary };
  return roomUsableVolume(candidate) - liquidAmountTotal(room.liquid) >= 8;
};

// Explicit installation rules are kept together so UI and headless callers share one verdict.
const lacksRequiredFeature = (
  definition: (typeof EQUIPMENT_DEFINITIONS)[EquipmentInstance["equipmentId"]],
  roomId: RoomId
): boolean =>
  Boolean(
    definition.requiredFeature &&
    !ROOM_DEFINITIONS[roomId].features.includes(definition.requiredFeature)
  );

const equipmentInstallationProblem = (
  source: GameState,
  command: GameCommand & { type: "install_equipment" },
  instance: EquipmentInstance
): string | null => {
  const definition = EQUIPMENT_DEFINITIONS[command.equipmentId];
  if (!equipmentAvailable(source, command.equipmentId))
    return "This equipment has not been unlocked in the current lesson.";
  if (!roomSocketIds(command.roomId).includes(command.socketId))
    return "This space has no compatible equipment socket.";
  if (source.rooms[command.roomId].equipment[command.socketId])
    return "Dismantle the installed equipment before reusing this socket.";
  const ring = roomRing(command.roomId);
  if (!definition.allowedRings.includes(ring))
    return `${definition.name} cannot be mounted in the ${ring} ring.`;
  if (lacksRequiredFeature(definition, command.roomId))
    return `${definition.name} requires the separated outlet manifold shown in R-05.`;
  if (definition.unique && findEquipmentInstallation(source, command.equipmentId))
    return `Only one ${definition.name} may be installed in this facility.`;
  if (!equipmentFits(source, command.roomId, instance))
    return "The room lacks safe free volume for this equipment.";
  if (source.matter < definition.buildCost)
    return `${definition.name} requires ${definition.buildCost} matter.`;
  return null;
};

const installEquipment = (
  source: GameState,
  command: GameCommand & { type: "install_equipment" }
): CommandResult => {
  if (!constructionUnlocked(source))
    return reject(source, "Equipment can be installed only while planning.");
  const roomDefinition = ROOM_DEFINITIONS[command.roomId];
  const definition = EQUIPMENT_DEFINITIONS[command.equipmentId];
  const instance: EquipmentInstance = { equipmentId: command.equipmentId, level: 1, enabled: true };
  const problem = equipmentInstallationProblem(source, command, instance);
  if (problem) return reject(source, problem);
  const state = cloneGame(source);
  state.matter -= definition.buildCost;
  state.rooms[command.roomId].equipment[command.socketId] = instance;
  addEvent(
    state,
    "info",
    `${definition.name} installed in ${roomDefinition.code}`,
    `${definition.buildCost} matter committed. The equipment changes physical conditions and kinetics; it does not select a product.`,
    command.roomId
  );
  return accept(state);
};

const toggleEquipment = (
  source: GameState,
  command: GameCommand & { type: "toggle_equipment" }
): CommandResult => {
  if (!configurationUnlocked(source))
    return reject(source, "Equipment controls are locked during assault.");
  const instance = source.rooms[command.roomId].equipment[command.socketId];
  if (!instance) return reject(source, "This socket is empty.");
  const state = cloneGame(source);
  const target = state.rooms[command.roomId].equipment[command.socketId];
  if (target) target.enabled = command.enabled;
  return accept(state);
};

const upgradeEquipment = (
  source: GameState,
  command: GameCommand & { type: "upgrade_equipment" }
): CommandResult => {
  if (!constructionUnlocked(source))
    return reject(source, "Equipment can be upgraded only while planning.");
  const instance = source.rooms[command.roomId].equipment[command.socketId];
  if (!instance) return reject(source, "This socket is empty.");
  if (instance.level >= 3) return reject(source, "This equipment is already Grade III.");
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const cost = definition.upgradeCosts[instance.level - 1] as number;
  if (source.matter < cost)
    return reject(source, `Grade ${instance.level + 1} requires ${cost} matter.`);
  const state = cloneGame(source);
  const target = state.rooms[command.roomId].equipment[command.socketId];
  if (!target) return reject(source, "This socket is empty.");
  target.level = (target.level + 1) as 2 | 3;
  if (
    roomUsableVolume(state.rooms[command.roomId]) -
      liquidAmountTotal(state.rooms[command.roomId].liquid) <
    8
  )
    return reject(source, "Drain more liquid before fitting the larger grade.");
  state.matter -= cost;
  addEvent(
    state,
    "info",
    `${definition.name} upgraded to Grade ${target.level}`,
    `Rated hardware changed in ${ROOM_DEFINITIONS[command.roomId].code}; live rates still depend on local conditions.`,
    command.roomId
  );
  return accept(state);
};

const dismantleEquipment = (
  source: GameState,
  command: GameCommand & { type: "dismantle_equipment" }
): CommandResult => {
  if (!constructionUnlocked(source))
    return reject(source, "Equipment can be dismantled only while planning.");
  const instance = source.rooms[command.roomId].equipment[command.socketId];
  if (!instance) return reject(source, "This socket is already empty.");
  const state = cloneGame(source);
  state.rooms[command.roomId].equipment[command.socketId] = null;
  state.matter += equipmentDismantleRefund(instance);
  return accept(state);
};

const gasCharge = (source: GameState, sourceId: GasSourceId): CommandResult => {
  if (source.phase !== "build")
    return reject(source, "Exotic transmutation is available only while planning.");
  if (!gasSourceAvailable(source, sourceId))
    return reject(source, "This feedstock has not been unlocked in the current lesson.");
  const definition = GAS_SOURCES[sourceId];
  const current = gasAmountTotal(source.gasSources[sourceId].gas);
  const ratedAmount = Object.values(definition.chargeGas).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const amount = Math.min(ratedAmount, definition.capacity - current);
  if (amount <= 0.01) return reject(source, `${definition.name} is already full.`);
  const cost = Math.ceil(definition.chargeCost * (amount / ratedAmount));
  if (source.matter < cost)
    return reject(source, `Synthesizing ${definition.formula} requires ${cost} matter.`);
  const state = cloneGame(source);
  state.matter -= cost;
  for (const [species, rated] of Object.entries(definition.chargeGas)) {
    state.gasSources[sourceId].gas[
      species as keyof (typeof state.gasSources)[typeof sourceId]["gas"]
    ] += (rated ?? 0) * (amount / ratedAmount);
  }
  addEvent(
    state,
    "info",
    `${definition.formula} reserve synthesized`,
    `EXOTIC TRANSMUTATION converted ${cost} matter into ${amount.toFixed(0)} mol-eq of ${definition.formula}. Elemental conservation is waived.`
  );
  return accept(state);
};

const liquidCharge = (source: GameState, sourceId: LiquidSourceId): CommandResult => {
  if (source.phase !== "build")
    return reject(source, "Exotic transmutation is available only while planning.");
  if (!liquidSourceAvailable(source, sourceId))
    return reject(source, "This feedstock has not been unlocked in the current lesson.");
  const definition = LIQUID_SOURCES[sourceId];
  const current = liquidAmountTotal(source.liquidSources[sourceId].liquid);
  const amount = Math.min(definition.chargeAmount, definition.capacity - current);
  if (amount <= 0.01) return reject(source, `${definition.name} is already full.`);
  const cost = Math.ceil(definition.chargeCost * (amount / definition.chargeAmount));
  if (source.matter < cost)
    return reject(source, `Synthesizing ${definition.formula} requires ${cost} matter.`);
  const state = cloneGame(source);
  state.matter -= cost;
  state.liquidSources[sourceId].liquid[definition.substance] += amount;
  addEvent(
    state,
    "info",
    `${definition.formula} reserve synthesized`,
    `EXOTIC TRANSMUTATION converted ${cost} matter into ${amount.toFixed(0)} mol-eq of ${definition.formula}. Elemental conservation is waived.`
  );
  return accept(state);
};

const togglePause = (source: GameState): CommandResult => {
  if (source.phase !== "prime" && source.phase !== "assault") {
    return reject(source, "There is no running simulation to pause.");
  }
  const state = cloneGame(source);
  state.paused = !state.paused;
  return accept(state);
};

const setPause = (source: GameState, paused: boolean): CommandResult => {
  if (source.phase !== "prime" && source.phase !== "assault") {
    return reject(source, "There is no running simulation to pause.");
  }
  if (source.paused === paused) return accept(source);
  const state = cloneGame(source);
  state.paused = paused;
  return accept(state);
};

const setSpeed = (source: GameState, speed: 1 | 2): CommandResult => {
  const state = cloneGame(source);
  state.speed = speed;
  return accept(state);
};

// The discriminated-union switch is the authoritative exhaustive command boundary.
// eslint-disable-next-line complexity
export const executeCommand = (source: GameState, command: GameCommand): CommandResult => {
  switch (command.type) {
    case "set_conduit":
      return setConduitCommand(source, command);
    case "install_equipment":
      return installEquipment(source, command);
    case "toggle_equipment":
      return toggleEquipment(source, command);
    case "upgrade_equipment":
      return upgradeEquipment(source, command);
    case "dismantle_equipment":
      return dismantleEquipment(source, command);
    case "build_transport":
      return buildTransportCommand(source, command);
    case "dismantle_transport":
      return dismantleTransportCommand(source, command);
    case "charge_gas_source":
      return gasCharge(source, command.sourceId);
    case "charge_liquid_source":
      return liquidCharge(source, command.sourceId);
    case "start_prime":
      return startPrime(source);
    case "start_assault":
      return startAssault(source);
    case "begin_level":
      return beginLevelCommand(source);
    case "skip_tutorial":
      return skipTutorialCommand(source);
    case "continue_round":
      return continueRoundCommand(source);
    case "start_next_level":
      return startNextLevelCommand(source);
    case "retry_level":
      return retryLevelCommand(source);
    case "toggle_pause":
      return togglePause(source);
    case "set_pause":
      return setPause(source, command.paused);
    case "set_speed":
      return setSpeed(source, command.speed);
  }
};

export const roomRingDescription = (roomId: keyof GameState["rooms"]): string => {
  const definition = ROOM_DEFINITIONS[roomId];
  const ring = roomRing(roomId);
  if (definition.structure === "entry") return "Structural entry space · no equipment sockets";
  if (ring === "inner") return "Two generic sockets · all current equipment grades permitted";
  if (ring === "middle")
    return "Two generic sockets · contact, heat, and mixing equipment permitted";
  if (ring === "outer") return "Two generic sockets · heat and gas mixing equipment permitted";
  return "Protected utility and stock manifold";
};
