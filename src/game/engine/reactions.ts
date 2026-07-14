import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import {
  GAS_ZONES,
  ROOM_REACTION_IDS,
  type GameState,
  type GasZone,
  type LimitingFactor,
  type RoomReactionId,
  type RoomState,
} from "../types";
import { addEvent } from "./events";
import type { HazardBurst } from "./damage";
import { roomContactReactionMultiplier, roomGasReactionMultiplier } from "./equipment";
import { simulateHydrogenOxygenFlash } from "./flashReaction";
import { clamp } from "./math";
import { simulateProcesses } from "./processExecutor";
import {
  applyReactionExtent,
  reactionReactantCandidates,
  type MutableReactionInventory,
} from "./reactionExecutor";
import { analyzeRoom, liquidTotal, roomGasHeadroom, roomLiquidHeadroom } from "./roomState";

const PRESSURE_PULSE_DECAY_PER_SECOND = 160;

const rate = (amount: number, dt: number): number => amount / Math.max(dt, 0.0001);

const setTelemetry = (
  room: RoomState,
  reactionId: RoomReactionId,
  amount: number,
  dt: number,
  limitingFactor: LimitingFactor
): void => {
  const telemetry = room.reactions[reactionId];
  if (amount > 0) {
    telemetry.lastRate += rate(amount, dt);
    telemetry.limitingFactor = limitingFactor;
    room.reactionIntensity = Math.max(room.reactionIntensity, rate(amount, dt));
  } else if (telemetry.lastRate <= 0) {
    telemetry.limitingFactor = limitingFactor;
  }
};

const limitingFactor = (candidates: Array<[LimitingFactor, number]>): LimitingFactor =>
  candidates.reduce((minimum, candidate) => (candidate[1] < minimum[1] ? candidate : minimum))[0];

const recordReaction = (state: GameState, amount: number): void => {
  state.stats.reactions += amount;
};

const hasEvent = (state: GameState, code: GameState["events"][number]["code"]): boolean =>
  state.events.some((event) => event.code === code);

const roomReactionInventory = (room: RoomState, zone: GasZone): MutableReactionInventory => ({
  amount: (speciesId) =>
    speciesId in room.gas[zone]
      ? room.gas[zone][speciesId as keyof (typeof room.gas)[typeof zone]]
      : room.liquid[speciesId as keyof typeof room.liquid],
  change: (speciesId, delta) => {
    if (speciesId in room.gas[zone]) {
      room.gas[zone][speciesId as keyof (typeof room.gas)[typeof zone]] += delta;
    } else {
      room.liquid[speciesId as keyof typeof room.liquid] += delta;
    }
  },
});

export interface HydrogenChlorineReactionStatus {
  activation: number;
  activationTemperature: number;
  availableExtent: number;
  chlorineAmount: number;
  chlorineReady: boolean;
  fullActivationTemperature: number;
  hydrogenAmount: number;
  hydrogenReady: boolean;
  reactionMultiplier: number;
  ready: boolean;
  temperature: number;
  temperatureReady: boolean;
  zone: GasZone;
}

export const hydrogenChlorineReactionStatus = (
  room: RoomState,
  zone: GasZone,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): HydrogenChlorineReactionStatus => {
  const behavior = definition.reactions.hydrogen_chlorine_recombination.behavior;
  if (behavior.kind !== "gas_recombination")
    throw new Error("Hydrogen-chlorine reaction is misconfigured");
  const gas = room.gas[zone];
  const activation = clamp(
    (room.gasTemperature[zone] - behavior.activationTemperature) / behavior.activationRange,
    0,
    1
  );
  const hydrogenReady = gas.hydrogen > 1e-8;
  const chlorineReady = gas.chlorine > 1e-8;
  const temperatureReady = activation > 0;
  return {
    activation,
    activationTemperature: behavior.activationTemperature,
    availableExtent: Math.min(gas.hydrogen, gas.chlorine),
    chlorineAmount: gas.chlorine,
    chlorineReady,
    fullActivationTemperature: behavior.activationTemperature + behavior.activationRange,
    hydrogenAmount: gas.hydrogen,
    hydrogenReady,
    reactionMultiplier: roomGasReactionMultiplier(room, definition),
    ready: hydrogenReady && chlorineReady && temperatureReady,
    temperature: room.gasTemperature[zone],
    temperatureReady,
    zone,
  };
};

const simulateHydrogenChlorine = (
  state: GameState,
  room: RoomState,
  zone: GasZone,
  dt: number,
  definition: GameDefinition
): void => {
  const reaction = definition.reactions.hydrogen_chlorine_recombination;
  const behavior = reaction.behavior;
  if (behavior.kind !== "gas_recombination")
    throw new Error("Hydrogen-chlorine reaction is misconfigured");
  const inventory = roomReactionInventory(room, zone);
  const status = hydrogenChlorineReactionStatus(room, zone, definition);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, definition, zone),
    [
      { kind: "condition", code: "activation_temperature", zone },
      behavior.maximumRate * status.activation * status.reactionMultiplier * dt,
    ],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted, definition);
  room.gasTemperature[zone] = clamp(
    room.gasTemperature[zone] + reacted * behavior.gasHeatPerExtent,
    0,
    260
  );
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 220);
  setTelemetry(room, "hydrogen_chlorine_recombination", reacted, dt, limitingFactor(candidates));
  recordReaction(state, reacted);
  if (reacted > 0 && room.id === "furnace" && !hasEvent(state, "hcl_production_started")) {
    addEvent(state, "reaction", "hcl_production_started", {}, "furnace");
  }
};

const simulateHydrogenChlorideAbsorption = (
  state: GameState,
  room: RoomState,
  dt: number,
  definition: GameDefinition
): void => {
  const reaction = definition.reactions.hydrogen_chloride_absorption;
  const behavior = reaction.behavior;
  if (behavior.kind !== "absorption") throw new Error("Absorption reaction is misconfigured");
  const inventory = roomReactionInventory(room, "lower");
  const aqueousInventory = liquidTotal(room);
  const solventFactor = clamp(aqueousInventory / behavior.solventInventoryScale, 0, 1);
  const acidFraction = room.liquid.hydrochloric_acid / Math.max(aqueousInventory, 0.1);
  const contactMultiplier = roomContactReactionMultiplier(room, definition);
  const concentrationHeadroom =
    Math.max(0, behavior.maximumProductFraction - acidFraction) * Math.max(aqueousInventory, 1);
  const volumeHeadroom = roomLiquidHeadroom(room, definition);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, definition, "lower"),
    [
      { kind: "condition", code: "aqueous_solvent", zone: "lower" },
      behavior.maximumRate * solventFactor * contactMultiplier * dt,
    ],
    [{ kind: "condition", code: "product_concentration", zone: "lower" }, concentrationHeadroom],
    [{ kind: "condition", code: "liquid_headroom", zone: "lower" }, volumeHeadroom],
  ];
  const absorbed = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, absorbed, definition);
  setTelemetry(room, "hydrogen_chloride_absorption", absorbed, dt, limitingFactor(candidates));
  recordReaction(state, absorbed);
};

const simulateNeutralization = (
  state: GameState,
  room: RoomState,
  dt: number,
  definition: GameDefinition
): void => {
  const reaction = definition.reactions.acid_neutralization;
  const behavior = reaction.behavior;
  if (behavior.kind !== "mixed_contact")
    throw new Error("Neutralization reaction is misconfigured");
  const inventory = roomReactionInventory(room, "lower");
  const mixing = clamp(liquidTotal(room) / behavior.mixingInventoryScale, 0, 1);
  const contactMultiplier = roomContactReactionMultiplier(room, definition);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, definition, "lower"),
    [
      { kind: "condition", code: "liquid_mixing", zone: "lower" },
      behavior.maximumRate * mixing * contactMultiplier * dt,
    ],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted, definition);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 180);
  setTelemetry(room, "acid_neutralization", reacted, dt, limitingFactor(candidates));
  recordReaction(state, reacted);
};

const simulateHypochloriteFormation = (
  state: GameState,
  room: RoomState,
  dt: number,
  definition: GameDefinition
): void => {
  const reaction = definition.reactions.hypochlorite_formation;
  const behavior = reaction.behavior;
  if (behavior.kind !== "mixed_contact") throw new Error("Hypochlorite reaction is misconfigured");
  const inventory = roomReactionInventory(room, "lower");
  const mixing = clamp(liquidTotal(room) / behavior.mixingInventoryScale, 0, 1);
  const contactMultiplier = roomContactReactionMultiplier(room, definition);
  const volumeHeadroom = roomLiquidHeadroom(room, definition);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, definition, "lower"),
    [
      { kind: "condition", code: "liquid_mixing", zone: "lower" },
      behavior.maximumRate * mixing * contactMultiplier * dt,
    ],
    [{ kind: "condition", code: "liquid_headroom", zone: "lower" }, volumeHeadroom],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted, definition);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 180);
  setTelemetry(room, "hypochlorite_formation", reacted, dt, limitingFactor(candidates));
  recordReaction(state, reacted);
};

const simulateAcidChlorineRelease = (
  state: GameState,
  room: RoomState,
  dt: number,
  definition: GameDefinition
): void => {
  const reaction = definition.reactions.acid_chlorine_release;
  const behavior = reaction.behavior;
  if (behavior.kind !== "mixed_contact")
    throw new Error("Chlorine release reaction is misconfigured");
  const inventory = roomReactionInventory(room, "lower");
  const mixing = clamp(liquidTotal(room) / behavior.mixingInventoryScale, 0, 1);
  const contactMultiplier = roomContactReactionMultiplier(room, definition);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, definition, "lower"),
    [
      { kind: "condition", code: "liquid_mixing", zone: "lower" },
      behavior.maximumRate * mixing * contactMultiplier * dt,
    ],
    [{ kind: "condition", code: "gas_headroom", zone: "lower" }, roomGasHeadroom(room, definition)],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted, definition);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 180);
  setTelemetry(room, "acid_chlorine_release", reacted, dt, limitingFactor(candidates));
  recordReaction(state, reacted);
  if (reacted > 0 && room.id === "washlock" && !hasEvent(state, "chlorine_evolution_started")) {
    addEvent(state, "reaction", "chlorine_evolution_started", {}, "washlock");
  }
};

const simulatePhaseChanges = (room: RoomState, dt: number, definition: GameDefinition): void => {
  if (room.temperature > 100 && room.liquid.water > 0.05) {
    const vaporized = Math.min(
      room.liquid.water,
      (room.temperature - 96) * 0.012 * dt,
      roomGasHeadroom(room, definition)
    );
    room.liquid.water -= vaporized;
    room.gas.lower.steam += vaporized;
    room.gasTemperature.lower = Math.max(room.gasTemperature.lower, room.temperature);
    room.temperature -= vaporized * 0.5;
  }
  if (room.temperature < 44 && roomLiquidHeadroom(room, definition) > 0) {
    for (const zone of GAS_ZONES) {
      const steam = room.gas[zone].steam;
      if (steam <= 0.05) continue;
      const condensed = Math.min(steam, steam * 0.014 * dt, roomLiquidHeadroom(room, definition));
      room.gas[zone].steam -= condensed;
      room.liquid.water += condensed;
    }
  }
};

const simulateRoomChemistry = (
  state: GameState,
  room: RoomState,
  dt: number,
  bursts: HazardBurst[],
  definition: GameDefinition
): void => {
  for (const reactionId of ROOM_REACTION_IDS) room.reactions[reactionId].lastRate = 0;
  room.pressurePulse = Math.max(0, room.pressurePulse - PRESSURE_PULSE_DECAY_PER_SECOND * dt);
  for (const zone of GAS_ZONES) {
    room.flashCooldown[zone] = Math.max(0, room.flashCooldown[zone] - dt);
    const flash = simulateHydrogenOxygenFlash(state, room, zone, dt, definition);
    if (flash) bursts.push(flash);
    simulateHydrogenChlorine(state, room, zone, dt, definition);
  }
  simulateHydrogenChlorideAbsorption(state, room, dt, definition);
  simulateNeutralization(state, room, dt, definition);
  simulateHypochloriteFormation(state, room, dt, definition);
  simulateAcidChlorineRelease(state, room, dt, definition);
  simulatePhaseChanges(room, dt, definition);
  const baseline = definition.rooms[room.id].ambientTemperature;
  room.temperature += (baseline - room.temperature) * 0.008 * dt;
  room.reactionIntensity = Math.max(0, room.reactionIntensity - dt * 1.3);
  state.stats.peakHazard = Math.max(state.stats.peakHazard, analyzeRoom(room, definition).hazard);
};

export const simulateReactions = (
  state: GameState,
  dt: number,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): HazardBurst[] => {
  const bursts: HazardBurst[] = [];
  simulateProcesses(state, dt, definition);
  for (const roomId of definition.roomOrder)
    simulateRoomChemistry(state, state.rooms[roomId], dt, bursts, definition);
  return bursts;
};
