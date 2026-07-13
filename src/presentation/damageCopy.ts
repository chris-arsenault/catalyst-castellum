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
  heat: { color: "#ff755c", label: "HEAT" },
  pressure: { color: "#ffb14d", label: "PRESSURE" },
  radiation: { color: "#d69cff", label: "RADIATION" },
};

export const damageSourceLabel: Record<DamageSourceId, string> = {
  atmospheric_exposure: "atmosphere",
  surface_corrosion: "surface contact",
  thermal_exposure: "room temperature",
  catastrophic_overpressure: "pressure wave",
  radiation_field: "radiation field",
  hydrogen_oxygen_combustion: "OX-1 flash",
  legacy_unattributed: "environment",
};

export const dominantDamageChannel = (channels: HazardChannels): DamageChannel =>
  DAMAGE_CHANNELS.reduce(
    (best, channel) => (channels[channel] > channels[best] ? channel : best),
    "atmosphere"
  );
