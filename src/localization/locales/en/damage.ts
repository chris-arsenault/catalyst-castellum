export const DAMAGE_MESSAGES = {
  "damage.channel.atmosphere.label": "AIR",
  "damage.channel.atmosphere.detail":
    "The room atmosphere is outside this target’s breathable range.",
  "damage.channel.corrosion.label": "CORROSION",
  "damage.channel.corrosion.detail":
    "Reactive liquid in contact with this target attacks its surface.",
  "damage.channel.heat.label": "THERMAL",
  "damage.channel.heat.detail":
    "Hot chamber gas applies continuous thermal damage while the target remains exposed.",
  "damage.channel.pressure.label": "PRESSURE",
  "damage.channel.pressure.detail": "A pressure load crushes the target throughout its body.",
  "damage.channel.radiation.label": "RADIATION",
  "damage.channel.radiation.detail": "The room’s radiation field applies continuous damage.",
  "damage.source.atmospheric_exposure.label": "atmosphere",
  "damage.source.atmospheric_exposure.detail":
    "Room composition applies continuous atmospheric damage.",
  "damage.source.surface_corrosion.label": "surface contact",
  "damage.source.surface_corrosion.detail": "Liquid contact applies continuous corrosion damage.",
  "damage.source.thermal_exposure.label": "hot gas exposure",
  "damage.source.thermal_exposure.detail":
    "Gas above the thermal threshold applies damage every simulation tick.",
  "damage.source.catastrophic_overpressure.label": "static overpressure",
  "damage.source.catastrophic_overpressure.detail":
    "High static room pressure applies continuous pressure damage.",
  "damage.source.radiation_field.label": "radiation field",
  "damage.source.radiation_field.detail": "An active radiation field applies continuous damage.",
  "damage.source.hydrogen_oxygen_combustion.label": "OX-1 flash",
  "damage.source.hydrogen_oxygen_combustion.detail":
    "An OX-1 ignition applies one pressure-and-thermal impact to targets in the chamber.",
} as const;
