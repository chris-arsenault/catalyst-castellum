import type { GameDefinition } from "../definitionTypes";
import {
  GAS_ZONES,
  type GameState,
  type GasZone,
  type LimitingFactor,
  type ReactionBehaviorDefinition,
  type ReactionDefinition,
  type RoomReactionId,
  type RoomState,
} from "../types";
import type { HazardBurst } from "./damage";
import { roomContactReactionMultiplier, roomGasReactionMultiplier } from "./equipment";
import { addEvent } from "./events";
import { simulateHydrogenOxygenFlash } from "./flashReaction";
import { clamp } from "./math";
import { simulateEquipmentOperations } from "./equipmentOperations";
import {
  applyReactionExtent,
  reactionReactantCandidates,
  type MutableReactionInventory,
} from "./reactionExecutor";
import { analyzeRoom, liquidTotal, roomGasHeadroom, roomLiquidHeadroom } from "./roomState";
import { roomState } from "../world/instances";
import { definitionRoom } from "../world/instances";
import { simulateMassActionNetwork } from "./massActionReactions";

const PRESSURE_PULSE_DECAY_PER_SECOND = 160;
const rate = (amount: number, dt: number): number => amount / Math.max(dt, 0.0001);

const setTelemetry = (
  room: RoomState,
  reactionId: ReactionDefinition["id"],
  amount: number,
  dt: number,
  limitingFactor: LimitingFactor
): void => {
  const telemetry = room.reactions[reactionId as RoomReactionId];
  if (!telemetry) throw new Error(`Room telemetry is missing reaction ${reactionId}`);
  if (amount > 0) {
    telemetry.lastRate += rate(amount, dt);
    telemetry.direction = "forward";
    telemetry.limitingFactor = limitingFactor;
    room.reactionIntensity = Math.max(room.reactionIntensity, rate(amount, dt));
  } else if (telemetry.lastRate <= 0) {
    telemetry.limitingFactor = limitingFactor;
  }
};

const limitingFactor = (candidates: Array<[LimitingFactor, number]>): LimitingFactor =>
  candidates.reduce((minimum, candidate) => (candidate[1] < minimum[1] ? candidate : minimum))[0];

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

const maybeRecordEvent = (
  state: GameState,
  room: RoomState,
  amount: number,
  event: { code: GameState["events"][number]["code"]; roomId: RoomState["id"] } | undefined
): void => {
  if (
    amount > 0 &&
    event &&
    room.id === event.roomId &&
    !state.events.some(({ code }) => code === event.code)
  ) {
    addEvent(state, "reaction", event.code, {}, event.roomId);
  }
};

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
  definition: GameDefinition
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

interface StrategyContext {
  state: GameState;
  room: RoomState;
  reaction: ReactionDefinition;
  dt: number;
  bursts: HazardBurst[];
  definition: GameDefinition;
}

type RoomReactionStrategy = (context: StrategyContext) => void;

const simulateGasRecombination: RoomReactionStrategy = ({
  state,
  room,
  reaction,
  dt,
  definition,
}) => {
  const behavior = reaction.behavior;
  if (behavior.kind !== "gas_recombination") return;
  for (const zone of GAS_ZONES) {
    const inventory = roomReactionInventory(room, zone);
    const activation = clamp(
      (room.gasTemperature[zone] - behavior.activationTemperature) / behavior.activationRange,
      0,
      1
    );
    const candidates: Array<[LimitingFactor, number]> = [
      ...reactionReactantCandidates(reaction, inventory, zone),
      [
        { kind: "condition", code: "activation_temperature", zone },
        behavior.maximumRate * activation * roomGasReactionMultiplier(room, definition) * dt,
      ],
    ];
    const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
    applyReactionExtent(reaction, inventory, reacted);
    room.gasTemperature[zone] = clamp(
      room.gasTemperature[zone] + reacted * behavior.gasHeatPerExtent,
      0,
      260
    );
    room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 220);
    setTelemetry(room, reaction.id, reacted, dt, limitingFactor(candidates));
    state.stats.reactions += reacted;
    maybeRecordEvent(state, room, reacted, behavior.event);
  }
};

const simulateAbsorption: RoomReactionStrategy = ({ state, room, reaction, dt, definition }) => {
  const behavior = reaction.behavior;
  if (behavior.kind !== "absorption") return;
  const zone = "lower";
  const inventory = roomReactionInventory(room, zone);
  const aqueousInventory = liquidTotal(room);
  const solventFactor = clamp(aqueousInventory / behavior.solventInventoryScale, 0, 1);
  const product = reaction.products[0]?.species;
  const productAmount =
    product && product in room.liquid ? room.liquid[product as keyof typeof room.liquid] : 0;
  const productFraction = productAmount / Math.max(aqueousInventory, 0.1);
  const concentrationHeadroom =
    Math.max(0, behavior.maximumProductFraction - productFraction) * Math.max(aqueousInventory, 1);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, zone),
    [
      { kind: "condition", code: "aqueous_solvent", zone },
      behavior.maximumRate * solventFactor * roomContactReactionMultiplier(room, definition) * dt,
    ],
    [{ kind: "condition", code: "product_concentration", zone }, concentrationHeadroom],
    [{ kind: "condition", code: "liquid_headroom", zone }, roomLiquidHeadroom(room, definition)],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted);
  setTelemetry(room, reaction.id, reacted, dt, limitingFactor(candidates));
  state.stats.reactions += reacted;
};

const simulateMixedContact: RoomReactionStrategy = ({ state, room, reaction, dt, definition }) => {
  const behavior = reaction.behavior;
  if (behavior.kind !== "mixed_contact") return;
  const zone = "lower";
  const inventory = roomReactionInventory(room, zone);
  const mixing = clamp(liquidTotal(room) / behavior.mixingInventoryScale, 0, 1);
  const candidates: Array<[LimitingFactor, number]> = [
    ...reactionReactantCandidates(reaction, inventory, zone),
    [
      { kind: "condition", code: "liquid_mixing", zone },
      behavior.maximumRate * mixing * roomContactReactionMultiplier(room, definition) * dt,
    ],
  ];
  if (behavior.headroom === "liquid") {
    candidates.push([
      { kind: "condition", code: "liquid_headroom", zone },
      roomLiquidHeadroom(room, definition),
    ]);
  }
  if (behavior.headroom === "gas") {
    candidates.push([
      { kind: "condition", code: "gas_headroom", zone },
      roomGasHeadroom(room, definition),
    ]);
  }
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  applyReactionExtent(reaction, inventory, reacted);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 180);
  setTelemetry(room, reaction.id, reacted, dt, limitingFactor(candidates));
  state.stats.reactions += reacted;
  maybeRecordEvent(state, room, reacted, behavior.event);
};

const simulateFlash: RoomReactionStrategy = ({ state, room, reaction, dt, bursts, definition }) => {
  if (reaction.id !== "hydrogen_oxygen_combustion")
    throw new Error(`Flash strategy ${reaction.id} requires a named engine implementation.`);
  for (const zone of GAS_ZONES) {
    room.flashCooldown[zone] = Math.max(0, room.flashCooldown[zone] - dt);
    const flash = simulateHydrogenOxygenFlash(state, room, zone, dt, definition);
    if (flash) bursts.push(flash);
  }
};

type RoomBehaviorKind = Exclude<ReactionBehaviorDefinition["kind"], "electrolysis" | "mass_action">;

export const ROOM_REACTION_STRATEGIES: Readonly<Record<RoomBehaviorKind, RoomReactionStrategy>> =
  Object.freeze({
    flash: simulateFlash,
    gas_recombination: simulateGasRecombination,
    absorption: simulateAbsorption,
    mixed_contact: simulateMixedContact,
  });

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
  room.pressurePulse = Math.max(0, room.pressurePulse - PRESSURE_PULSE_DECAY_PER_SECOND * dt);
  for (const reaction of Object.values(definition.reactions)) {
    if (reaction.behavior.kind === "electrolysis" || reaction.behavior.kind === "mass_action")
      continue;
    if (reaction.regime === "engineered") continue;
    ROOM_REACTION_STRATEGIES[reaction.behavior.kind]({
      state,
      room,
      reaction,
      dt,
      bursts,
      definition,
    });
  }
  state.stats.reactions += simulateMassActionNetwork(room, dt, definition);
  simulatePhaseChanges(room, dt, definition);
  const baseline = definitionRoom(state, room.id).ambientTemperature;
  room.temperature += (baseline - room.temperature) * 0.03 * dt;
  room.reactionIntensity = Math.max(0, room.reactionIntensity - dt * 1.3);
  state.stats.peakHazard = Math.max(state.stats.peakHazard, analyzeRoom(room, definition).hazard);
};

export const simulateReactions = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): HazardBurst[] => {
  const bursts: HazardBurst[] = [];
  for (const roomId of state.world.rooms) {
    for (const telemetry of Object.values(roomState(state, roomId).reactions)) {
      telemetry.lastRate = 0;
      telemetry.direction = "idle";
    }
  }
  simulateEquipmentOperations(state, dt, definition);
  for (const roomId of state.world.rooms)
    simulateRoomChemistry(state, roomState(state, roomId), dt, bursts, definition);
  return bursts;
};
