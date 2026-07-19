import type { GameDefinition } from "../definitionTypes";
import type {
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
  RoomState,
  StationaryType,
} from "../types";
import { electrolyzerPower, electrolyzerRate, installedEquipment } from "./equipment";
import { addEvent } from "./events";
import { clamp } from "./math";
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
  definition: GameDefinition
): Array<[LimitingFactor, number]> => {
  const reaction = definition.reactions[operation.reactionId];
  return operation.outputs.map((output) => {
    const coefficient =
      reaction.products.find((product) => product.species === output.speciesId)?.coefficient ?? 1;
    return [
      { kind: "condition", code: output.limitCode, zone: null },
      outputHeadroom(instance, output) / coefficient,
    ];
  });
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
  const reaction = definition.reactions[operationDefinition.reactionId];
  if (reaction.behavior.kind !== "electrolysis")
    throw new Error(`Equipment ${instance.equipmentId} reaction is not electrolysis.`);
  const inventory = operationInventory(room, instance, operationDefinition, definition);
  const maximum =
    Math.min(
      reaction.behavior.maximumRate,
      electrolyzerRate(instance.equipmentId, instance.level, definition)
    ) * dt;
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory),
    ...outputCandidates(instance, operationDefinition, definition),
    [{ kind: "condition", code: "cell_current", zone: null }, maximum],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted);
  room.temperature = clamp(
    room.temperature + reacted * reaction.behavior.roomHeatPerExtent,
    0,
    180
  );
  operation.lastRate = reacted / Math.max(dt, 0.0001);
  operation.limitingFactor = candidates.reduce(
    (minimum, candidate) => (candidate[1] < minimum[1] ? candidate : minimum),
    candidates[0]!
  )[0];
  operation.powerDraw =
    reacted > 0 ? electrolyzerPower(instance.equipmentId, instance.level, definition) : 0;
  if (reacted > 0 && operation.totalProcessed === 0)
    addEvent(
      state,
      "reaction",
      "equipment_operation_started",
      { equipmentId: instance.equipmentId },
      room.id
    );
  operation.totalProcessed += reacted;
  room.reactionIntensity = Math.max(room.reactionIntensity, operation.lastRate);
  state.stats.reactions += reacted;
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
