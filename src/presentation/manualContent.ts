import {
  ENEMY_TYPES,
  REACTION_IDS,
  type EnemyType,
  type EquipmentId,
  type ReactionId,
} from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";
import { REACTION_DEFINITIONS } from "./defaultGame";
import { createReactionMechanics } from "./reactionMechanics";

export { createReactionMechanics } from "./reactionMechanics";

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
    REACTION_IDS.map((reactionId) => [
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

const kineticReactionGroups = () => {
  const massAction = REACTION_IDS.filter(
    (reactionId) => REACTION_DEFINITIONS[reactionId].behavior.kind === "mass_action"
  );
  const gas = massAction.filter((reactionId) => {
    const behavior = REACTION_DEFINITIONS[reactionId].behavior;
    return behavior.kind === "mass_action" && behavior.contact === "gas";
  });
  const liquid = massAction.filter((reactionId) => {
    const behavior = REACTION_DEFINITIONS[reactionId].behavior;
    return behavior.kind === "mass_action" && behavior.contact === "liquid";
  });
  const heated = massAction.filter((reactionId) => {
    const behavior = REACTION_DEFINITIONS[reactionId].behavior;
    return behavior.kind === "mass_action" && behavior.forward.activationTemperature > 22;
  });
  return { gas, heated, liquid };
};

export const createManualContent = (translator: Translator) => {
  const {
    gas: gasKineticReactionIds,
    heated: heatedKineticReactionIds,
    liquid: liquidKineticReactionIds,
  } = kineticReactionGroups();
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
      reactionIds: [
        "hydrogen_oxygen_combustion",
        "hydrogen_chlorine_recombination",
        ...gasKineticReactionIds,
      ],
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
        ...liquidKineticReactionIds,
      ],
    },
    thermal_coil: {
      category: "thermal",
      designation: translator.text("manual.equipment.thermal_coil.designation"),
      flavor: translator.text("manual.equipment.thermal_coil.flavor"),
      operationalNotes: [1, 2, 3].map((index) =>
        text(translator, `manual.equipment.thermal_coil.note.${index}`)
      ),
      reactionIds: ["hydrogen_chlorine_recombination", ...heatedKineticReactionIds],
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
    fluorine_cell: {
      category: "process",
      designation: translator.text("manual.equipment.fluorine_cell.designation"),
      flavor: translator.text("manual.equipment.fluorine_cell.flavor"),
      operationalNotes: [1, 2, 3].map((index) =>
        text(translator, `manual.equipment.fluorine_cell.note.${index}`)
      ),
      reactionIds: ["hydrogen_fluoride_electrolysis"],
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

export const equipmentForReaction = (reactionId: ReactionId): EquipmentId[] => {
  const linked = (
    Object.entries(EQUIPMENT_MANUAL) as [EquipmentId, EquipmentManualEntry][]
  ).flatMap(([equipmentId, entry]) =>
    entry.reactionIds.includes(reactionId) ? [equipmentId] : []
  );
  const behavior = REACTION_DEFINITIONS[reactionId].behavior;
  if (behavior.kind !== "mass_action") return linked;
  const kineticEquipment: EquipmentId[] = [
    behavior.contact === "gas" ? "gas_agitator" : "wet_contactor",
  ];
  if (behavior.forward.activationTemperature > 22) kineticEquipment.push("thermal_coil");
  return [...new Set([...linked, ...kineticEquipment])];
};

export const reactionMechanics = createReactionMechanics(DEFAULT_TRANSLATOR);
