import { GAS_JUNCTIONS, TRANSPORT_RUNS, emptyGas, roomPortHeight } from "../config";
import {
  GAS_TYPES,
  TRANSPORT_RUN_IDS,
  type FlowCause,
  type GameState,
  type GasAmounts,
  type GasConduitState,
  type RoomId,
  type TransportRunId,
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

const FULL_FLOW_DRIVE = 0.7;
const FULL_CONDUIT_EPSILON = 1e-6;

interface GasPlan {
  runId: TransportRunId;
  sourceRoomId: RoomId;
  destinationRoomId: RoomId;
  outgoingRequest: number;
  outgoingAmount: number;
  incomingRequest: number;
  incomingAmount: number;
}

const gasLinePressureRatio = (state: GameState, runId: TransportRunId): number => {
  const conduit = state.gasConduits[runId];
  const capacity = conduitCapacity(state, runId, "gas");
  if (capacity <= 0) return 0;
  return (
    (gasAmountTotal(conduit.gas) / capacity) * ((conduit.temperature + 273.15) / (22 + 273.15))
  );
};

export const gasConduitPressure = (state: GameState, runId: TransportRunId): number =>
  gasLinePressureRatio(state, runId) * STANDARD_PRESSURE;

const destinationHeadroom = (state: GameState, runId: TransportRunId): number => {
  const definition = TRANSPORT_RUNS[runId].gas;
  if (!definition || definition.destinationKind === "gas_vent") return Number.POSITIVE_INFINITY;
  return roomGasHeadroom(state.rooms[definition.direction[1]]);
};

const destinationPressureRatio = (state: GameState, runId: TransportRunId): number => {
  const definition = TRANSPORT_RUNS[runId].gas;
  if (!definition || definition.destinationKind === "gas_vent") return 0;
  return roomPressure(state.rooms[definition.direction[1]]) / STANDARD_PRESSURE;
};

const sourcePressureRatio = (state: GameState, roomId: RoomId): number =>
  gasAmountTotal(state.gasJunctions[roomId].gas) / GAS_JUNCTIONS[roomId].capacity;

const desiredThroughput = (state: GameState, runId: TransportRunId, dt: number): number => {
  const definition = TRANSPORT_RUNS[runId].gas;
  if (!definition) return 0;
  const from = conduitEndpoint(state, runId, "gas", "from");
  const to = conduitEndpoint(state, runId, "gas", "to");
  const sourceDensity = gasRelativeDensity(
    state.gasJunctions[definition.direction[0]].gas,
    state.gasJunctions[definition.direction[0]].temperature
  );
  const buoyancy = (sourceDensity - 1) * (from.elevation - to.elevation) * 0.045;
  const pressureDrive =
    sourcePressureRatio(state, definition.direction[0]) - destinationPressureRatio(state, runId);
  const drive = definition.actuatorHead + pressureDrive + buoyancy;
  return conduitMaxFlow(state, runId, "gas") * clamp(drive / FULL_FLOW_DRIVE, 0, 1) * dt;
};

const initialPlan = (state: GameState, runId: TransportRunId, dt: number): GasPlan | null => {
  const definition = TRANSPORT_RUNS[runId].gas;
  const conduit = state.gasConduits[runId];
  if (!definition || !conduit.installed || !conduit.enabled) return null;
  const throughput = desiredThroughput(state, runId, dt);
  const retained = gasAmountTotal(conduit.gas);
  const capacity = conduitCapacity(state, runId, "gas");
  // An empty physical duct has a real swept volume: the leading packet cannot appear at
  // the far room until the routed conduit has filled. Once primed, outgoing inventory is
  // replaced at the inlet in the same step, preserving a stable through-flow.
  const primed = capacity > 0 && retained >= capacity - FULL_CONDUIT_EPSILON;
  const outgoingRequest = primed
    ? Math.min(throughput, retained, destinationHeadroom(state, runId))
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

const proportionallyAllocate = (
  plans: GasPlan[],
  key: "sourceRoomId" | "destinationRoomId",
  requestKey: "incomingRequest" | "outgoingRequest",
  amountKey: "incomingAmount" | "outgoingAmount",
  available: (id: RoomId) => number
): void => {
  const ids = [...new Set(plans.map((plan) => plan[key]))];
  for (const id of ids) {
    const matching = plans.filter((plan) => plan[key] === id);
    const requested = matching.reduce((total, plan) => total + plan[requestKey], 0);
    const scale = requested > 0 ? Math.min(1, available(id) / requested) : 0;
    for (const plan of matching) plan[amountKey] = plan[requestKey] * scale;
  }
};

const reconcileIncomingCapacity = (state: GameState, plans: GasPlan[]): void => {
  for (const plan of plans) {
    const retained = gasAmountTotal(state.gasConduits[plan.runId].gas);
    const capacity = conduitCapacity(state, plan.runId, "gas");
    const inletHeadroom = Math.max(0, capacity - retained + plan.outgoingAmount);
    plan.incomingRequest = Math.min(plan.incomingRequest, inletHeadroom);
    plan.incomingAmount = plan.incomingRequest;
  }
};

const deliverGas = (
  state: GameState,
  runId: TransportRunId,
  packet: GasAmounts,
  packetTemperature: number
): void => {
  const definition = TRANSPORT_RUNS[runId].gas;
  if (!definition) return;
  if (definition.destinationKind === "gas_vent") {
    addGas(state.gasVent, packet);
    return;
  }
  const roomId = definition.direction[1];
  const endpoint = conduitEndpoint(state, runId, "gas", "to");
  const zone = gasZoneForPort(roomPortHeight(roomId, endpoint.elevation));
  const target = state.rooms[roomId].gas[zone];
  const existing = totalGas(target);
  addGas(target, packet);
  state.rooms[roomId].gasTemperature[zone] = mixedTemperature(
    state.rooms[roomId].gasTemperature[zone],
    existing,
    packetTemperature,
    gasAmountTotal(packet)
  );
};

const clearReadout = (state: GameState, runId: TransportRunId): void => {
  const conduit = state.gasConduits[runId];
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
  dt: number
): boolean =>
  state.gasConduits[plan.runId].enabled &&
  desiredThroughput(state, plan.runId, dt) > 0.001 &&
  plan.outgoingAmount <= 0.0001 &&
  incomingAmount <= 0.0001;

const applyPlan = (state: GameState, plan: GasPlan, dt: number): void => {
  const conduit = state.gasConduits[plan.runId];
  const before = gasAmountTotal(conduit.gas);
  const outgoing = takeGas(conduit.gas, plan.outgoingAmount);
  deliverGas(state, plan.runId, outgoing, conduit.temperature);
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
  conduit.blocked = isBlockedAfterPlan(state, plan, incomingAmount, dt);
  if (conduit.blocked) conduit.flowCause = "backpressure";
};

export const simulateGasConduits = (state: GameState, dt: number): void => {
  for (const runId of TRANSPORT_RUN_IDS) clearReadout(state, runId);
  const plans = TRANSPORT_RUN_IDS.flatMap((runId) => {
    const plan = initialPlan(state, runId, dt);
    return plan ? [plan] : [];
  });

  proportionallyAllocate(
    plans.filter((plan) => TRANSPORT_RUNS[plan.runId].gas?.destinationKind === "room"),
    "destinationRoomId",
    "outgoingRequest",
    "outgoingAmount",
    (roomId) => roomGasHeadroom(state.rooms[roomId])
  );
  reconcileIncomingCapacity(state, plans);
  proportionallyAllocate(plans, "sourceRoomId", "incomingRequest", "incomingAmount", (roomId) =>
    junctionGasAvailable(state, roomId)
  );
  for (const plan of plans) applyPlan(state, plan, dt);
};

export const emptyGasConduitPacket = (): GasAmounts => emptyGas();
