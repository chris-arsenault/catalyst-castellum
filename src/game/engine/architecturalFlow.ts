import { facilityModelForMap } from "../world/derivedModel";
import { architecturalConnections } from "../world/map";
import type { GameDefinition } from "../definitionTypes";
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
import { proportionalMixture, subtractMixture } from "./mixture";
import { instance, roomState } from "../world/instances";

const GAS_DIFFUSION_FRACTION = 0.012;
const GAS_DRIVE_SCALE = 4;

const portalActive = (state: GameState, portal: FacilityPortalDefinition): boolean => {
  const portalState = state.portalStates[portal.id];
  return Boolean(portalState?.open && !portalState.sealed);
};

const packetFromGas = (gas: GasAmounts, amount: number): GasAmounts =>
  proportionalMixture(gas, amount, GAS_TYPES);

const packetFromLiquid = (liquid: LiquidAmounts, amount: number): LiquidAmounts =>
  proportionalMixture(liquid, amount, LIQUID_TYPES);

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

const gasZoneForEndpoint = (
  portal: FacilityPortalDefinition,
  endpointIndex: 0 | 1,
  definition: GameDefinition
): GasZone => {
  const roomId = portal.rooms[endpointIndex] as string;
  return gasZoneForPort(
    facilityModelForMap(definition.map).roomPortHeight(
      roomId,
      portal.endpoints[endpointIndex].elevation
    )
  );
};

const gasDrive = (
  state: GameState,
  portal: FacilityPortalDefinition,
  definition: GameDefinition
): number => {
  const [leftId, rightId] = portal.rooms;
  const leftZone = gasZoneForEndpoint(portal, 0, definition);
  const rightZone = gasZoneForEndpoint(portal, 1, definition);
  const pressureDrive =
    (roomPressure(roomState(state, leftId), definition) -
      roomPressure(roomState(state, rightId), definition)) /
    STANDARD_PRESSURE;
  if (portal.orientation !== "vertical") return pressureDrive;
  const leftIsLower = portal.endpoints[0].elevation < portal.endpoints[1].elevation;
  const densityDifference =
    roomZoneDensity(roomState(state, rightId), rightZone, definition) -
    roomZoneDensity(roomState(state, leftId), leftZone, definition);
  return pressureDrive + densityDifference * (leftIsLower ? 0.22 : -0.22);
};

const directedGasPlan = (
  state: GameState,
  portal: FacilityPortalDefinition,
  dt: number,
  definition: GameDefinition
): GasFlowPlan | null => {
  const drive = gasDrive(state, portal, definition);
  if (Math.abs(drive) < 1e-7) return null;
  const sourceIndex: 0 | 1 = drive > 0 ? 0 : 1;
  const destinationIndex: 0 | 1 = sourceIndex === 0 ? 1 : 0;
  const sourceRoomId = portal.rooms[sourceIndex] as string;
  const destinationRoomId = portal.rooms[destinationIndex] as string;
  const sourceZone = gasZoneForEndpoint(portal, sourceIndex, definition);
  const destinationZone = gasZoneForEndpoint(portal, destinationIndex, definition);
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
    packet: packetFromGas(roomState(state, sourceRoomId).gas[sourceZone], 0),
    temperature: roomState(state, sourceRoomId).gasTemperature[sourceZone],
  };
};

const diffusionPlans = (
  state: GameState,
  portal: FacilityPortalDefinition,
  dt: number,
  definition: GameDefinition
): GasFlowPlan[] => {
  const [leftId, rightId] = portal.rooms;
  const leftZone = gasZoneForEndpoint(portal, 0, definition);
  const rightZone = gasZoneForEndpoint(portal, 1, definition);
  const amount =
    Math.min(
      gasAmountTotal(roomState(state, leftId).gas[leftZone]),
      gasAmountTotal(roomState(state, rightId).gas[rightZone])
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
      packet: packetFromGas(roomState(state, leftId).gas[leftZone], 0),
      temperature: roomState(state, leftId).gasTemperature[leftZone],
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
      packet: packetFromGas(roomState(state, rightId).gas[rightZone], 0),
      temperature: roomState(state, rightId).gasTemperature[rightZone],
    },
  ];
};

const allocateGasPlans = (
  state: GameState,
  plans: GasFlowPlan[],
  definition: GameDefinition
): void => {
  const sourceKeys = [...new Set(plans.map((plan) => `${plan.sourceRoomId}:${plan.sourceZone}`))];
  for (const key of sourceKeys) {
    const matching = plans.filter((plan) => `${plan.sourceRoomId}:${plan.sourceZone}` === key);
    const first = matching[0];
    if (!first) continue;
    const available = gasAmountTotal(roomState(state, first.sourceRoomId).gas[first.sourceZone]);
    const requested = matching.reduce((total, plan) => total + plan.requested, 0);
    const scale = requested > 0 ? Math.min(1, available / requested) : 0;
    for (const plan of matching) plan.amount = plan.requested * scale;
  }
  for (const roomId of [...new Set(plans.map((plan) => plan.destinationRoomId))]) {
    const matching = plans.filter((plan) => plan.destinationRoomId === roomId);
    const requested = matching.reduce((total, plan) => total + plan.amount, 0);
    const scale =
      requested > 0
        ? Math.min(1, roomGasHeadroom(roomState(state, roomId), definition) / requested)
        : 0;
    for (const plan of matching) plan.amount *= scale;
  }
};

export const simulateArchitecturalGas = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  for (const portalState of Object.values(state.portalStates)) portalState.lastGasFlow = 0;
  const portals = architecturalConnections(definition.map).filter(
    (portal) => portal.gasConductance > 0 && portalActive(state, portal)
  );
  const plans = portals.flatMap((portal) => {
    const directed = directedGasPlan(state, portal, dt, definition);
    return [...(directed ? [directed] : []), ...diffusionPlans(state, portal, dt, definition)];
  });
  allocateGasPlans(state, plans, definition);
  for (const plan of plans) {
    plan.packet = packetFromGas(
      roomState(state, plan.sourceRoomId).gas[plan.sourceZone],
      plan.amount
    );
    subtractMixture(
      roomState(state, plan.sourceRoomId).gas[plan.sourceZone],
      plan.packet,
      GAS_TYPES
    );
  }
  for (const plan of plans) {
    const targetRoom = roomState(state, plan.destinationRoomId);
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
  dt: number,
  definition: GameDefinition
): LiquidFlowPlan | null => {
  if (portal.liquidMode === "blocked") return null;
  let sourceIndex: 0 | 1;
  let destinationIndex: 0 | 1;
  let head: number;
  if (portal.liquidMode === "drain") {
    [sourceIndex, destinationIndex] = verticalPortalOrder(portal);
    const source = roomState(state, portal.rooms[sourceIndex] as string);
    if (liquidAmountTotal(source.liquid) <= 1e-8) return null;
    head = Math.max(
      0.25,
      liquidSurfaceElevation(source, definition) -
        instance(definition.map.rooms, source.id, "map room").bounds.elevation
    );
  } else {
    const leftSurface = liquidSurfaceElevation(
      roomState(state, portal.rooms[0] as string),
      definition
    );
    const rightSurface = liquidSurfaceElevation(
      roomState(state, portal.rooms[1] as string),
      definition
    );
    if (Math.max(leftSurface, rightSurface) <= portal.sillElevation) return null;
    sourceIndex = leftSurface >= rightSurface ? 0 : 1;
    destinationIndex = sourceIndex === 0 ? 1 : 0;
    head = Math.max(
      0,
      Math.max(leftSurface, rightSurface) -
        Math.max(portal.sillElevation, Math.min(leftSurface, rightSurface))
    );
  }
  const sourceRoomId = portal.rooms[sourceIndex] as string;
  const destinationRoomId = portal.rooms[destinationIndex] as string;
  const requested = portal.liquidConductance * portal.aperture * Math.sqrt(head) * dt;
  return {
    portalId: portal.id,
    sign: sourceIndex === 0 ? 1 : -1,
    sourceRoomId,
    destinationRoomId,
    requested,
    amount: requested,
    packet: packetFromLiquid(roomState(state, sourceRoomId).liquid, 0),
  };
};

const allocateLiquidPlans = (
  state: GameState,
  plans: LiquidFlowPlan[],
  definition: GameDefinition
): void => {
  for (const roomId of [...new Set(plans.map((plan) => plan.sourceRoomId))]) {
    const matching = plans.filter((plan) => plan.sourceRoomId === roomId);
    const available = liquidAmountTotal(roomState(state, roomId).liquid);
    const requested = matching.reduce((total, plan) => total + plan.requested, 0);
    const scale = requested > 0 ? Math.min(1, available / requested) : 0;
    for (const plan of matching) plan.amount = plan.requested * scale;
  }
  for (const roomId of [...new Set(plans.map((plan) => plan.destinationRoomId))]) {
    const matching = plans.filter((plan) => plan.destinationRoomId === roomId);
    const requested = matching.reduce((total, plan) => total + plan.amount, 0);
    const scale =
      requested > 0
        ? Math.min(1, roomLiquidHeadroom(roomState(state, roomId), definition) / requested)
        : 0;
    for (const plan of matching) plan.amount *= scale;
  }
};

export const simulateArchitecturalLiquid = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  for (const portalState of Object.values(state.portalStates)) portalState.lastLiquidFlow = 0;
  const plans = architecturalConnections(definition.map).flatMap((portal) => {
    if (portal.liquidConductance <= 0 || !portalActive(state, portal)) return [];
    const plan = liquidPlan(state, portal, dt, definition);
    return plan ? [plan] : [];
  });
  allocateLiquidPlans(state, plans, definition);
  for (const plan of plans) {
    plan.packet = packetFromLiquid(roomState(state, plan.sourceRoomId).liquid, plan.amount);
    subtractMixture(roomState(state, plan.sourceRoomId).liquid, plan.packet, LIQUID_TYPES);
  }
  for (const plan of plans) {
    addLiquid(roomState(state, plan.destinationRoomId).liquid, plan.packet);
    state.portalStates[plan.portalId]!.lastLiquidFlow += (plan.sign * plan.amount) / dt;
  }
};

export const simulateArchitecturalFlow = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  simulateArchitecturalGas(state, dt, definition);
  simulateArchitecturalLiquid(state, dt, definition);
};
