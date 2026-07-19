import type { GameDefinition } from "../definitionTypes";
import type {
  GameState,
  GasZone,
  LimitingFactor,
  ReactionBehaviorDefinition,
  RoomState,
} from "../types";
import { emptyHazardChannels, type HazardBurst } from "./damage";
import { roomEquipmentIsActive, roomGasReactionMultiplier } from "./equipment";
import { addEvent } from "./events";
import { clamp } from "./math";
import { gasPercent } from "./physics";
import { applyReactionExtent, type MutableReactionInventory } from "./reactionExecutor";

type FlashBehavior = Extract<ReactionBehaviorDefinition, { kind: "flash" }>;

export interface FlashIgnitionStatus {
  agitationReady: boolean;
  availableExtent: number;
  batchReady: boolean;
  cooldownReady: boolean;
  cooldownSeconds: number;
  hydrogenFraction: number;
  hydrogenReady: boolean;
  minimumHydrogenFraction: number;
  minimumOxygenFraction: number;
  oxygenFraction: number;
  oxygenReady: boolean;
  ready: boolean;
  requiredExtent: number;
  zone: GasZone;
}

export const hydrogenOxygenFlashStatus = (
  room: RoomState,
  zone: GasZone,
  definition: GameDefinition
): FlashIgnitionStatus => {
  const behavior = definition.reactions.hydrogen_oxygen_combustion.behavior;
  if (behavior.kind !== "flash") throw new Error("Hydrogen flash reaction is misconfigured");
  const gas = room.gas[zone];
  const availableExtent = Math.min(gas.hydrogen / 2, gas.oxygen);
  const hydrogenFraction = gasPercent(room, "hydrogen", zone);
  const oxygenFraction = gasPercent(room, "oxygen", zone);
  const agitationReady = roomEquipmentIsActive(room, "gas_agitator");
  // Stronger agitation reaches ignitable local pockets at lower bulk fractions, raising cadence.
  const agitationMultiplier = roomGasReactionMultiplier(room, definition);
  const floorScale = Math.max(agitationMultiplier, 1);
  const requiredExtent = behavior.ignitionExtent / 2 / agitationMultiplier;
  const minimumHydrogenFraction = behavior.minimumHydrogenFraction / floorScale;
  const minimumOxygenFraction = behavior.minimumOxygenFraction / floorScale;
  const hydrogenReady = hydrogenFraction >= minimumHydrogenFraction;
  const oxygenReady = oxygenFraction >= minimumOxygenFraction;
  const batchReady = availableExtent >= requiredExtent;
  const cooldownReady = room.flashCooldown[zone] <= 0;
  return {
    agitationReady,
    availableExtent,
    batchReady,
    cooldownReady,
    cooldownSeconds: room.flashCooldown[zone],
    hydrogenFraction,
    hydrogenReady,
    minimumHydrogenFraction,
    minimumOxygenFraction,
    oxygenFraction,
    oxygenReady,
    ready: agitationReady && hydrogenReady && oxygenReady && batchReady && cooldownReady,
    requiredExtent,
    zone,
  };
};

const limitingCondition = (status: FlashIgnitionStatus): LimitingFactor => {
  if (!status.agitationReady)
    return { kind: "condition", code: "gas_agitation", zone: status.zone };
  if (!status.hydrogenReady)
    return { kind: "condition", code: "ignition_hydrogen", zone: status.zone };
  if (!status.oxygenReady) return { kind: "condition", code: "ignition_oxygen", zone: status.zone };
  if (!status.batchReady)
    return { kind: "condition", code: "combustible_batch", zone: status.zone };
  return { kind: "condition", code: "cooldown", zone: status.zone };
};

const setFlashTelemetry = (
  room: RoomState,
  amount: number,
  dt: number,
  limitingFactor: LimitingFactor
): void => {
  const telemetry = room.reactions.hydrogen_oxygen_combustion;
  if (amount > 0) {
    const rate = amount / Math.max(dt, 0.0001);
    telemetry.lastRate += rate;
    telemetry.direction = "forward";
    telemetry.limitingFactor = limitingFactor;
    room.reactionIntensity = Math.max(room.reactionIntensity, rate);
  } else if (telemetry.lastRate <= 0) {
    telemetry.limitingFactor = limitingFactor;
  }
};

const makeBurst = (
  room: RoomState,
  zone: GasZone,
  reacted: number,
  pressureImpulse: number,
  heatDelta: number,
  behavior: FlashBehavior
): HazardBurst => {
  const channels = emptyHazardChannels();
  channels.pressure = behavior.pressureDamageBase + reacted * behavior.pressureDamagePerExtent;
  channels.heat = reacted * behavior.heatDamagePerExtent;
  return {
    roomId: room.id,
    zone,
    sourceId: "hydrogen_oxygen_combustion",
    reactionExtent: reacted,
    pressureImpulse,
    heatDelta,
    channels,
  };
};

export const simulateHydrogenOxygenFlash = (
  state: GameState,
  room: RoomState,
  zone: GasZone,
  dt: number,
  definition: GameDefinition
): HazardBurst | null => {
  const reaction = definition.reactions.hydrogen_oxygen_combustion;
  const behavior = reaction.behavior;
  if (behavior.kind !== "flash") throw new Error("Hydrogen flash reaction is misconfigured");
  const gas = room.gas[zone];
  const status = hydrogenOxygenFlashStatus(room, zone, definition);
  if (!status.ready) {
    setFlashTelemetry(room, 0, dt, limitingCondition(status));
    return null;
  }

  const reacted = Math.min(status.availableExtent, behavior.maximumExtent);
  const limitingFactor: LimitingFactor = {
    kind: "species",
    speciesId: gas.hydrogen / 2 <= gas.oxygen ? "hydrogen" : "oxygen",
    zone,
  };
  const heatDelta = reacted * behavior.gasHeatPerExtent;
  const pressureImpulse = behavior.pressurePulseBase + reacted * behavior.pressurePulsePerExtent;
  const inventory: MutableReactionInventory = {
    amount: (speciesId) => gas[speciesId as keyof typeof gas],
    change: (speciesId, delta) => {
      gas[speciesId as keyof typeof gas] += delta;
    },
  };
  applyReactionExtent(reaction, inventory, reacted);
  room.gasTemperature[zone] = clamp(room.gasTemperature[zone] + heatDelta, 0, 320);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 260);
  room.pressurePulse = clamp(room.pressurePulse + pressureImpulse, 0, 240);
  // The whole chamber re-mixes after a detonation: one flash cycle per room, not per layer.
  room.flashCooldown.lower = behavior.cooldownSeconds;
  room.flashCooldown.upper = behavior.cooldownSeconds;
  room.combustionCount += 1;
  state.stats.combustionFlashes += 1;
  state.stats.reactions += reacted;
  setFlashTelemetry(room, reacted, dt, limitingFactor);

  if (room.combustionCount === 1) {
    addEvent(state, "danger", "flash_cycle_started", { zone }, room.id);
  }
  return makeBurst(room, zone, reacted, pressureImpulse, heatDelta, behavior);
};
