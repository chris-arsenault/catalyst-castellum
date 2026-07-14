import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../game/definition";
import { installedEquipment } from "../game/engine/equipment";
import {
  gasPartialRatio,
  gasPercent,
  liquidMovementMultiplier,
  liquidStrength,
  pressureMovementMultiplier,
  roomHazards,
} from "../game/engine/physics";
import type { GasZone, RoomState } from "../game/types";

export type HazardLabel = "CLEAR" | "LOW" | "HOSTILE" | "LETHAL";

export const hazardLabel = (hazard: number): HazardLabel => {
  if (hazard >= 65) return "LETHAL";
  if (hazard >= 32) return "HOSTILE";
  if (hazard >= 10) return "LOW";
  return "CLEAR";
};

const flashExposureEffect = (
  room: RoomState,
  zone: GasZone,
  label: string,
  definition: GameDefinition
): string | null => {
  const behavior = definition.reactions.hydrogen_oxygen_combustion.behavior;
  if (behavior.kind !== "flash") throw new Error("Hydrogen flash reaction is misconfigured");
  if (
    gasPercent(room, "hydrogen", zone) < 0.005 ||
    gasPercent(room, "oxygen", zone) < behavior.minimumOxygenFraction
  )
    return null;
  const extent = Math.min(room.gas[zone].hydrogen / 2, room.gas[zone].oxygen);
  const charge = Math.min(1, extent / (behavior.ignitionExtent / 2));
  return `${label} H₂/O₂ flash charge ${Math.round(charge * 100)}%`;
};

const zoneEffects = (room: RoomState, zone: GasZone, definition: GameDefinition): string[] => {
  const effects: string[] = [];
  const label = zone === "lower" ? "Lower" : "Upper";
  const chlorine = gasPartialRatio(room, "chlorine", zone, definition);
  const hydrogenChloride = gasPartialRatio(room, "hydrogen_chloride", zone, definition);
  const hydrogen = gasPartialRatio(room, "hydrogen", zone, definition);
  const oxygen = gasPartialRatio(room, "oxygen", zone, definition);
  if (chlorine >= 0.006)
    effects.push(`${label} Cl₂ inhalation ${chlorine >= 0.04 ? "severe" : "active"}`);
  if (hydrogenChloride >= 0.009) effects.push(`${label} HCl respiratory corrosion`);
  if (chlorine >= 0.01 && hydrogen >= 0.01) effects.push(`${label} H₂ / Cl₂ mixture`);
  const flash = flashExposureEffect(room, zone, label, definition);
  if (flash) effects.push(flash);
  if (oxygen < 0.13) effects.push(`${label} oxygen partial pressure low`);
  if (room.gasTemperature[zone] >= 55)
    effects.push(`${label} heat exposure ${Math.round(room.gasTemperature[zone])}°C`);
  return effects;
};

export const roomEffects = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): string[] => {
  const effects = [
    ...zoneEffects(room, "lower", definition),
    ...zoneEffects(room, "upper", definition),
  ];
  if (liquidStrength(room, "sodium_hydroxide") >= 4) effects.push("NaOH floor contact corrosive");
  if (liquidStrength(room, "hydrochloric_acid") >= 4)
    effects.push("HCl(aq) floor contact corrosive");
  if (liquidStrength(room, "sodium_hypochlorite") >= 7) effects.push("NaOCl oxidizer pool active");
  const liquidMovement = liquidMovementMultiplier(room, false, definition);
  const pressureMovement = pressureMovementMultiplier(room, definition);
  if (liquidMovement < 0.99)
    effects.push(`Liquid depth slows ground movement ${Math.round((1 - liquidMovement) * 100)}%`);
  if (pressureMovement < 0.99)
    effects.push(`Overpressure slows all movement ${Math.round((1 - pressureMovement) * 100)}%`);
  const pressureHazard = roomHazards(room, true, true, "lower", definition).pressure;
  if (pressureHazard > 0.01)
    effects.push(`Catastrophic static pressure ${pressureHazard.toFixed(1)} pressure/s`);
  if (room.pressurePulse > 1)
    effects.push(
      `Transient pressure impulse affects transport +${Math.round(room.pressurePulse)} kPa`
    );
  return effects.length > 0 ? effects : ["Enemy exposure below damage thresholds"];
};

export const equipmentFunctionalSummary = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): string => {
  const equipment = installedEquipment(room);
  if (equipment.length === 0) return "Blank room · natural chemistry only";
  return equipment
    .map(
      (instance) =>
        `${definition.equipment[instance.equipmentId].name} ${instance.level}${instance.enabled ? "" : " · off"}`
    )
    .join(" · ");
};

export const roomRingDescription = (
  roomId: RoomState["id"],
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): string => {
  const room = definition.rooms[roomId];
  if (room.structure === "entry") return "Structural entry space · path and atmosphere monitoring";
  if (room.structure === "room") return "Two universal sockets · every equipment type fits";
  return "Protected utility and stock manifold";
};
