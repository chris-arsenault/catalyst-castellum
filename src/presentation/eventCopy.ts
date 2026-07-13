import {
  ENEMY_DEFINITIONS,
  EQUIPMENT_DEFINITIONS,
  GAS_SOURCES,
  LEVEL_DEFINITIONS,
  LIQUID_SOURCES,
  PROCESS_DEFINITIONS,
  ROOM_DEFINITIONS,
} from "../game/config";
import type {
  DamageSourceId,
  EnemyType,
  EquipmentId,
  GameEvent,
  GasSourceId,
  LiquidSourceId,
  ProcessId,
} from "../game/types";

export interface EventCopy {
  detail: string;
  title: string;
}

const DAMAGE_SOURCE_LABELS: Record<DamageSourceId, string> = {
  atmospheric_exposure: "atmospheric exposure",
  surface_corrosion: "surface corrosion",
  thermal_exposure: "thermal exposure",
  catastrophic_overpressure: "catastrophic overpressure",
  radiation_field: "radiation field",
  hydrogen_oxygen_combustion: "OX-1 flash",
  legacy_unattributed: "legacy unattributed damage",
};

const text = (event: GameEvent, key: string): string => {
  const value = event.parameters[key];
  return typeof value === "string" ? value : "";
};

const number = (event: GameEvent, key: string): number => {
  const value = event.parameters[key];
  return typeof value === "number" ? value : 0;
};

const boolean = (event: GameEvent, key: string): boolean => event.parameters[key] === true;

const sourceLabel = (id: string): string =>
  id in DAMAGE_SOURCE_LABELS
    ? DAMAGE_SOURCE_LABELS[id as DamageSourceId]
    : "environmental exposure";

const roundHeadline = (breaches: number): string => {
  if (breaches === 0) return "Containment held";
  return `${breaches} breach${breaches === 1 ? "" : "es"} recorded`;
};

const roundCompletedCopy = (event: GameEvent): EventCopy => {
  const breached = number(event, "breached");
  const detail =
    breached === 0
      ? `${number(event, "killed")} hostiles yielded ${number(event, "matterHarvested")} matter. Every process inventory remains in place.`
      : `The core lost ${number(event, "coreDamage")}% integrity. The exact process state is preserved for diagnosis.`;
  return {
    title: roundHeadline(breached),
    detail: `${detail} The simulation is frozen at its exact ending state.`,
  };
};

const enemyNeutralizedCopy = (event: GameEvent): EventCopy => {
  const enemy = ENEMY_DEFINITIONS[text(event, "enemyType") as EnemyType];
  const finalSource = sourceLabel(text(event, "finalSource"));
  const finalChannel = text(event, "finalChannel");
  const lifetimeSource = text(event, "lifetimeSource");
  const lifetime = lifetimeSource
    ? ` Dominant lifetime source: ${sourceLabel(lifetimeSource)}.`
    : "";
  const channel = finalChannel ? ` ${finalChannel}` : "";
  return {
    title: `${enemy?.name ?? "Hostile"} neutralized — ${finalSource}`,
    detail: `${number(event, "damageTaken")} total damage; final${channel} contribution from ${finalSource}.${lifetime} ${number(event, "matterYield")} matter recoverable.`,
  };
};

const flashIncidentCopy = (event: GameEvent): EventCopy => {
  const hits = number(event, "hitCount");
  const killed = number(event, "killed");
  const hitSummary =
    hits === 0
      ? "The chamber was clear at the instant of ignition."
      : `${hits} hit; ${killed} neutralized; ${number(event, "damage")} applied pressure/heat damage.`;
  return {
    title: `OX-1 flash — ${hits} hit, ${killed} neutralized`,
    detail: `${number(event, "pressureImpulse")} kPa impulse from ${number(event, "reactionExtent").toFixed(2)} mol-eq. ${hitSummary}`,
  };
};

// Event-code switches are exhaustive presentation tables, not branching domain policy.
// eslint-disable-next-line complexity
const configurationEventCopy = (event: GameEvent, roomCode: string): EventCopy | null => {
  switch (event.code) {
    case "scenario_started": {
      const level = LEVEL_DEFINITIONS[event.levelId];
      return { title: `${level.kicker}: ${level.name}`, detail: level.briefing };
    }
    case "level_planning_started": {
      const level = LEVEL_DEFINITIONS[event.levelId];
      const round = level.rounds[event.round - 1];
      return {
        title: `${level.name} planning unlocked`,
        detail: round?.objective ?? level.lesson,
      };
    }
    case "prime_started":
      return {
        title: `Round ${event.round} prime running`,
        detail: `The plant is live for up to ${number(event, "primeSeconds")} seconds. Materials and byproducts persist.`,
      };
    case "equipment_installed": {
      const definition = EQUIPMENT_DEFINITIONS[text(event, "equipmentId") as EquipmentId];
      return {
        title: `${definition?.name ?? "Equipment"} installed in ${roomCode}`,
        detail: `${number(event, "cost")} matter committed. ${definition?.name ?? "Equipment"} now changes room conditions and reaction kinetics.`,
      };
    }
    case "equipment_upgraded": {
      const definition = EQUIPMENT_DEFINITIONS[text(event, "equipmentId") as EquipmentId];
      return {
        title: `${definition?.name ?? "Equipment"} upgraded to Grade ${number(event, "level")}`,
        detail: `Rated hardware changed in ${roomCode}; live rates still depend on local conditions.`,
      };
    }
    case "gas_source_charged": {
      const source = GAS_SOURCES[text(event, "sourceId") as GasSourceId];
      return {
        title: `${source?.formula ?? "Gas"} reserve synthesized`,
        detail: `EXOTIC TRANSMUTATION converted ${number(event, "cost")} matter into ${number(event, "amount").toFixed(0)} mol-eq of ${source?.formula ?? "gas"}. Elemental conservation is waived.`,
      };
    }
    case "liquid_source_charged": {
      const source = LIQUID_SOURCES[text(event, "sourceId") as LiquidSourceId];
      return {
        title: `${source?.formula ?? "Liquid"} reserve synthesized`,
        detail: `EXOTIC TRANSMUTATION converted ${number(event, "cost")} matter into ${number(event, "amount").toFixed(0)} mol-eq of ${source?.formula ?? "liquid"}. Elemental conservation is waived.`,
      };
    }
    default:
      return null;
  }
};

const processEventCopy = (event: GameEvent, roomCode: string): EventCopy | null => {
  switch (event.code) {
    case "separator_cross_leak":
      return {
        title: "Electrolyzer separator cross-leak",
        detail:
          "Unequal outlet backpressure has contaminated an isolated product header. Balance or stop cell current before routing the mixture.",
      };
    case "process_started": {
      const process = PROCESS_DEFINITIONS[text(event, "processId") as ProcessId];
      return {
        title: `${process?.name ?? "Process"} producing`,
        detail: `${roomCode} is consuming NaCl and water into isolated Cl₂, H₂, and NaOH outlet inventories.`,
      };
    }
    case "hcl_production_started":
      return {
        title: "R-02 HCl production established",
        detail:
          "Heat and agitation are recombining balanced H₂ and Cl₂. Connected ducts draw from the resulting R-02 atmosphere.",
      };
    case "chlorine_evolution_started":
      return {
        title: "R-06 chlorine evolution established",
        detail:
          "Absorbed HCl has cleared residual NaOH and is now acidifying NaOCl into delayed Cl₂ gas.",
      };
    case "flash_cycle_started":
      return {
        title: `OX-1 flash cycle established in ${roomCode}`,
        detail: `Accumulated H₂ and O₂ autoignited in the ${text(event, "zone") === "upper" ? "upper layer" : "lower layer"} into a pressure shock, persistent heat, and steam. Continued feeds will recharge the next flash.`,
      };
    default:
      return null;
  }
};

const combatEventCopy = (event: GameEvent): EventCopy | null => {
  switch (event.code) {
    case "enemy_neutralized":
      return enemyNeutralizedCopy(event);
    case "flash_incident":
      return flashIncidentCopy(event);
    case "core_breached": {
      const enemy = ENEMY_DEFINITIONS[text(event, "enemyType") as EnemyType];
      return {
        title: "Core breach",
        detail: `${enemy?.name ?? "Hostile"} dealt ${number(event, "coreDamage")} persistent core damage.`,
      };
    }
    default:
      return null;
  }
};

// eslint-disable-next-line complexity
const campaignEventCopy = (event: GameEvent): EventCopy | null => {
  switch (event.code) {
    case "round_completed":
      return roundCompletedCopy(event);
    case "campaign_completed":
      return {
        title: "Castellum commissioned",
        detail: `All ${number(event, "completedLevels")} checkpoints survived with ${number(event, "coreIntegrity")}% core integrity in the final exam.`,
      };
    case "assault_started":
      return {
        title: `${boolean(event, "automatic") ? "Prime window elapsed" : "Early lock confirmed"} — round ${event.round}`,
        detail: "Configuration is locked until every hostile is neutralized or breaches the core.",
      };
    case "round_advanced": {
      const round = LEVEL_DEFINITIONS[event.levelId].rounds[event.round - 1];
      return {
        title: `Round ${event.round}: ${round?.title ?? "New round"}`,
        detail: `${round?.detail ?? "New conditions apply."} New availability is now visible in the control room.`,
      };
    }
    case "scenario_defeated":
      return {
        title: "Catalyst core lost",
        detail: `The core fell during ${LEVEL_DEFINITIONS[event.levelId].name}, round ${event.round}. The original facility state is ready for another attempt.`,
      };
    case "physical_conduit_migrated":
      return {
        title: "Physical conduit migration completed",
        detail:
          "The migration preserved every material, merged legacy sub-lines by room pair and phase, and set each migrated conduit to OFF for a fresh direction choice.",
      };
    case "legacy_message":
      return { title: text(event, "title"), detail: text(event, "detail") };
    default:
      return null;
  }
};

// Presentation copy is intentionally derived outside the engine from stable domain event codes.
export const eventCopy = (event: GameEvent): EventCopy => {
  const roomCode = event.roomId ? ROOM_DEFINITIONS[event.roomId].code : "facility";
  return (
    configurationEventCopy(event, roomCode) ??
    processEventCopy(event, roomCode) ??
    combatEventCopy(event) ??
    campaignEventCopy(event) ?? {
      title: "System event",
      detail: `Unrecognized event code: ${event.code as string}`,
    }
  );
};
