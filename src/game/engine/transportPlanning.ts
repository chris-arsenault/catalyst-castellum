import type { RoomId, TransportRunId } from "../types";

export interface TransportPlan {
  runId: TransportRunId;
  sourceRoomId: RoomId;
  destinationRoomId: RoomId;
  outgoingRequest: number;
  outgoingAmount: number;
  incomingRequest: number;
  incomingAmount: number;
}

type RoomKey = "sourceRoomId" | "destinationRoomId";
type RequestKey = "incomingRequest" | "outgoingRequest";
type AmountKey = "incomingAmount" | "outgoingAmount";

export const allocateTransportPlans = <Plan extends TransportPlan>(
  plans: Plan[],
  roomKey: RoomKey,
  requestKey: RequestKey,
  amountKey: AmountKey,
  available: (roomId: RoomId) => number
): void => {
  for (const roomId of [...new Set(plans.map((plan) => plan[roomKey]))]) {
    const matching = plans.filter((plan) => plan[roomKey] === roomId);
    const requested = matching.reduce((total, plan) => total + plan[requestKey], 0);
    const scale = requested > 0 ? Math.min(1, available(roomId) / requested) : 0;
    for (const plan of matching) plan[amountKey] = plan[requestKey] * scale;
  }
};

export const reconcileTransportCapacity = <Plan extends TransportPlan>(
  plans: Plan[],
  retained: (runId: TransportRunId) => number,
  capacity: (runId: TransportRunId) => number
): void => {
  for (const plan of plans) {
    const inletHeadroom = Math.max(
      0,
      capacity(plan.runId) - retained(plan.runId) + plan.outgoingAmount
    );
    plan.incomingRequest = Math.min(plan.incomingRequest, inletHeadroom);
    plan.incomingAmount = plan.incomingRequest;
  }
};

export const transportPlanIsBlocked = (
  enabled: boolean,
  desiredThroughput: number,
  outgoingAmount: number,
  incomingAmount: number
): boolean =>
  enabled && desiredThroughput > 0.001 && outgoingAmount <= 0.0001 && incomingAmount <= 0.0001;
