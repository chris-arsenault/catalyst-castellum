import { HYDROGEN_FLASH_RULES } from "../content/chemistry";
import { ROOM_DEFINITIONS } from "../content/rooms";
import type { GameState, GasZone, RoomState } from "../types";
import { emptyHazardChannels, type HazardBurst } from "./damage";
import { roomGasReactionMultiplier } from "./equipment";
import { addEvent } from "./events";
import { clamp } from "./math";
import { gasPercent } from "./physics";

const ZONE_IGNITION_EXTENT = HYDROGEN_FLASH_RULES.ignitionExtent / 2;
const FLASH_PRESSURE_DAMAGE_BASE = 60;
const FLASH_PRESSURE_DAMAGE_PER_EXTENT = 8;
const FLASH_HEAT_DAMAGE_PER_EXTENT = 2;

const zoneName = (zone: GasZone): string => (zone === "lower" ? "lower layer" : "upper layer");

const limitingCondition = (
  hydrogenFraction: number,
  oxygenFraction: number,
  availableExtent: number,
  requiredExtent: number
): string => {
  if (hydrogenFraction < HYDROGEN_FLASH_RULES.minimumHydrogenFraction)
    return "H₂ ignition concentration";
  if (oxygenFraction < HYDROGEN_FLASH_RULES.minimumOxygenFraction)
    return "O₂ ignition concentration";
  if (availableExtent < requiredExtent) return "combustible batch / gas mixing";
  return "flash cooldown";
};

const setFlashTelemetry = (
  room: RoomState,
  amount: number,
  dt: number,
  limitingReactant: string
): void => {
  const telemetry = room.reactions.hydrogen_oxygen_combustion;
  if (amount > 0) {
    const rate = amount / Math.max(dt, 0.0001);
    telemetry.lastRate += rate;
    telemetry.limitingReactant = limitingReactant;
    room.reactionIntensity = Math.max(room.reactionIntensity, rate);
  } else if (telemetry.lastRate <= 0) {
    telemetry.limitingReactant = limitingReactant;
  }
};

const flashReady = (
  room: RoomState,
  zone: GasZone,
  availableExtent: number,
  hydrogenFraction: number,
  oxygenFraction: number,
  requiredExtent: number
): boolean =>
  room.flashCooldown[zone] <= 0 &&
  availableExtent >= requiredExtent &&
  hydrogenFraction >= HYDROGEN_FLASH_RULES.minimumHydrogenFraction &&
  oxygenFraction >= HYDROGEN_FLASH_RULES.minimumOxygenFraction;

const makeBurst = (
  room: RoomState,
  zone: GasZone,
  reacted: number,
  pressureImpulse: number,
  heatDelta: number
): HazardBurst => {
  const channels = emptyHazardChannels();
  channels.pressure = FLASH_PRESSURE_DAMAGE_BASE + reacted * FLASH_PRESSURE_DAMAGE_PER_EXTENT;
  channels.heat = reacted * FLASH_HEAT_DAMAGE_PER_EXTENT;
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
  dt: number
): HazardBurst | null => {
  const gas = room.gas[zone];
  const availableExtent = Math.min(gas.hydrogen / 2, gas.oxygen);
  const hydrogenFraction = gasPercent(room, "hydrogen", zone);
  const oxygenFraction = gasPercent(room, "oxygen", zone);
  const requiredExtent = ZONE_IGNITION_EXTENT / roomGasReactionMultiplier(room);
  if (!flashReady(room, zone, availableExtent, hydrogenFraction, oxygenFraction, requiredExtent)) {
    setFlashTelemetry(
      room,
      0,
      dt,
      `${zoneName(zone)}: ${limitingCondition(
        hydrogenFraction,
        oxygenFraction,
        availableExtent,
        requiredExtent
      )}`
    );
    return null;
  }

  const reacted = Math.min(availableExtent, HYDROGEN_FLASH_RULES.maximumExtent);
  const limitingReactant = gas.hydrogen / 2 <= gas.oxygen ? "H₂(g)" : "O₂(g)";
  const heatDelta = reacted * HYDROGEN_FLASH_RULES.heatPerExtent;
  const pressureImpulse =
    HYDROGEN_FLASH_RULES.pressurePulseBase + reacted * HYDROGEN_FLASH_RULES.pressurePulsePerExtent;
  gas.hydrogen -= reacted * 2;
  gas.oxygen -= reacted;
  gas.steam += reacted * 2;
  room.gasTemperature[zone] = clamp(room.gasTemperature[zone] + heatDelta, 0, 320);
  room.temperature = clamp(room.temperature + reacted * 1.8, 0, 260);
  room.pressurePulse = clamp(room.pressurePulse + pressureImpulse, 0, 240);
  room.flashCooldown[zone] = HYDROGEN_FLASH_RULES.cooldownSeconds;
  room.combustionCount += 1;
  state.stats.combustionFlashes += 1;
  state.stats.reactions += reacted;
  setFlashTelemetry(room, reacted, dt, `${zoneName(zone)}: ${limitingReactant}`);

  if (room.combustionCount === 1) {
    addEvent(
      state,
      "danger",
      `OX-1 flash cycle established in ${ROOM_DEFINITIONS[room.id].code}`,
      `Accumulated H₂ and O₂ autoignited in the ${zoneName(zone)} into a pressure shock, persistent heat, and steam. Continued feeds will recharge the next flash.`,
      room.id
    );
  }
  return makeBurst(room, zone, reacted, pressureImpulse, heatDelta);
};
