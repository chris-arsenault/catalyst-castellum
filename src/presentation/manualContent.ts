import {
  ENEMY_TYPES,
  type EnemyType,
  type EquipmentId,
  type ReactionDefinition,
  type ReactionId,
} from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

export type EquipmentCategory = "atmosphere" | "contact" | "thermal" | "process";

export interface EquipmentManualEntry {
  category: EquipmentCategory;
  designation: string;
  flavor: string;
  operationalNotes: readonly string[];
  reactionIds: readonly ReactionId[];
}

export interface EnemyBestiaryEntry {
  classification: string;
  habitat: string;
  blurb: string;
  fieldNote: string;
}

const text = (
  translator: Translator,
  key: string,
  parameters: Record<string, string | number> = {}
): string => translator.text(key as LocaleKey, parameters as never);

const createReactionManual = (
  translator: Translator
): Record<ReactionId, { doctrine: string; flavor: string }> =>
  Object.fromEntries(
    [
      "chlor_alkali_electrolysis",
      "hydrogen_oxygen_combustion",
      "hydrogen_chlorine_recombination",
      "hydrogen_chloride_absorption",
      "acid_neutralization",
      "hypochlorite_formation",
      "acid_chlorine_release",
    ].map((reactionId) => [
      reactionId,
      {
        doctrine: text(translator, `manual.reactions.${reactionId}.doctrine`),
        flavor: text(translator, `manual.reactions.${reactionId}.flavor`),
      },
    ])
  ) as Record<ReactionId, { doctrine: string; flavor: string }>;

const createEnemyBestiary = (translator: Translator): Record<EnemyType, EnemyBestiaryEntry> =>
  Object.fromEntries(
    ENEMY_TYPES.map((enemyType) => [
      enemyType,
      {
        classification: text(translator, `manual.enemies.${enemyType}.classification`),
        habitat: text(translator, `manual.enemies.${enemyType}.habitat`),
        blurb: text(translator, `manual.enemies.${enemyType}.blurb`),
        fieldNote: text(translator, `manual.enemies.${enemyType}.fieldNote`),
      },
    ])
  ) as Record<EnemyType, EnemyBestiaryEntry>;

export const createManualContent = (translator: Translator) => {
  const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
    atmosphere: translator.text("manual.categories.atmosphere"),
    contact: translator.text("manual.categories.contact"),
    thermal: translator.text("manual.categories.thermal"),
    process: translator.text("manual.categories.process"),
  };
  const equipmentManual: Record<EquipmentId, EquipmentManualEntry> = {
    gas_agitator: {
      category: "atmosphere",
      designation: translator.text("manual.equipment.gas_agitator.designation"),
      flavor: translator.text("manual.equipment.gas_agitator.flavor"),
      operationalNotes: [1, 2, 3].map((index) =>
        text(translator, `manual.equipment.gas_agitator.note.${index}`)
      ),
      reactionIds: ["hydrogen_oxygen_combustion", "hydrogen_chlorine_recombination"],
    },
    wet_contactor: {
      category: "contact",
      designation: translator.text("manual.equipment.wet_contactor.designation"),
      flavor: translator.text("manual.equipment.wet_contactor.flavor"),
      operationalNotes: [1, 2, 3].map((index) =>
        text(translator, `manual.equipment.wet_contactor.note.${index}`)
      ),
      reactionIds: [
        "hydrogen_chloride_absorption",
        "acid_neutralization",
        "hypochlorite_formation",
        "acid_chlorine_release",
      ],
    },
    thermal_coil: {
      category: "thermal",
      designation: translator.text("manual.equipment.thermal_coil.designation"),
      flavor: translator.text("manual.equipment.thermal_coil.flavor"),
      operationalNotes: [1, 2, 3].map((index) =>
        text(translator, `manual.equipment.thermal_coil.note.${index}`)
      ),
      reactionIds: ["hydrogen_chlorine_recombination"],
    },
    membrane_cell: {
      category: "process",
      designation: translator.text("manual.equipment.membrane_cell.designation"),
      flavor: translator.text("manual.equipment.membrane_cell.flavor"),
      operationalNotes: [1, 2, 3].map((index) =>
        text(translator, `manual.equipment.membrane_cell.note.${index}`)
      ),
      reactionIds: ["chlor_alkali_electrolysis"],
    },
  };
  const reactionManual = createReactionManual(translator);
  const enemyBestiary = createEnemyBestiary(translator);
  return { equipmentCategoryLabels, equipmentManual, reactionManual, enemyBestiary };
};

const DEFAULT_MANUAL_CONTENT = createManualContent(DEFAULT_TRANSLATOR);
export const EQUIPMENT_CATEGORY_LABELS = DEFAULT_MANUAL_CONTENT.equipmentCategoryLabels;
export const EQUIPMENT_MANUAL = DEFAULT_MANUAL_CONTENT.equipmentManual;
export const REACTION_MANUAL = DEFAULT_MANUAL_CONTENT.reactionManual;
export const ENEMY_BESTIARY = DEFAULT_MANUAL_CONTENT.enemyBestiary;

export const equipmentForReaction = (reactionId: ReactionId): EquipmentId[] =>
  (Object.entries(EQUIPMENT_MANUAL) as [EquipmentId, EquipmentManualEntry][]).flatMap(
    ([equipmentId, entry]) => (entry.reactionIds.includes(reactionId) ? [equipmentId] : [])
  );

const concise = (value: number): string => String(Number(value.toFixed(2)));

export const createReactionMechanics =
  (translator: Translator) =>
  (reaction: ReactionDefinition): string[] => {
    const behavior = reaction.behavior;
    switch (behavior.kind) {
      case "electrolysis":
        return [
          translator.text("manual.mechanics.electrolysis.rate"),
          translator.text("manual.mechanics.electrolysis.heat", {
            heat: concise(behavior.roomHeatPerExtent),
          }),
          translator.text("manual.mechanics.electrolysis.limits"),
        ];
      case "flash":
        return [
          translator.text("manual.mechanics.flash.ignition", {
            hydrogen: concise(behavior.minimumHydrogenFraction * 100),
            oxygen: concise(behavior.minimumOxygenFraction * 100),
          }),
          translator.text("manual.mechanics.flash.extent", {
            extent: concise(behavior.maximumExtent),
            cooldown: concise(behavior.cooldownSeconds),
          }),
          translator.text("manual.mechanics.flash.pressure", {
            base: concise(behavior.pressurePulseBase),
            gain: concise(behavior.pressurePulsePerExtent),
          }),
        ];
      case "gas_recombination":
        return [
          translator.text("manual.mechanics.recombination.activation", {
            start: concise(behavior.activationTemperature),
            full: concise(behavior.activationTemperature + behavior.activationRange),
          }),
          translator.text("manual.mechanics.recombination.rate", {
            rate: concise(behavior.maximumRate),
          }),
          translator.text("manual.mechanics.recombination.heat", {
            heat: concise(behavior.gasHeatPerExtent),
          }),
        ];
      case "absorption":
        return [
          translator.text("manual.mechanics.absorption.rate", {
            rate: concise(behavior.maximumRate),
          }),
          translator.text("manual.mechanics.absorption.solvent", {
            amount: concise(behavior.solventInventoryScale),
          }),
          translator.text("manual.mechanics.absorption.ceiling", {
            percent: concise(behavior.maximumProductFraction * 100),
          }),
        ];
      case "mixed_contact":
        return [
          translator.text("manual.mechanics.contact.rate", {
            rate: concise(behavior.maximumRate),
          }),
          translator.text("manual.mechanics.contact.mixing", {
            amount: concise(behavior.mixingInventoryScale),
          }),
          translator.text("manual.mechanics.contact.heat", {
            heat: concise(behavior.roomHeatPerExtent),
          }),
        ];
    }
  };

export const reactionMechanics = createReactionMechanics(DEFAULT_TRANSLATOR);
