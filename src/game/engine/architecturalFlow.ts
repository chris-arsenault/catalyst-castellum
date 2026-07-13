import { FACILITY_MAP, roomPortHeight } from "../content/facilityGeometry";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type FacilityPortalDefinition,
  type GameState,
  type GasAmounts,
  type GasZone,
  type LiquidAmounts,
  type RoomId,
} from "../types";
import { addGas, addLiquid, gasAmountTotal, liquidAmountTotal } from "./roomState";
import {
  gasZoneForPort,
  liquidSurfaceElevation,
  mixedTemperature,
  roomGasHeadroom,
  roomLiquidHeadroom,
  roomPressure,
  roomZoneDensity,
  STANDARD_PRESSURE,
} from "./physics";

const GAS_DIFFUSION_FRACTION = 0.012;
const GAS_DRIVE_SCALE = 4;

const portalActive = (state: GameState, portal: FacilityPortalDefinition): boolean => {
  const portalState = state.portalStates[portal.id];
  return Boolean(portalState?.open && !portalState.sealed);
};

const packetFromGas = (gas: GasAmounts, amount: number): GasAmounts => {
  const total = gasAmountTotal(gas);
  return Object.fromEntries(
    GAS_TYPES.map((species) => [species, total > 0 ? (gas[species] / total) * amount : 0])
  ) as GasAmounts;
};

const packetFromLiquid = (liquid: LiquidAmounts, amount: number): LiquidAmounts => {
  const total = liquidAmountTotal(liquid);
  return Object.fromEntries(
    LIQUID_TYPES.map((species) => [species, total > 0 ? (liquid[species] / total) * amount : 0])
  ) as LiquidAmounts;
};

const subtractGas = (target: GasAmounts, packet: GasAmounts): void => {
  for (const species of GAS_TYPES) target[species] = Math.max(0, target[species] - packet[species]);
};

const subtractLiquid = (target: LiquidAmounts, packet: LiquidAmounts): void => {
  for (const species of LIQUID_TYPES)
    target[species] = Math.max(0, target[species] - packet[species]);
};

interface GasFlowPlan {
  portalId: string;
  sign: 1 | -1;
  sourceRoomId: RoomId;
  sourceZone: GasZone;
  destinationRoomId: RoomId;
  destinationZone: GasZone;
  requested: number;
  amount: number;
  packet: GasAmounts;
  temperature: number;
}

const gasZoneForEndpoint = (portal: FacilityPortalDefinition, endpointIndex: 0 | 1): GasZone => {
  const roomId = portal.rooms[endpointIndex];
  return gasZoneForPort(roomPortHeight(roomId, portal.endpoints[endpointIndex].elevation));
};

const gasDrive = (state: GameState, portal: FacilityPortalDefinition): number => {
  const [leftId, rightId] = portal.rooms;
  const leftZone = gasZoneForEndpoint(portal, 0);
  const rightZone = gasZoneForEndpoint(portal, 1);
  const pressureDrive =
    (roomPressure(state.rooms[leftId]) - roomPressure(state.rooms[rightId])) / STANDARD_PRESSURE;
  if (portal.orientation !== "vertical") return pressureDrive;
  const leftIsLower = portal.endpoints[0].elevation < portal.endpoints[1].elevation;
  const densityDifference =
    roomZoneDensity(state.rooms[rightId], rightZone) -
    roomZoneDensity(state.rooms[leftId], leftZone);
  return pressureDrive + densityDifference * (leftIsLower ? 0.22 : -0.22);
};

const directedGasPlan = (
  state: GameState,
  portal: FacilityPortalDefinition,
  dt: number
): GasFlowPlan | null => {
  const drive = gasDrive(state, portal);
  if (Math.abs(drive) < 1e-7) return null;
  const sourceIndex: 0 | 1 = drive > 0 ? 0 : 1;
  const destinationIndex: 0 | 1 = sourceIndex === 0 ? 1 : 0;
  const sourceRoomId = portal.rooms[sourceIndex];
  const destinationRoomId = portal.rooms[destinationIndex];
  const sourceZone = gasZoneForEndpoint(portal, sourceIndex);
  const destinationZone = gasZoneForEndpoint(portal, destinationIndex);
  const requested =
    portal.gasConductance * portal.aperture * Math.abs(drive) * GAS_DRIVE_SCALE * dt;
  return {
    portalId: portal.id,
    sign: sourceIndex === 0 ? 1 : -1,
    sourceRoomId,
    sourceZone,
    destinationRoomId,
    destinationZone,
    requested,
    amount: requested,
    packet: packetFromGas(state.rooms[sourceRoomId].gas[sourceZone], 0),
    temperature: state.rooms[sourceRoomId].gasTemperature[sourceZone],
  };
};

const diffusionPlans = (
  state: GameState,
  portal: FacilityPortalDefinition,
  dt: number
): GasFlowPlan[] => {
  const [leftId, rightId] = portal.rooms;
  const leftZone = gasZoneForEndpoint(portal, 0);
  const rightZone = gasZoneForEndpoint(portal, 1);
  const amount =
    Math.min(
      gasAmountTotal(state.rooms[leftId].gas[leftZone]),
      gasAmountTotal(state.rooms[rightId].gas[rightZone])
    ) *
    portal.gasConductance *
    portal.aperture *
    GAS_DIFFUSION_FRACTION *
    dt;
  if (amount <= 1e-8) return [];
  return [
    {
      portalId: portal.id,
      sign: 1,
      sourceRoomId: leftId,
      sourceZone: leftZone,
      destinationRoomId: rightId,
      destinationZone: rightZone,
      requested: amount,
      amount,
      packet: packetFromGas(state.rooms[leftId].gas[leftZone], 0),
      temperature: state.rooms[leftId].gasTemperature[leftZone],
    },
    {
      portalId: portal.id,
      sign: -1,
      sourceRoomId: rightId,
      sourceZone: rightZone,
      destinationRoomId: leftId,
      destinationZone: leftZone,
      requested: amount,
      amount,
      packet: packetFromGas(state.rooms[rightId].gas[rightZone], 0),
      temperature: state.rooms[rightId].gasTemperature[rightZone],
    },
  ];
};

const allocateGasPlans = (state: GameState, plans: GasFlowPlan[]): void => {
  const sourceKeys = [...new Set(plans.map((plan) => `${plan.sourceRoomId}:${plan.sourceZone}`))];
  for (const key of sourceKeys) {
    const matching = plans.filter((plan) => `${plan.sourceRoomId}:${plan.sourceZone}` === key);
    const first = matching[0];
    if (!first) continue;
    const available = gasAmountTotal(state.rooms[first.sourceRoomId].gas[first.sourceZone]);
    const requested = matching.reduce((total, plan) => total + plan.requested, 0);
    const scale = requested > 0 ? Math.min(1, available / requested) : 0;
    for (const plan of matching) plan.amount = plan.requested * scale;
  }
  for (const roomId of [...new Set(plans.map((plan) => plan.destinationRoomId))]) {
    const matching = plans.filter((plan) => plan.destinationRoomId === roomId);
    const requested = matching.reduce((total, plan) => total + plan.amount, 0);
    const scale = requested > 0 ? Math.min(1, roomGasHeadroom(state.rooms[roomId]) / requested) : 0;
    for (const plan of matching) plan.amount *= scale;
  }
};

export const simulateArchitecturalGas = (state: GameState, dt: number): void => {
  for (const portalState of Object.values(state.portalStates)) portalState.lastGasFlow = 0;
  const portals = FACILITY_MAP.portals.filter(
    (portal) => portal.gasConductance > 0 && portalActive(state, portal)
  );
  const plans = portals.flatMap((portal) => {
    const directed = directedGasPlan(state, portal, dt);
    return [...(directed ? [directed] : []), ...diffusionPlans(state, portal, dt)];
  });
  allocateGasPlans(state, plans);
  for (const plan of plans) {
    plan.packet = packetFromGas(state.rooms[plan.sourceRoomId].gas[plan.sourceZone], plan.amount);
    subtractGas(state.rooms[plan.sourceRoomId].gas[plan.sourceZone], plan.packet);
  }
  for (const plan of plans) {
    const targetRoom = state.rooms[plan.destinationRoomId];
    const target = targetRoom.gas[plan.destinationZone];
    const before = gasAmountTotal(target);
    addGas(target, plan.packet);
    targetRoom.gasTemperature[plan.destinationZone] = mixedTemperature(
      targetRoom.gasTemperature[plan.destinationZone],
      before,
      plan.temperature,
      plan.amount
    );
    state.portalStates[plan.portalId]!.lastGasFlow += (plan.sign * plan.amount) / dt;
  }
};

interface LiquidFlowPlan {
  portalId: string;
  sign: 1 | -1;
  sourceRoomId: RoomId;
  destinationRoomId: RoomId;
  requested: number;
  amount: number;
  packet: LiquidAmounts;
}

export const verticalPortalOrder = (portal: FacilityPortalDefinition): readonly [0 | 1, 0 | 1] => {
  const leftElevation = portal.endpoints[0].elevation;
  const rightElevation = portal.endpoints[1].elevation;
  return leftElevation >= rightElevation ? [0, 1] : [1, 0];
};

const liquidPlan = (
  state: GameState,
  portal: FacilityPortalDefinition,
  dt: number
): LiquidFlowPlan | null => {
  if (portal.liquidMode === "blocked") return null;
  let sourceIndex: 0 | 1;
  let destinationIndex: 0 | 1;
  let head: number;
  if (portal.liquidMode === "drain") {
    [sourceIndex, destinationIndex] = verticalPortalOrder(portal);
    const source = state.rooms[portal.rooms[sourceIndex]];
    if (liquidAmountTotal(source.liquid) <= 1e-8) return null;
    head = Math.max(
      0.25,
      liquidSurfaceElevation(source) - FACILITY_MAP.rooms[source.id].bounds.elevation
    );
  } else {
    const leftSurface = liquidSurfaceElevation(state.rooms[portal.rooms[0]]);
    const rightSurface = liquidSurfaceElevation(state.rooms[portal.rooms[1]]);
    if (Math.max(leftSurface, rightSurface) <= portal.sillElevation) return null;
    sourceIndex = leftSurface >= rightSurface ? 0 : 1;
    destinationIndex = sourceIndex === 0 ? 1 : 0;
    head = Math.max(
      0,
      Math.max(leftSurface, rightSurface) -
        Math.max(portal.sillElevation, Math.min(leftSurface, rightSurface))
    );
  }
  const sourceRoomId = portal.rooms[sourceIndex];
  const destinationRoomId = portal.rooms[destinationIndex];
  const requested = portal.liquidConductance * portal.aperture * Math.sqrt(head) * dt;
  return {
    portalId: portal.id,
    sign: sourceIndex === 0 ? 1 : -1,
    sourceRoomId,
    destinationRoomId,
    requested,
    amount: requested,
    packet: packetFromLiquid(state.rooms[sourceRoomId].liquid, 0),
  };
};

const allocateLiquidPlans = (state: GameState, plans: LiquidFlowPlan[]): void => {
  for (const roomId of [...new Set(plans.map((plan) => plan.sourceRoomId))]) {
    const matching = plans.filter((plan) => plan.sourceRoomId === roomId);
    const available = liquidAmountTotal(state.rooms[roomId].liquid);
    const requested = matching.reduce((total, plan) => total + plan.requested, 0);
    const scale = requested > 0 ? Math.min(1, available / requested) : 0;
    for (const plan of matching) plan.amount = plan.requested * scale;
  }
  for (const roomId of [...new Set(plans.map((plan) => plan.destinationRoomId))]) {
    const matching = plans.filter((plan) => plan.destinationRoomId === roomId);
    const requested = matching.reduce((total, plan) => total + plan.amount, 0);
    const scale =
      requested > 0 ? Math.min(1, roomLiquidHeadroom(state.rooms[roomId]) / requested) : 0;
    for (const plan of matching) plan.amount *= scale;
  }
};

export const simulateArchitecturalLiquid = (state: GameState, dt: number): void => {
  for (const portalState of Object.values(state.portalStates)) portalState.lastLiquidFlow = 0;
  const plans = FACILITY_MAP.portals.flatMap((portal) => {
    if (portal.liquidConductance <= 0 || !portalActive(state, portal)) return [];
    const plan = liquidPlan(state, portal, dt);
    return plan ? [plan] : [];
  });
  allocateLiquidPlans(state, plans);
  for (const plan of plans) {
    plan.packet = packetFromLiquid(state.rooms[plan.sourceRoomId].liquid, plan.amount);
    subtractLiquid(state.rooms[plan.sourceRoomId].liquid, plan.packet);
  }
  for (const plan of plans) {
    addLiquid(state.rooms[plan.destinationRoomId].liquid, plan.packet);
    state.portalStates[plan.portalId]!.lastLiquidFlow += (plan.sign * plan.amount) / dt;
  }
};

export const simulateArchitecturalFlow = (state: GameState, dt: number): void => {
  simulateArchitecturalGas(state, dt);
  simulateArchitecturalLiquid(state, dt);
};
