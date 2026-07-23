import type { GamePackSource, LevelDefinition } from "../definitionTypes";
import { EQUIPMENT_IDS, PROCESS_FAMILY_IDS } from "../identifiers";
import type { EquipmentId, ProcessFamilyId, SpeciesId } from "../types";
import type { EnemyAuthoringIssue } from "./enemyValidation";

const add = (issues: EnemyAuthoringIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const ACCELERATORS: readonly EquipmentId[] = ["gas_agitator", "wet_contactor", "thermal_coil"];

const reactionInPalette = (
  source: GamePackSource,
  palette: readonly ProcessFamilyId[],
  reactionId: keyof GamePackSource["reactions"]
): boolean => {
  const reaction = source.reactions[reactionId];
  return reaction !== undefined && palette.includes(reaction.family);
};

const paletteEquipmentFromSource = (
  source: GamePackSource,
  palette: readonly ProcessFamilyId[]
): Set<EquipmentId> =>
  new Set(
    EQUIPMENT_IDS.filter((equipmentId) => {
      const operation = source.equipment[equipmentId]?.operation;
      if (!operation) return ACCELERATORS.includes(equipmentId);
      return operation.duties.some((duty) =>
        duty.reactionIds.some((reactionId) => reactionInPalette(source, palette, reactionId))
      );
    })
  );

const validateSpeciesFamily = (
  source: GamePackSource,
  level: LevelDefinition,
  speciesId: SpeciesId,
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  const family = source.species[speciesId]?.family;
  if (family === undefined || family === "common") return;
  if (!level.palette.includes(family))
    add(issues, path, `${speciesId} belongs to ${family}, outside the level palette.`);
};

const validatePaletteShape = (
  level: LevelDefinition,
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (level.palette.length < 1 || level.palette.length > 3)
    add(issues, `${path}.palette`, "A palette names one to three process families.");
  if (new Set(level.palette).size !== level.palette.length)
    add(issues, `${path}.palette`, "Palette families must be unique.");
  for (const family of level.palette) {
    if (!PROCESS_FAMILY_IDS.includes(family))
      add(issues, `${path}.palette`, `Unknown process family ${family}.`);
  }
};

export const validateLevelPalette = (
  source: GamePackSource,
  level: LevelDefinition,
  path: string
): readonly EnemyAuthoringIssue[] => {
  const issues: EnemyAuthoringIssue[] = [];
  validatePaletteShape(level, path, issues);
  level.supplies.forEach((supply, index) => {
    for (const contents of [supply.initial, supply.replenishment.contents]) {
      const entries = Object.entries(contents as Partial<Record<SpeciesId, number>>) as [
        SpeciesId,
        number,
      ][];
      for (const [speciesId, amount] of entries) {
        if (amount > 0)
          validateSpeciesFamily(source, level, speciesId, `${path}.supplies.${index}`, issues);
      }
    }
  });
  for (const [roomId, stationary] of Object.entries(level.loadout.stationary ?? {})) {
    const entries = Object.entries((stationary ?? {}) as Partial<Record<SpeciesId, number>>) as [
      SpeciesId,
      number,
    ][];
    for (const [speciesId, amount] of entries) {
      if (amount > 0)
        validateSpeciesFamily(
          source,
          level,
          speciesId,
          `${path}.loadout.stationary.${roomId}`,
          issues
        );
    }
  }
  const allowedEquipment = paletteEquipmentFromSource(source, level.palette);
  level.rounds.forEach((round, index) => {
    for (const equipmentId of round.availability.equipment) {
      if (!allowedEquipment.has(equipmentId))
        add(
          issues,
          `${path}.rounds.${index}.availability`,
          `${equipmentId} serves chemistry outside the level palette.`
        );
    }
  });
  return issues;
};
