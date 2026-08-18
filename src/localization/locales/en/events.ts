export const EVENT_MESSAGES = {
  "events.common.facility": "facility",
  "events.zone.upper": "upper",
  "events.zone.lower": "lower",
  "events.damage.tower_bolt": "bolt caster",
  "events.damage.tower_repeater": "repeater",
  "events.damage.tower_projector": "line projector",
  "events.damage.tower_mortar": "mortar",
  "events.damage.tower_snare": "snare emitter",
  "events.damage.tower_flak": "flak nest",
  "events.damage.tower_relay": "relay",
  "events.damage.fallback": "defense tower",
  "events.round.contained.title": "Containment held",
  "events.round.breached.title": "{breaches} {breachLabel} recorded",
  "events.round.breach.one": "breach",
  "events.round.breach.other": "breaches",
  "events.round.contained.detail":
    "{killed} hostiles yielded {matterHarvested} matter. Every process inventory remains in place. The simulation is frozen at its exact ending state.",
  "events.round.breached.detail":
    "The core lost {coreDamage}% integrity. The exact process state is preserved for diagnosis. The simulation is frozen at its exact ending state.",
  "events.enemy.neutralized.title": "{enemy} neutralized — {source}",
  "events.enemy.neutralized.detail":
    "{damage} total damage; final {channel} contribution from {source}.{lifetime} {matterYield} matter recoverable.",
  "events.enemy.molted.title": "{enemy} carapace shed",
  "events.enemy.molted.detail": "Exposed form accelerates with {health} health remaining.",
  "events.enemy.lifetime": " Dominant lifetime source: {source}.",
  "events.flash.title": "OX-1 atmospheric reaction",
  "events.flash.detail":
    "{extent} mol-eq reacted, adding a {pressure} kPa transient impulse, {heat} °C, and steam to the room.",
  "events.scenario_started.title": "{kicker}: {level}",
  "events.planning.title": "{level} planning unlocked",
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
  "events.equipmentOperation.title": "{equipment} producing",
  "events.vesselMedium.title": "{equipment} charged with {medium}",
  "events.vesselMedium.detail": "Duty selected in {room}.",
  "events.equipmentOperation.detail":
    "{room} is converting available feedstock and routing each product through the installed cell.",
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
  "events.assault.title": "Approach opened — round {round}",
  "events.assault.detail":
    "Configuration is locked until every hostile is neutralized or breaches the core.",
  "events.round_advanced.title": "Round {round}: {title}",
  "events.round_advanced.detail": "{detail} New availability is now visible in the control room.",
  "events.round_advanced.fallback.title": "New round",
  "events.round_advanced.fallback.detail": "New conditions apply.",
  "events.travel_started.title": "Castellum underway",
  "events.travel_started.detail":
    "The walking castellum leaves the cleared site and makes for the next dock.",
  "events.defeat.title": "Catalyst core lost",
  "events.defeat.detail":
    "The core fell during {level}, round {round}. The original facility state is ready for another attempt.",
  "events.fallback.title": "System event",
  "events.fallback.detail": "Event code {code} is ready for presentation copy.",
} as const;
