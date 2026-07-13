import {
  LIQUID_TYPES,
  TRANSPORT_RUN_IDS,
  type FlowCause,
  type GameState,
  type LiquidAmounts,
  type LiquidConduitState,
  type RoomId,
  type TransportRunId,
} from "../types";
import { TRANSPORT_RUNS } from "../config";
import { clamp } from "./math";
import { addLiquid, liquidAmountTotal, takeLiquid } from "./roomState";
import { liquidRelativeDensity, roomLiquidHeadroom } from "./physics";
import {
  conduitCapacity,
  conduitCrestElevation,
  conduitEndpoint,
  conduitMaxFlow,
} from "./networkGeometry";
import { junctionLiquidAvailable, takeLiquidFromJunction } from "./junctions";

const FULL_FLOW_HEAD = 3;
const FULL_CONDUIT_EPSILON = 1e-6;

interface LiquidPlan {
  runId: TransportRunId;
  sourceRoomId: RoomId;
  destinationRoomId: RoomId;
  outgoingRequest: number;
  outgoingAmount: number;
  incomingRequest: number;
  incomingAmount: number;
}

const destinationHeadroom = (state: GameState, runId: TransportRunId): number => {
  const definition = TRANSPORT_RUNS[runId].liquid;
  if (!definition || definition.destinationKind === "liquid_recovery") {
    return Number.POSITIVE_INFINITY;
  }
  return roomLiquidHeadroom(state.rooms[definition.direction[1]]);
};

const desiredThroughput = (state: GameState, runId: TransportRunId, dt: number): number => {
  const definition = TRANSPORT_RUNS[runId].liquid;
  if (!definition) return 0;
  const source = conduitEndpoint(state, runId, "liquid", "from");
  const destination = conduitEndpoint(state, runId, "liquid", "to");
  const crest = conduitCrestElevation(state, runId, "liquid");
  const lift = Math.max(0, crest - source.elevation);
  const fall = Math.max(0, source.elevation - destination.elevation);
  const density = liquidRelativeDensity(state.liquidJunctions[definition.direction[0]].liquid);
  const actuatorHead =
    definition.actuator === "pump" ? definition.actuatorHead / Math.max(0.5, density) : 0;
  const drive = actuatorHead + fall - lift;
  return conduitMaxFlow(state, runId, "liquid") * clamp(drive / FULL_FLOW_HEAD, 0, 1) * dt;
};

const initialPlan = (state: GameState, runId: TransportRunId, dt: number): LiquidPlan | null => {
  const definition = TRANSPORT_RUNS[runId].liquid;
  const conduit = state.liquidConduits[runId];
  if (!definition || !conduit.installed || !conduit.enabled) return null;
  const throughput = desiredThroughput(state, runId, dt);
  const retained = liquidAmountTotal(conduit.liquid);
  const capacity = conduitCapacity(state, runId, "liquid");
  // Route volume is transport latency, not decorative storage. The leading liquid packet
  // reaches the destination only after the complete routed pipe has been swept full.
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

const allocateByRoom = (
  plans: LiquidPlan[],
  roomKey: "sourceRoomId" | "destinationRoomId",
  requestKey: "incomingRequest" | "outgoingRequest",
  amountKey: "incomingAmount" | "outgoingAmount",
  available: (roomId: RoomId) => number
): void => {
  for (const roomId of [...new Set(plans.map((plan) => plan[roomKey]))]) {
    const matching = plans.filter((plan) => plan[roomKey] === roomId);
    const requested = matching.reduce((total, plan) => total + plan[requestKey], 0);
    const scale = requested > 0 ? Math.min(1, available(roomId) / requested) : 0;
    for (const plan of matching) plan[amountKey] = plan[requestKey] * scale;
  }
};

const reconcileIncomingCapacity = (state: GameState, plans: LiquidPlan[]): void => {
  for (const plan of plans) {
    const retained = liquidAmountTotal(state.liquidConduits[plan.runId].liquid);
    const capacity = conduitCapacity(state, plan.runId, "liquid");
    const inletHeadroom = Math.max(0, capacity - retained + plan.outgoingAmount);
    plan.incomingRequest = Math.min(plan.incomingRequest, inletHeadroom);
    plan.incomingAmount = plan.incomingRequest;
  }
};

const deliverLiquid = (state: GameState, runId: TransportRunId, packet: LiquidAmounts): void => {
  const definition = TRANSPORT_RUNS[runId].liquid;
  if (!definition) return;
  if (definition.destinationKind === "liquid_recovery") {
    addLiquid(state.liquidDrain, packet);
    return;
  }
  addLiquid(state.rooms[definition.direction[1]].liquid, packet);
};

const clearReadout = (state: GameState, runId: TransportRunId): void => {
  const conduit = state.liquidConduits[runId];
  conduit.lastFlow = 0;
  conduit.blocked = false;
  conduit.flowCause = "idle";
  for (const species of LIQUID_TYPES) conduit.lastSpeciesFlow[species] = 0;
};

const measuredCause = (outgoingAmount: number, incomingAmount: number): FlowCause => {
  if (outgoingAmount > 0) return "pump";
  if (incomingAmount > 0) return "priming";
  return "idle";
};

const rate = (amount: number, dt: number): number => (dt > 0 ? amount / dt : 0);

const updateReadout = (
  conduit: LiquidConduitState,
  outgoing: LiquidAmounts,
  incoming: LiquidAmounts,
  dt: number
): void => {
  const outgoingAmount = liquidAmountTotal(outgoing);
  const incomingAmount = liquidAmountTotal(incoming);
  let measuredAmount = incomingAmount;
  let measuredPacket = incoming;
  if (outgoingAmount > 0) {
    measuredAmount = outgoingAmount;
    measuredPacket = outgoing;
  }
  conduit.lastFlow = rate(measuredAmount, dt);
  for (const species of LIQUID_TYPES) {
    conduit.lastSpeciesFlow[species] = rate(measuredPacket[species], dt);
  }
  conduit.flowCause = measuredCause(outgoingAmount, incomingAmount);
};

const isBlockedAfterPlan = (
  state: GameState,
  plan: LiquidPlan,
  incomingAmount: number,
  dt: number
): boolean =>
  state.liquidConduits[plan.runId].enabled &&
  desiredThroughput(state, plan.runId, dt) > 0.001 &&
  plan.outgoingAmount <= 0.0001 &&
  incomingAmount <= 0.0001;

const applyPlan = (state: GameState, plan: LiquidPlan, dt: number): void => {
  const conduit = state.liquidConduits[plan.runId];
  const outgoing = takeLiquid(conduit.liquid, plan.outgoingAmount);
  deliverLiquid(state, plan.runId, outgoing);
  const incoming = takeLiquidFromJunction(state, plan.sourceRoomId, plan.incomingAmount);
  const incomingAmount = liquidAmountTotal(incoming);
  addLiquid(conduit.liquid, incoming);
  updateReadout(conduit, outgoing, incoming, dt);
  conduit.blocked = isBlockedAfterPlan(state, plan, incomingAmount, dt);
  if (conduit.blocked) conduit.flowCause = "backpressure";
};

export const simulateLiquidConduits = (state: GameState, dt: number): void => {
  for (const runId of TRANSPORT_RUN_IDS) clearReadout(state, runId);
  const plans = TRANSPORT_RUN_IDS.flatMap((runId) => {
    const plan = initialPlan(state, runId, dt);
    return plan ? [plan] : [];
  });
  allocateByRoom(
    plans.filter((plan) => TRANSPORT_RUNS[plan.runId].liquid?.destinationKind === "room"),
    "destinationRoomId",
    "outgoingRequest",
    "outgoingAmount",
    (roomId) => roomLiquidHeadroom(state.rooms[roomId])
  );
  reconcileIncomingCapacity(state, plans);
  allocateByRoom(plans, "sourceRoomId", "incomingRequest", "incomingAmount", (roomId) =>
    junctionLiquidAvailable(state, roomId)
  );
  for (const plan of plans) applyPlan(state, plan, dt);
};

export const liquidConduitFillRatio = (state: GameState, runId: TransportRunId): number => {
  const capacity = conduitCapacity(state, runId, "liquid");
  return capacity > 0 ? liquidAmountTotal(state.liquidConduits[runId].liquid) / capacity : 0;
};

export const liquidConduitCrestElevation = (state: GameState, runId: TransportRunId): number =>
  conduitCrestElevation(state, runId, "liquid");
