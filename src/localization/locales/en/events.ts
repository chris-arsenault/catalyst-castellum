export const EVENT_MESSAGES = {
  "events.damage.atmospheric_exposure": "atmospheric exposure",
  "events.damage.surface_corrosion": "surface corrosion",
  "events.damage.thermal_exposure": "thermal exposure",
  "events.damage.catastrophic_overpressure": "catastrophic overpressure",
  "events.damage.radiation_field": "radiation field",
  "events.damage.hydrogen_oxygen_combustion": "OX-1 flash",
  "events.damage.legacy_unattributed": "legacy unattributed damage",
  "events.damage.fallback": "environmental exposure",
  "events.round.contained.title": "Containment held",
  "events.round.breached.title": "{breaches} {breachLabel} recorded",
  "events.round.contained.detail":
    "{killed} hostiles yielded {matterHarvested} matter. Every process inventory remains in place. The simulation is frozen at its exact ending state.",
  "events.round.breached.detail":
    "The core lost {coreDamage}% integrity. The exact process state is preserved for diagnosis. The simulation is frozen at its exact ending state.",
  "events.enemy.neutralized.title": "{enemy} neutralized — {source}",
  "events.enemy.neutralized.detail":
    "{damage} total damage; final {channel} contribution from {source}.{lifetime} {matterYield} matter recoverable.",
  "events.enemy.lifetime": " Dominant lifetime source: {source}.",
  "events.flash.clear": "The chamber was clear at the instant of ignition.",
  "events.flash.hits": "{hits} hit; {killed} neutralized; {damage} applied pressure/heat damage.",
  "events.flash.title": "OX-1 flash — {hits} hit, {killed} neutralized",
  "events.flash.detail": "{pressure} kPa impulse from {extent} mol-eq. {summary}",
  "events.scenario_started.title": "{kicker}: {level}",
  "events.planning.title": "{level} planning unlocked",
  "events.prime.title": "Round {round} prime running",
  "events.prime.detail":
    "The plant is live for up to {seconds} seconds. Materials and byproducts persist.",
  "events.equipment.installed.title": "{equipment} installed in {room}",
  "events.equipment.installed.detail":
    "{cost} matter committed. {equipment} now changes room conditions and reaction kinetics.",
  "events.equipment.upgraded.title": "{equipment} upgraded to Grade {grade}",
  "events.equipment.upgraded.detail":
    "Rated hardware changed in {room}; live rates depend on local conditions.",
  "events.source.gas.title": "{formula} reserve synthesized",
  "events.source.gas.detail":
    "EXOTIC TRANSMUTATION converted {cost} matter into {amount} mol-eq of {formula}. Elemental conservation is waived.",
  "events.source.liquid.title": "{formula} reserve synthesized",
  "events.source.liquid.detail":
    "EXOTIC TRANSMUTATION converted {cost} matter into {amount} mol-eq of {formula}. Elemental conservation is waived.",
  "events.separator.title": "Electrolyzer separator cross-leak",
  "events.separator.detail":
    "Unequal outlet backpressure has contaminated an isolated product header. Balance or stop cell current before routing the mixture.",
  "events.process.title": "{process} producing",
  "events.process.detail":
    "{room} is consuming NaCl and water into isolated Cl₂, H₂, and NaOH outlet inventories.",
  "events.hcl.title": "R-02 HCl production established",
  "events.hcl.detail":
    "Heat and agitation are recombining balanced H₂ and Cl₂. Connected ducts draw from the resulting R-02 atmosphere.",
  "events.chlorine.title": "R-06 chlorine evolution established",
  "events.chlorine.detail":
    "Absorbed HCl has cleared residual NaOH and is now acidifying NaOCl into delayed Cl₂ gas.",
  "events.flash_cycle.title": "OX-1 flash cycle established in {room}",
  "events.flash_cycle.detail":
    "Accumulated H₂ and O₂ autoignited in the {zone} layer into a pressure shock, persistent heat, and steam. Continued feeds recharge the next flash.",
  "events.breach.title": "Core breach",
  "events.breach.detail": "{enemy} dealt {damage} persistent core damage.",
  "events.campaign.title": "Castellum commissioned",
  "events.campaign.detail":
    "All {levels} checkpoints survived with {integrity}% core integrity in the final exam.",
  "events.assault.automatic.title": "Prime window elapsed — round {round}",
  "events.assault.early.title": "Early lock confirmed — round {round}",
  "events.assault.detail":
    "Configuration is locked until every hostile is neutralized or breaches the core.",
  "events.round_advanced.title": "Round {round}: {title}",
  "events.round_advanced.detail": "{detail} New availability is now visible in the control room.",
  "events.defeat.title": "Catalyst core lost",
  "events.defeat.detail":
    "The core fell during {level}, round {round}. The original facility state is ready for another attempt.",
  "events.migration.title": "Physical conduit migration completed",
  "events.migration.detail":
    "The migration preserved every material, merged legacy sub-lines by room pair and phase, and set each migrated conduit to OFF for a fresh direction choice.",
  "events.fallback.title": "System event",
  "events.fallback.detail": "Event code {code} is ready for presentation copy.",
} as const;
