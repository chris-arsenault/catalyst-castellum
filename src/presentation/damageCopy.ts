import type { DamageSourceId, HazardChannels } from "../game/types";

export type DamageChannel = keyof HazardChannels;

export const DAMAGE_CHANNELS: readonly DamageChannel[] = [
  "atmosphere",
  "corrosion",
  "heat",
  "pressure",
  "radiation",
];

export const damageChannelStyle: Record<DamageChannel, { color: string; label: string }> = {
  atmosphere: { color: "#72d5e1", label: "AIR" },
  corrosion: { color: "#9df06c", label: "CORROSION" },
  heat: { color: "#ff755c", label: "THERMAL" },
  pressure: { color: "#ffb14d", label: "PRESSURE" },
  radiation: { color: "#d69cff", label: "RADIATION" },
};

export const damageChannelDetail: Record<DamageChannel, string> = {
  atmosphere: "The room atmosphere is outside this target’s breathable range.",
  corrosion: "Reactive liquid in contact with this target attacks its surface.",
  heat: "Hot chamber gas applies continuous thermal damage while the target remains exposed.",
  pressure: "A pressure load crushes the target throughout its body.",
  radiation: "The room’s radiation field applies continuous damage.",
};

export const damageSourceLabel: Record<DamageSourceId, string> = {
  atmospheric_exposure: "atmosphere",
  surface_corrosion: "surface contact",
  thermal_exposure: "hot gas exposure",
  catastrophic_overpressure: "static overpressure",
  radiation_field: "radiation field",
  hydrogen_oxygen_combustion: "OX-1 flash",
  legacy_unattributed: "environment",
};

export const damageSourceDetail: Record<DamageSourceId, string> = {
  atmospheric_exposure: "Room composition applies continuous atmospheric damage.",
  surface_corrosion: "Liquid contact applies continuous corrosion damage.",
  thermal_exposure: "Gas above the thermal threshold applies damage every simulation tick.",
  catastrophic_overpressure: "High static room pressure applies continuous pressure damage.",
  radiation_field: "An active radiation field applies continuous damage.",
  hydrogen_oxygen_combustion:
    "An OX-1 ignition applies one pressure-and-thermal impact to targets in the chamber.",
  legacy_unattributed: "The saved record contains damage from an earlier simulation version.",
};

export const damageSourceDisplay: Record<DamageSourceId, "continuous" | "impact"> = {
  atmospheric_exposure: "continuous",
  surface_corrosion: "continuous",
  thermal_exposure: "continuous",
  catastrophic_overpressure: "continuous",
  radiation_field: "continuous",
  hydrogen_oxygen_combustion: "impact",
  legacy_unattributed: "impact",
};

export const formatDamageAmount = (amount: number): string => {
  if (amount >= 10) return Math.round(amount).toString();
  if (amount >= 1) return amount.toFixed(1).replace(/\.0$/, "");
  const fixed = amount.toFixed(2);
  if (fixed.endsWith("00")) return fixed.slice(0, -3);
  if (fixed.endsWith("0")) return fixed.slice(0, -1);
  return fixed;
};

export const dominantDamageChannel = (channels: HazardChannels): DamageChannel =>
  DAMAGE_CHANNELS.reduce(
    (best, channel) => (channels[channel] > channels[best] ? channel : best),
    "atmosphere"
  );
