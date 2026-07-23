import type { GameDefinition } from "../definitionTypes";
import type {
  EquipmentDutyDefinition,
  EquipmentInstance,
  EquipmentOperationState,
  EquipmentOutputDefinition,
  EquipmentOutputState,
  EquipmentReactionOperationDefinition,
  EquipmentSeparatorBackflowDefinition,
  GameState,
  GasAmounts,
  GasType,
  LimitingFactor,
  LiquidType,
  ReactionDefinition,
  RoomReactionId,
  RoomState,
  StationaryType,
} from "../types";
import { installedEquipment, operationPowerDraw, operationProcessRate } from "./equipment";
import { addEvent } from "./events";
import { clamp } from "./math";
import { simulateMassActionSet, type MassActionReaction } from "./massActionReactions";
import {
  applyReactionExtent,
  reactionReactantCandidates,
  type MutableReactionInventory,
} from "./reactionExecutor";
import { gasAmountTotal, liquidAmountTotal } from "./roomState";
import { roomState } from "../world/instances";

const outputState = (
  instance: EquipmentInstance,
  output: EquipmentOutputDefinition
): EquipmentOutputState => {
  const state = instance.operation?.outputs[output.id];
  if (!state || state.phase !== output.phase)
    throw new Error(`Equipment ${instance.equipmentId} output ${output.id} is missing.`);
  return state;
};

const outputAmount = (instance: EquipmentInstance, output: EquipmentOutputDefinition): number => {
  const state = outputState(instance, output);
  return state.phase === "gas"
    ? state.gas[output.speciesId as GasType]
    : state.liquid[output.speciesId as LiquidType];
};

const changeOutput = (
  instance: EquipmentInstance,
  output: EquipmentOutputDefinition,
  delta: number
): void => {
  const state = outputState(instance, output);
  if (state.phase === "gas") state.gas[output.speciesId as GasType] += delta;
  else state.liquid[output.speciesId as LiquidType] += delta;
};

const operationInventory = (
  room: RoomState,
  instance: EquipmentInstance,
  operation: EquipmentReactionOperationDefinition,
  definition: GameDefinition
): MutableReactionInventory => ({
  amount: (speciesId) => {
    const output = operation.outputs.find((candidate) => candidate.speciesId === speciesId);
    if (output) return outputAmount(instance, output);
    const phase = definition.species[speciesId].phase;
    if (phase === "gas") return room.gas.lower[speciesId as GasType];
    if (phase === "liquid") return room.liquid[speciesId as LiquidType];
    return room.stationary[speciesId as StationaryType];
  },
  change: (speciesId, delta) => {
    const output = operation.outputs.find((candidate) => candidate.speciesId === speciesId);
    if (output) {
      changeOutput(instance, output, delta);
      return;
    }
    const phase = definition.species[speciesId].phase;
    if (phase === "gas") room.gas.lower[speciesId as GasType] += delta;
    else if (phase === "liquid") room.liquid[speciesId as LiquidType] += delta;
    else room.stationary[speciesId as StationaryType] += delta;
  },
});

const outputHeadroom = (instance: EquipmentInstance, output: EquipmentOutputDefinition): number => {
  const state = outputState(instance, output);
  const amount =
    state.phase === "gas" ? gasAmountTotal(state.gas) : liquidAmountTotal(state.liquid);
  return output.capacity - amount;
};

const gasOutput = (
  instance: EquipmentInstance,
  outputId: keyof EquipmentOperationState["outputs"]
) => {
  const output = instance.operation?.outputs[outputId];
  if (!output || output.phase !== "gas")
    throw new Error(`Equipment ${instance.equipmentId} gas output ${outputId} is missing.`);
  return output.gas;
};

const separatorFlow = (
  difference: number,
  left: GasAmounts,
  right: GasAmounts,
  policy: EquipmentSeparatorBackflowDefinition
): { source: GasAmounts; target: GasAmounts; species: GasType } =>
  difference > 0
    ? { source: left, target: right, species: policy.leftSpeciesId }
    : { source: right, target: left, species: policy.rightSpeciesId };

const simulateSeparatorBackflow = (
  state: GameState,
  room: RoomState,
  dt: number,
  instance: EquipmentInstance,
  operation: EquipmentReactionOperationDefinition
): void => {
  const policy = operation.separatorBackflow;
  const operationState = instance.operation;
  if (!policy || !operationState) return;
  const leftDefinition = operation.outputs.find(({ id }) => id === policy.leftOutputId);
  const rightDefinition = operation.outputs.find(({ id }) => id === policy.rightOutputId);
  if (!leftDefinition || !rightDefinition)
    throw new Error(`Equipment ${instance.equipmentId} separator outputs are missing.`);
  const left = gasOutput(instance, policy.leftOutputId);
  const right = gasOutput(instance, policy.rightOutputId);
  const difference =
    gasAmountTotal(left) / leftDefinition.capacity -
    gasAmountTotal(right) / rightDefinition.capacity;
  if (Math.abs(difference) < policy.activationDifference) return;

  const previousLeak = operationState.separatorLeakTotal;
  const { source, target, species } = separatorFlow(difference, left, right, policy);
  const leaked = Math.min(
    source[species],
    (Math.abs(difference) - policy.flowOffset) * policy.rate * dt
  );
  source[species] -= leaked;
  target[species] += leaked;
  operationState.separatorLeakTotal += leaked;
  if (previousLeak === 0 && operationState.separatorLeakTotal > 0)
    addEvent(state, "danger", "separator_cross_leak", {}, room.id);
};

const outputCandidates = (
  instance: EquipmentInstance,
  operation: EquipmentReactionOperationDefinition,
  reaction: ReactionDefinition
): Array<[LimitingFactor, number]> =>
  operation.outputs.flatMap((output) => {
    const product = reaction.products.find((candidate) => candidate.species === output.speciesId);
    if (!product) return [];
    return [
      [
        { kind: "condition", code: output.limitCode, zone: null },
        outputHeadroom(instance, output) / product.coefficient,
      ] satisfies [LimitingFactor, number],
    ];
  });

const activeDuty = (
  instance: EquipmentInstance,
  operation: EquipmentReactionOperationDefinition
): EquipmentDutyDefinition | null =>
  operation.duties.find((duty) => duty.medium === instance.medium) ?? null;

const runElectrolysisDuty = (
  instance: EquipmentInstance,
  operation: EquipmentOperationState,
  operationDefinition: EquipmentReactionOperationDefinition,
  room: RoomState,
  reactions: readonly ReactionDefinition[],
  rateCap: number,
  dt: number,
  definition: GameDefinition
): number => {
  let total = 0;
  let limitingCandidates: Array<[LimitingFactor, number]> | null = null;
  let limitingExtent = -1;
  for (const reaction of reactions) {
    const behavior = reaction.behavior;
    if (behavior.kind !== "electrolysis") continue;
    const inventory = operationInventory(room, instance, operationDefinition, definition);
    const maximum = Math.min(behavior.maximumRate, rateCap) * dt;
    const candidates: Array<[LimitingFactor, number]> = [
      ...reactionReactantCandidates(reaction, inventory),
      ...outputCandidates(instance, operationDefinition, reaction),
      [{ kind: "condition", code: "cell_current", zone: null }, maximum],
    ];
    const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
    applyReactionExtent(reaction, inventory, reacted);
    room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 180);
    total += reacted;
    if (reacted > limitingExtent) {
      limitingExtent = reacted;
      limitingCandidates = candidates;
    }
  }
  if (limitingCandidates && limitingCandidates.length > 0)
    operation.limitingFactor = limitingCandidates.reduce(
      (minimum, candidate) => (candidate[1] < minimum[1] ? candidate : minimum),
      limitingCandidates[0]!
    )[0];
  return total;
};

const runVesselDuty = (
  instance: EquipmentInstance,
  operation: EquipmentOperationState,
  room: RoomState,
  reactions: readonly ReactionDefinition[],
  rateCap: number,
  dt: number,
  definition: GameDefinition
): number => {
  const massAction = reactions.filter(
    (reaction): reaction is MassActionReaction => reaction.behavior.kind === "mass_action"
  );
  const total = simulateMassActionSet(room, dt, definition, massAction, {
    rateCap,
    loadedMedium: instance.medium,
    equipmentMultiplier: 1,
  });
  const dominant = massAction.reduce<MassActionReaction | null>((best, reaction) => {
    if (!best) return reaction;
    const bestTelemetry = room.reactions[best.id as RoomReactionId];
    const telemetry = room.reactions[reaction.id as RoomReactionId];
    return telemetry.lastRate > bestTelemetry.lastRate ? reaction : best;
  }, null);
  if (dominant)
    operation.limitingFactor = room.reactions[dominant.id as RoomReactionId].limitingFactor;
  return total;
};

const setOffline = (operation: EquipmentOperationState): void => {
  operation.lastRate = 0;
  operation.powerDraw = 0;
  operation.limitingFactor = { kind: "condition", code: "offline", zone: null };
};

const simulateReactionOperation = (
  state: GameState,
  room: RoomState,
  instance: EquipmentInstance,
  dt: number,
  definition: GameDefinition
): void => {
  const equipment = definition.equipment[instance.equipmentId];
  const operationDefinition = equipment.operation;
  const operation = instance.operation;
  if (!operationDefinition || !operation) return;
  if (!instance.enabled) {
    setOffline(operation);
    return;
  }
  const duty = activeDuty(instance, operationDefinition);
  if (!duty) {
    operation.lastRate = 0;
    operation.powerDraw = 0;
    operation.limitingFactor = { kind: "condition", code: "vessel_medium", zone: null };
    return;
  }
  const rateCap = operationProcessRate(instance.equipmentId, instance.level, definition);
  const reactions = duty.reactionIds.map((reactionId) => definition.reactions[reactionId]);
  const total = reactions.some((reaction) => reaction.behavior.kind === "electrolysis")
    ? runElectrolysisDuty(
        instance,
        operation,
        operationDefinition,
        room,
        reactions,
        rateCap,
        dt,
        definition
      )
    : runVesselDuty(instance, operation, room, reactions, rateCap, dt, definition);
  operation.lastRate = total / Math.max(dt, 0.0001);
  operation.powerDraw =
    total > 0 ? operationPowerDraw(instance.equipmentId, instance.level, definition) : 0;
  if (total > 0 && operation.totalProcessed === 0)
    addEvent(
      state,
      "reaction",
      "equipment_operation_started",
      { equipmentId: instance.equipmentId },
      room.id
    );
  operation.totalProcessed += total;
  room.reactionIntensity = Math.max(room.reactionIntensity, operation.lastRate);
  state.stats.reactions += total;
  simulateSeparatorBackflow(state, room, dt, instance, operationDefinition);
};

export const simulateEquipmentOperations = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  for (const roomId of state.world.rooms) {
    const room = roomState(state, roomId);
    for (const instance of installedEquipment(room))
      simulateReactionOperation(state, room, instance, dt, definition);
  }
};
