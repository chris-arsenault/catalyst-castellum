import { emptyGas } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import {
  GAS_TYPES,
  type FlowCause,
  type GameState,
  type GasAmounts,
  type GasConduitState,
  type RoomId,
  type ConnectionId,
} from "../types";
import { addGas, gasAmountTotal, takeGas } from "./roomState";
import {
  gasAmountTotal as totalGas,
  gasRelativeDensity,
  gasZoneForPort,
  mixedTemperature,
  roomGasHeadroom,
  roomPressure,
  STANDARD_PRESSURE,
} from "./physics";
import { clamp } from "./math";
import { conduitCapacity, conduitEndpoint, conduitMaxFlow } from "./networkGeometry";
import { junctionGasAvailable, junctionGasTemperature, takeGasFromJunction } from "./junctions";
import {
  allocateTransportPlans,
  reconcileTransportCapacity,
  transportPlanIsBlocked,
  type TransportPlan,
} from "./transportPlanning";
import { gasConduitState, gasJunctionState, roomState } from "../world/instances";
import { definitionGasJunction, gasLineDefinition, processLineIds } from "../world/instances";

const FULL_FLOW_DRIVE = 0.7;
const FULL_CONDUIT_EPSILON = 1e-6;

type GasPlan = TransportPlan;

const gasLinePressureRatio = (
  state: GameState,
  runId: ConnectionId,
  definition: GameDefinition
): number => {
  const conduit = gasConduitState(state, runId);
  const capacity = conduitCapacity(state, runId, "gas", definition);
  if (capacity <= 0) return 0;
  return (
    (gasAmountTotal(conduit.gas) / capacity) * ((conduit.temperature + 273.15) / (22 + 273.15))
  );
};

export const gasConduitPressure = (
  state: GameState,
  runId: ConnectionId,
  definition: GameDefinition
): number => gasLinePressureRatio(state, runId, definition) * STANDARD_PRESSURE;

const destinationHeadroom = (
  state: GameState,
  runId: ConnectionId,
  gameDefinition: GameDefinition
): number => {
  const definition = gasLineDefinition(gameDefinition, runId);
  if (!definition || definition.destinationKind === "gas_vent") return Number.POSITIVE_INFINITY;
  return roomGasHeadroom(roomState(state, definition.direction[1]), gameDefinition);
};

const destinationPressureRatio = (
  state: GameState,
  runId: ConnectionId,
  gameDefinition: GameDefinition
): number => {
  const definition = gasLineDefinition(gameDefinition, runId);
  if (!definition || definition.destinationKind === "gas_vent") return 0;
  return (
    roomPressure(roomState(state, definition.direction[1]), gameDefinition) / STANDARD_PRESSURE
  );
};

const sourcePressureRatio = (
  state: GameState,
  roomId: RoomId,
  definition: GameDefinition
): number =>
  gasAmountTotal(gasJunctionState(state, roomId).gas) /
  definitionGasJunction(definition, roomId).capacity;

const desiredThroughput = (
  state: GameState,
  runId: ConnectionId,
  dt: number,
  gameDefinition: GameDefinition
): number => {
  const definition = gasLineDefinition(gameDefinition, runId);
  if (!definition) return 0;
  const from = conduitEndpoint(state, runId, "gas", "from");
  const to = conduitEndpoint(state, runId, "gas", "to");
  const sourceDensity = gasRelativeDensity(
    gasJunctionState(state, definition.direction[0]).gas,
    gasJunctionState(state, definition.direction[0]).temperature,
    gameDefinition
  );
  const buoyancy = (sourceDensity - 1) * (from.elevation - to.elevation) * 0.045;
  const pressureDrive =
    sourcePressureRatio(state, definition.direction[0], gameDefinition) -
    destinationPressureRatio(state, runId, gameDefinition);
  const drive = definition.actuatorHead + pressureDrive + buoyancy;
  return (
    conduitMaxFlow(state, runId, "gas", gameDefinition) * clamp(drive / FULL_FLOW_DRIVE, 0, 1) * dt
  );
};

const initialPlan = (
  state: GameState,
  runId: ConnectionId,
  dt: number,
  gameDefinition: GameDefinition
): GasPlan | null => {
  const definition = gasLineDefinition(gameDefinition, runId);
  const conduit = gasConduitState(state, runId);
  if (!definition || !conduit.installed || !conduit.enabled) return null;
  const throughput = desiredThroughput(state, runId, dt, gameDefinition);
  const retained = gasAmountTotal(conduit.gas);
  const capacity = conduitCapacity(state, runId, "gas", gameDefinition);
  // An empty physical duct has a real swept volume: the leading packet cannot appear at
  // the far room until the routed conduit has filled. Once primed, outgoing inventory is
  // replaced at the inlet in the same step, preserving a stable through-flow.
  const primed = capacity > 0 && retained >= capacity - FULL_CONDUIT_EPSILON;
  const outgoingRequest = primed
    ? Math.min(throughput, retained, destinationHeadroom(state, runId, gameDefinition))
    : 0;
  const incomingRequest = Math.min(throughput, Math.max(0, capacity - retained + outgoingRequest));
  return {
    runId,
    sourceRoomId: definition.direction[0],
    destinationRoomId: definition.direction[1],
    outgoingRequest,
    outgoingAmount: outgoingRequest,
    incomingRequest,
    incomingAmount: incomingRequest,
  };
};

const deliverGas = (
  state: GameState,
  runId: ConnectionId,
  packet: GasAmounts,
  packetTemperature: number,
  gameDefinition: GameDefinition
): void => {
  const definition = gasLineDefinition(gameDefinition, runId);
  if (!definition) return;
  if (definition.destinationKind === "gas_vent") {
    addGas(state.gasVent, packet);
    return;
  }
  const roomId = definition.direction[1];
  const endpoint = conduitEndpoint(state, runId, "gas", "to");
  const zone = gasZoneForPort(gameDefinition.facility.roomPortHeight(roomId, endpoint.elevation));
  const target = roomState(state, roomId).gas[zone];
  const existing = totalGas(target);
  addGas(target, packet);
  roomState(state, roomId).gasTemperature[zone] = mixedTemperature(
    roomState(state, roomId).gasTemperature[zone],
    existing,
    packetTemperature,
    gasAmountTotal(packet)
  );
};

const clearReadout = (state: GameState, runId: ConnectionId): void => {
  const conduit = gasConduitState(state, runId);
  conduit.lastFlow = 0;
  conduit.blocked = false;
  conduit.flowCause = "idle";
  for (const species of GAS_TYPES) conduit.lastSpeciesFlow[species] = 0;
};

const measuredCause = (outgoingAmount: number, incomingAmount: number): FlowCause => {
  if (outgoingAmount > 0) return "fan";
  if (incomingAmount > 0) return "priming";
  return "idle";
};

const rate = (amount: number, dt: number): number => (dt > 0 ? amount / dt : 0);

const updateReadout = (
  conduit: GasConduitState,
  outgoing: GasAmounts,
  incoming: GasAmounts,
  dt: number
): void => {
  const outgoingAmount = gasAmountTotal(outgoing);
  const incomingAmount = gasAmountTotal(incoming);
  let measuredAmount = incomingAmount;
  let measuredPacket = incoming;
  if (outgoingAmount > 0) {
    measuredAmount = outgoingAmount;
    measuredPacket = outgoing;
  }
  conduit.lastFlow = rate(measuredAmount, dt);
  for (const species of GAS_TYPES) {
    conduit.lastSpeciesFlow[species] = rate(measuredPacket[species], dt);
  }
  conduit.flowCause = measuredCause(outgoingAmount, incomingAmount);
};

const isBlockedAfterPlan = (
  state: GameState,
  plan: GasPlan,
  incomingAmount: number,
  dt: number,
  definition: GameDefinition
): boolean =>
  transportPlanIsBlocked(
    gasConduitState(state, plan.runId).enabled,
    desiredThroughput(state, plan.runId, dt, definition),
    plan.outgoingAmount,
    incomingAmount
  );

const applyPlan = (
  state: GameState,
  plan: GasPlan,
  dt: number,
  definition: GameDefinition
): void => {
  const conduit = gasConduitState(state, plan.runId);
  const before = gasAmountTotal(conduit.gas);
  const outgoing = takeGas(conduit.gas, plan.outgoingAmount);
  deliverGas(state, plan.runId, outgoing, conduit.temperature, definition);
  const incoming = takeGasFromJunction(state, plan.sourceRoomId, plan.incomingAmount);
  const incomingAmount = gasAmountTotal(incoming);
  addGas(conduit.gas, incoming);
  conduit.temperature = mixedTemperature(
    conduit.temperature,
    Math.max(0, before - plan.outgoingAmount),
    junctionGasTemperature(state, plan.sourceRoomId),
    incomingAmount
  );
  updateReadout(conduit, outgoing, incoming, dt);
  conduit.blocked = isBlockedAfterPlan(state, plan, incomingAmount, dt, definition);
  if (conduit.blocked) conduit.flowCause = "backpressure";
};

export const simulateGasConduits = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  const lineIds = processLineIds(definition, "gas_line");
  for (const runId of lineIds) clearReadout(state, runId);
  const plans = lineIds.flatMap((runId) => {
    const plan = initialPlan(state, runId, dt, definition);
    return plan ? [plan] : [];
  });

  allocateTransportPlans(
    plans.filter((plan) => gasLineDefinition(definition, plan.runId)?.destinationKind === "room"),
    "destinationRoomId",
    "outgoingRequest",
    "outgoingAmount",
    (roomId) => roomGasHeadroom(roomState(state, roomId), definition)
  );
  reconcileTransportCapacity(
    plans,
    (runId) => gasAmountTotal(gasConduitState(state, runId).gas),
    (runId) => conduitCapacity(state, runId, "gas", definition)
  );
  allocateTransportPlans(plans, "sourceRoomId", "incomingRequest", "incomingAmount", (roomId) =>
    junctionGasAvailable(state, roomId)
  );
  for (const plan of plans) applyPlan(state, plan, dt, definition);
};

export const emptyGasConduitPacket = (): GasAmounts => emptyGas();
