import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import type {
  GameState,
  GasZone,
  LimitingFactor,
  ReactionBehaviorDefinition,
  RoomState,
} from "../types";
import { emptyHazardChannels, type HazardBurst } from "./damage";
import { roomGasReactionMultiplier } from "./equipment";
import { addEvent } from "./events";
import { clamp } from "./math";
import { gasPercent } from "./physics";
import { applyReactionExtent, type MutableReactionInventory } from "./reactionExecutor";

type FlashBehavior = Extract<ReactionBehaviorDefinition, { kind: "flash" }>;

const limitingCondition = (
  zone: GasZone,
  hydrogenFraction: number,
  oxygenFraction: number,
  availableExtent: number,
  requiredExtent: number,
  behavior: FlashBehavior
): LimitingFactor => {
  if (hydrogenFraction < behavior.minimumHydrogenFraction)
    return { kind: "condition", code: "ignition_hydrogen", zone };
  if (oxygenFraction < behavior.minimumOxygenFraction)
    return { kind: "condition", code: "ignition_oxygen", zone };
  if (availableExtent < requiredExtent)
    return { kind: "condition", code: "combustible_batch", zone };
  return { kind: "condition", code: "cooldown", zone };
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
    telemetry.limitingFactor = limitingFactor;
    room.reactionIntensity = Math.max(room.reactionIntensity, rate);
  } else if (telemetry.lastRate <= 0) {
    telemetry.limitingFactor = limitingFactor;
  }
};

const flashReady = (
  room: RoomState,
  zone: GasZone,
  availableExtent: number,
  hydrogenFraction: number,
  oxygenFraction: number,
  requiredExtent: number,
  behavior: FlashBehavior
): boolean =>
  room.flashCooldown[zone] <= 0 &&
  availableExtent >= requiredExtent &&
  hydrogenFraction >= behavior.minimumHydrogenFraction &&
  oxygenFraction >= behavior.minimumOxygenFraction;

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
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): HazardBurst | null => {
  const reaction = definition.reactions.hydrogen_oxygen_combustion;
  const behavior = reaction.behavior;
  if (behavior.kind !== "flash") throw new Error("Hydrogen flash reaction is misconfigured");
  const gas = room.gas[zone];
  const availableExtent = Math.min(gas.hydrogen / 2, gas.oxygen);
  const hydrogenFraction = gasPercent(room, "hydrogen", zone);
  const oxygenFraction = gasPercent(room, "oxygen", zone);
  const requiredExtent = behavior.ignitionExtent / 2 / roomGasReactionMultiplier(room, definition);
  if (
    !flashReady(
      room,
      zone,
      availableExtent,
      hydrogenFraction,
      oxygenFraction,
      requiredExtent,
      behavior
    )
  ) {
    setFlashTelemetry(
      room,
      0,
      dt,
      limitingCondition(
        zone,
        hydrogenFraction,
        oxygenFraction,
        availableExtent,
        requiredExtent,
        behavior
      )
    );
    return null;
  }

  const reacted = Math.min(availableExtent, behavior.maximumExtent);
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
  applyReactionExtent(reaction, inventory, reacted, definition);
  room.gasTemperature[zone] = clamp(room.gasTemperature[zone] + heatDelta, 0, 320);
  room.temperature = clamp(room.temperature + reacted * behavior.roomHeatPerExtent, 0, 260);
  room.pressurePulse = clamp(room.pressurePulse + pressureImpulse, 0, 240);
  room.flashCooldown[zone] = behavior.cooldownSeconds;
  room.combustionCount += 1;
  state.stats.combustionFlashes += 1;
  state.stats.reactions += reacted;
  setFlashTelemetry(room, reacted, dt, limitingFactor);

  if (room.combustionCount === 1) {
    addEvent(state, "danger", "flash_cycle_started", { zone }, room.id);
  }
  return makeBurst(room, zone, reacted, pressureImpulse, heatDelta, behavior);
};
