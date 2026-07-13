import type { GameDefinition } from "../definition";
import type {
  GameState,
  GasType,
  LiquidType,
  LimitingFactor,
  ProcessDefinition,
  ProcessOutputDefinition,
  RoomState,
} from "../types";
import { findEquipmentInstallation, membraneCellPower, membraneCellRate } from "./equipment";
import { addEvent } from "./events";
import { clamp } from "./math";
import {
  applyReactionExtent,
  reactionReactantCandidates,
  type MutableReactionInventory,
} from "./reactionExecutor";
import { gasAmountTotal, liquidAmountTotal } from "./roomState";

const outputAmount = (state: GameState, output: ProcessOutputDefinition): number =>
  output.phase === "gas"
    ? state.gasBuffers[output.bufferId].gas[output.speciesId]
    : state.liquidBuffers[output.bufferId].liquid[output.speciesId];

const changeOutput = (state: GameState, output: ProcessOutputDefinition, delta: number): void => {
  if (output.phase === "gas") state.gasBuffers[output.bufferId].gas[output.speciesId] += delta;
  else state.liquidBuffers[output.bufferId].liquid[output.speciesId] += delta;
};

const processInventory = (
  state: GameState,
  room: RoomState,
  processDefinition: ProcessDefinition,
  definition: GameDefinition
): MutableReactionInventory => ({
  amount: (speciesId) => {
    const output = processDefinition.outputs.find((candidate) => candidate.speciesId === speciesId);
    if (output) return outputAmount(state, output);
    return definition.species[speciesId].phase === "gas"
      ? room.gas.lower[speciesId as GasType]
      : room.liquid[speciesId as LiquidType];
  },
  change: (speciesId, delta) => {
    const output = processDefinition.outputs.find((candidate) => candidate.speciesId === speciesId);
    if (output) {
      changeOutput(state, output, delta);
      return;
    }
    if (definition.species[speciesId].phase === "gas")
      room.gas.lower[speciesId as GasType] += delta;
    else room.liquid[speciesId as LiquidType] += delta;
  },
});

const outputHeadroom = (
  state: GameState,
  output: ProcessOutputDefinition,
  definition: GameDefinition
): number =>
  output.phase === "gas"
    ? definition.gasBuffers[output.bufferId].capacity -
      gasAmountTotal(state.gasBuffers[output.bufferId].gas)
    : definition.liquidBuffers[output.bufferId].capacity -
      liquidAmountTotal(state.liquidBuffers[output.bufferId].liquid);

const simulateSeparatorBackflow = (
  state: GameState,
  roomId: RoomState["id"],
  dt: number,
  processDefinition: ProcessDefinition,
  definition: GameDefinition
): void => {
  const policy = processDefinition.separatorBackflow;
  if (!policy) return;
  const process = state.processes[processDefinition.id];
  const left = state.gasBuffers[policy.leftBufferId].gas;
  const right = state.gasBuffers[policy.rightBufferId].gas;
  const leftFill = gasAmountTotal(left) / definition.gasBuffers[policy.leftBufferId].capacity;
  const rightFill = gasAmountTotal(right) / definition.gasBuffers[policy.rightBufferId].capacity;
  const difference = leftFill - rightFill;
  if (Math.abs(difference) < policy.activationDifference) return;

  const previousLeak = process.separatorLeakTotal;
  const source = difference > 0 ? left : right;
  const target = difference > 0 ? right : left;
  const species = difference > 0 ? policy.leftSpeciesId : policy.rightSpeciesId;
  const leaked = Math.min(
    source[species],
    (Math.abs(difference) - policy.flowOffset) * policy.rate * dt
  );
  source[species] -= leaked;
  target[species] += leaked;
  process.separatorLeakTotal += leaked;
  if (previousLeak === 0 && process.separatorLeakTotal > 0) {
    addEvent(state, "danger", "separator_cross_leak", {}, roomId);
  }
};

const outputCandidates = (
  state: GameState,
  processDefinition: ProcessDefinition,
  definition: GameDefinition
): Array<[LimitingFactor, number]> => {
  const reaction = definition.reactions[processDefinition.reactionId];
  return processDefinition.outputs.map((output) => {
    const coefficient =
      reaction.products.find((product) => product.species === output.speciesId)?.coefficient ?? 1;
    return [
      { kind: "condition", code: output.limitCode, zone: null },
      outputHeadroom(state, output, definition) / coefficient,
    ];
  });
};

const simulateElectrolysis = (
  state: GameState,
  dt: number,
  processDefinition: ProcessDefinition,
  definition: GameDefinition
): void => {
  const process = state.processes[processDefinition.id];
  const installation = findEquipmentInstallation(state, processDefinition.equipmentId, definition);
  if (!installation || !installation.instance.enabled) {
    Object.assign(process, {
      setting: 0,
      lastRate: 0,
      powerDraw: 0,
      limitingFactor: { kind: "condition", code: "offline", zone: null },
    });
    return;
  }
  process.setting = 1;
  const room = state.rooms[installation.roomId];
  const reaction = definition.reactions[processDefinition.reactionId];
  const behavior = reaction.behavior;
  if (behavior.kind !== "electrolysis") throw new Error("Electrolysis reaction is misconfigured");
  const inventory = processInventory(state, room, processDefinition, definition);
  const maximum = membraneCellRate(installation.instance.level, definition) * dt;
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, definition),
    ...outputCandidates(state, processDefinition, definition),
    [{ kind: "condition", code: "cell_current", zone: null }, maximum],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted, definition);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 180);
  process.lastRate = reacted / Math.max(dt, 0.0001);
  process.limitingFactor = candidates.reduce(
    (minimum, candidate) => (candidate[1] < minimum[1] ? candidate : minimum),
    candidates[0]!
  )[0];
  process.powerDraw = reacted > 0 ? membraneCellPower(installation.instance.level, definition) : 0;
  if (reacted > 0 && process.totalProcessed === 0) {
    addEvent(state, "reaction", "process_started", { processId: processDefinition.id }, room.id);
  }
  process.totalProcessed += reacted;
  room.reactionIntensity = Math.max(room.reactionIntensity, process.lastRate);
  state.stats.reactions += reacted;
  simulateSeparatorBackflow(state, room.id, dt, processDefinition, definition);
};

export const simulateProcesses = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  for (const processDefinition of Object.values(definition.processes)) {
    if (processDefinition.executor === "electrolysis") {
      simulateElectrolysis(state, dt, processDefinition, definition);
    }
  }
};
