import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../game/definition";
import type { DamageSourceId, GameEvent } from "../game/types";
import { DEFAULT_FORMATTERS, type LocaleFormatters } from "../localization/formatters";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";
import { enemyCopy, equipmentCopy, processCopy } from "./entityCopy";
import { createLevelCopy } from "./levelCopy";

export interface EventCopy {
  detail: string;
  title: string;
}

export interface EventCopyServices {
  definition: GameDefinition;
  formatters: LocaleFormatters;
  translator: Translator;
}

const DAMAGE_SOURCE_KEYS: Record<DamageSourceId, LocaleKey> = {
  atmospheric_exposure: "events.damage.atmospheric_exposure",
  surface_corrosion: "events.damage.surface_corrosion",
  thermal_exposure: "events.damage.thermal_exposure",
  catastrophic_overpressure: "events.damage.catastrophic_overpressure",
  radiation_field: "events.damage.radiation_field",
  hydrogen_oxygen_combustion: "events.damage.hydrogen_oxygen_combustion",
  legacy_unattributed: "events.damage.legacy_unattributed",
};

const sourceLabel = (sourceId: string, translator: Translator): string =>
  sourceId in DAMAGE_SOURCE_KEYS
    ? translator.text(DAMAGE_SOURCE_KEYS[sourceId as DamageSourceId])
    : translator.text("events.damage.fallback");

export const createEventCopy = ({ definition, formatters, translator }: EventCopyServices) => {
  const localizedLevel = createLevelCopy(translator);
  // This switch is an exhaustive presentation table over stable semantic event codes.
  // eslint-disable-next-line complexity
  return (event: GameEvent): EventCopy => {
    const roomCode = event.roomId ? definition.rooms[event.roomId].code : "facility";
    switch (event.code) {
      case "scenario_started": {
        const text = localizedLevel.level(definition.levels[event.levelId]);
        return {
          title: translator.text("events.scenario_started.title", {
            kicker: text.kicker,
            level: text.name,
          }),
          detail: text.briefing,
        };
      }
      case "level_planning_started": {
        const level = definition.levels[event.levelId];
        const levelText = localizedLevel.level(level);
        const round = level.rounds[event.round - 1];
        return {
          title: translator.text("events.planning.title", { level: levelText.name }),
          detail: round ? localizedLevel.round(level, round).objective : levelText.lesson,
        };
      }
      case "prime_started":
        return {
          title: translator.text("events.prime.title", { round: event.round }),
          detail: translator.text("events.prime.detail", {
            seconds: formatters.number(event.parameters.primeSeconds),
          }),
        };
      case "equipment_installed": {
        const equipment = equipmentCopy(
          definition.equipment[event.parameters.equipmentId],
          translator
        ).name;
        return {
          title: translator.text("events.equipment.installed.title", {
            equipment,
            room: roomCode,
          }),
          detail: translator.text("events.equipment.installed.detail", {
            cost: formatters.number(event.parameters.cost),
            equipment,
          }),
        };
      }
      case "equipment_upgraded": {
        const equipment = equipmentCopy(
          definition.equipment[event.parameters.equipmentId],
          translator
        ).name;
        return {
          title: translator.text("events.equipment.upgraded.title", {
            equipment,
            grade: event.parameters.level,
          }),
          detail: translator.text("events.equipment.upgraded.detail", { room: roomCode }),
        };
      }
      case "gas_source_charged": {
        const source = definition.gasSources[event.parameters.sourceId];
        return {
          title: translator.text("events.source.gas.title", { formula: source.formula }),
          detail: translator.text("events.source.gas.detail", {
            cost: formatters.number(event.parameters.cost),
            amount: formatters.number(event.parameters.amount, 0),
            formula: source.formula,
          }),
        };
      }
      case "liquid_source_charged": {
        const source = definition.liquidSources[event.parameters.sourceId];
        return {
          title: translator.text("events.source.liquid.title", { formula: source.formula }),
          detail: translator.text("events.source.liquid.detail", {
            cost: formatters.number(event.parameters.cost),
            amount: formatters.number(event.parameters.amount, 0),
            formula: source.formula,
          }),
        };
      }
      case "separator_cross_leak":
        return {
          title: translator.text("events.separator.title"),
          detail: translator.text("events.separator.detail"),
        };
      case "process_started": {
        const process = processCopy(
          definition.processes[event.parameters.processId],
          translator
        ).name;
        return {
          title: translator.text("events.process.title", { process }),
          detail: translator.text("events.process.detail", { room: roomCode }),
        };
      }
      case "hcl_production_started":
        return {
          title: translator.text("events.hcl.title"),
          detail: translator.text("events.hcl.detail"),
        };
      case "chlorine_evolution_started":
        return {
          title: translator.text("events.chlorine.title"),
          detail: translator.text("events.chlorine.detail"),
        };
      case "flash_cycle_started":
        return {
          title: translator.text("events.flash_cycle.title", { room: roomCode }),
          detail: translator.text("events.flash_cycle.detail", {
            zone: event.parameters.zone === "upper" ? "upper" : "lower",
          }),
        };
      case "enemy_neutralized": {
        const enemy = enemyCopy(definition.enemies[event.parameters.enemyType], translator).name;
        const source = sourceLabel(event.parameters.finalSource, translator);
        const lifetime = event.parameters.lifetimeSource
          ? translator.text("events.enemy.lifetime", {
              source: sourceLabel(event.parameters.lifetimeSource, translator),
            })
          : "";
        return {
          title: translator.text("events.enemy.neutralized.title", { enemy, source }),
          detail: translator.text("events.enemy.neutralized.detail", {
            damage: formatters.number(event.parameters.damageTaken),
            channel: event.parameters.finalChannel,
            source,
            lifetime,
            matterYield: formatters.number(event.parameters.matterYield),
          }),
        };
      }
      case "flash_incident": {
        const summary =
          event.parameters.hitCount === 0
            ? translator.text("events.flash.clear")
            : translator.text("events.flash.hits", {
                hits: event.parameters.hitCount,
                killed: event.parameters.killed,
                damage: formatters.number(event.parameters.damage),
              });
        return {
          title: translator.text("events.flash.title", {
            hits: event.parameters.hitCount,
            killed: event.parameters.killed,
          }),
          detail: translator.text("events.flash.detail", {
            pressure: formatters.number(event.parameters.pressureImpulse),
            extent: formatters.number(event.parameters.reactionExtent),
            summary,
          }),
        };
      }
      case "core_breached":
        return {
          title: translator.text("events.breach.title"),
          detail: translator.text("events.breach.detail", {
            enemy: enemyCopy(definition.enemies[event.parameters.enemyType], translator).name,
            damage: formatters.number(event.parameters.coreDamage),
          }),
        };
      case "round_completed": {
        const breached = event.parameters.breached;
        return breached === 0
          ? {
              title: translator.text("events.round.contained.title"),
              detail: translator.text("events.round.contained.detail", {
                killed: event.parameters.killed,
                matterHarvested: event.parameters.matterHarvested,
              }),
            }
          : {
              title: translator.text("events.round.breached.title", {
                breaches: breached,
                breachLabel: breached === 1 ? "breach" : "breaches",
              }),
              detail: translator.text("events.round.breached.detail", {
                coreDamage: event.parameters.coreDamage,
              }),
            };
      }
      case "campaign_completed":
        return {
          title: translator.text("events.campaign.title"),
          detail: translator.text("events.campaign.detail", {
            levels: event.parameters.completedLevels,
            integrity: event.parameters.coreIntegrity,
          }),
        };
      case "assault_started":
        return {
          title: translator.text(
            event.parameters.automatic
              ? "events.assault.automatic.title"
              : "events.assault.early.title",
            { round: event.round }
          ),
          detail: translator.text("events.assault.detail"),
        };
      case "round_advanced": {
        const level = definition.levels[event.levelId];
        const round = level.rounds[event.round - 1];
        const roundText = round
          ? localizedLevel.round(level, round)
          : { title: "New round", detail: "New conditions apply." };
        return {
          title: translator.text("events.round_advanced.title", {
            round: event.round,
            title: roundText.title,
          }),
          detail: translator.text("events.round_advanced.detail", { detail: roundText.detail }),
        };
      }
      case "scenario_defeated":
        return {
          title: translator.text("events.defeat.title"),
          detail: translator.text("events.defeat.detail", {
            level: localizedLevel.level(definition.levels[event.levelId]).name,
            round: event.round,
          }),
        };
      case "physical_conduit_migrated":
        return {
          title: translator.text("events.migration.title"),
          detail: translator.text("events.migration.detail"),
        };
      case "legacy_message":
        return { title: event.parameters.title, detail: event.parameters.detail };
      default: {
        const unmatched: never = event;
        return {
          title: translator.text("events.fallback.title"),
          detail: translator.text("events.fallback.detail", {
            code: String((unmatched as GameEvent).code),
          }),
        };
      }
    }
  };
};

export const eventCopy = createEventCopy({
  definition: DEFAULT_GAME_DEFINITION,
  formatters: DEFAULT_FORMATTERS,
  translator: DEFAULT_TRANSLATOR,
});
