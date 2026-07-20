import type {
  GameDefinition,
  GamePackSource,
  LevelDefinition,
  RoundDefinition,
} from "../definitionTypes";
import type { ScenarioAvailability, SpeciesId } from "../types";
import { parseProcessLineId } from "../world/map";
import type { WorldMap } from "../world/map";
import { hullLayoutFromMap } from "../world/hullFragment";
import { validateWorldMap } from "../world/mapValidation";
import { generateSiteLayoutCandidate } from "../world/siteGenerator";
import { MAX_ENEMY_LEVEL, MIN_ENEMY_LEVEL, resolveEnemyLevel } from "../engine/enemyLevel";
import { validateEnemyDefinitions, type EnemyAuthoringIssue } from "./enemyValidation";
import { validateCatalogStructure } from "./catalogValidation";
import { validateReactions } from "./reactionValidation";
import { validateEquipmentOperations } from "./equipmentOperationValidation";
import { validateLevelSupplies } from "./supplyValidation";

export type AuthoringIssue = EnemyAuthoringIssue;

export class GamePackCompilationError extends Error {
  readonly issues: readonly AuthoringIssue[];

  constructor(issues: readonly AuthoringIssue[]) {
    super(
      `Game pack compilation failed: ${issues
        .map(({ path, message }) => `${path}: ${message}`)
        .join("; ")}`
    );
    this.name = "GamePackCompilationError";
    this.issues = issues;
  }
}

const deepFreeze = <Value>(value: Value, seen = new WeakSet<object>()): Value => {
  if (typeof value !== "object" || value === null || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
};

const push = (issues: AuthoringIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const validateIdentity = (
  issues: AuthoringIssue[],
  path: string,
  key: string,
  declared: string
): void => {
  if (key !== declared)
    push(issues, path, `Record key ${key} differs from declared ID ${declared}.`);
};

const validateAvailability = (
  source: GamePackSource,
  map: WorldMap,
  availability: ScenarioAvailability,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const checks = [["equipment", availability.equipment, source.equipment]] as const;
  for (const [field, ids, catalog] of checks) {
    validateAvailableIds(ids, catalog, `${path}.${field}`, issues);
  }
  // Line availability authorizes a room pair; the pair need not be authored on the
  // map — an unauthored available pair is exactly what the player may route (M3).
  for (const [field, kind] of [
    ["gasLines", "gas_line"],
    ["liquidLines", "liquid_line"],
  ] as const) {
    const ids = availability[field];
    if (new Set(ids).size !== ids.length)
      push(issues, `${path}.${field}`, "Identifiers must be unique.");
    for (const id of ids) validateAvailableLine(source, map, id, kind, `${path}.${field}`, issues);
  }
};

const validateAvailableLine = (
  source: GamePackSource,
  map: WorldMap,
  id: string,
  kind: "gas_line" | "liquid_line",
  path: string,
  issues: AuthoringIssue[]
): void => {
  const authored = map.connections[id] ?? source.lineBlueprints[id];
  if (authored) {
    if (authored.kind !== kind) push(issues, path, `${id} is not a ${kind}.`);
    return;
  }
  const parsed = parseProcessLineId(id);
  if (!parsed || parsed.kind !== kind) {
    push(issues, path, `Unknown authored ID ${id}.`);
    return;
  }
  for (const roomId of parsed.rooms) {
    if (!(roomId in map.rooms)) push(issues, path, `${id} references unknown room ${roomId}.`);
  }
};

const validateAvailableIds = (
  ids: readonly string[],
  catalog: object,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (new Set(ids).size !== ids.length) push(issues, path, "Identifiers must be unique.");
  for (const id of ids) {
    if (!(id in catalog)) push(issues, path, `Unknown authored ID ${id}.`);
  }
};

const isSuperset = (next: readonly string[], previous: readonly string[]): boolean =>
  previous.every((id) => next.includes(id));

const validateEnemyLevel = (
  siteEnemyLevel: number,
  entry: RoundDefinition["wave"][number],
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (!Number.isInteger(entry.levelOffset)) {
    push(issues, path, "Enemy level offset must be an integer.");
  }
  const enemyLevel = resolveEnemyLevel(siteEnemyLevel, entry.levelOffset);
  if (enemyLevel < MIN_ENEMY_LEVEL || enemyLevel > MAX_ENEMY_LEVEL) {
    push(
      issues,
      path,
      `Resolved enemy level must be between ${MIN_ENEMY_LEVEL} and ${MAX_ENEMY_LEVEL}.`
    );
  }
};

const validateRound = (
  source: GamePackSource,
  map: WorldMap,
  round: RoundDefinition,
  previous: RoundDefinition | undefined,
  siteEnemyLevel: number,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (round.primeSeconds < 0)
    push(issues, `${path}.primeSeconds`, "Prime time must be nonnegative.");
  if (round.wave.length === 0)
    push(issues, `${path}.wave`, "A round must contain at least one wave entry.");
  for (const [index, entry] of round.wave.entries()) {
    if (!(entry.type in source.enemies))
      push(issues, `${path}.wave.${index}.type`, `Unknown enemy ${entry.type}.`);
    if (entry.at < 0) push(issues, `${path}.wave.${index}.at`, "Spawn time must be nonnegative.");
    validateEnemyLevel(siteEnemyLevel, entry, `${path}.wave.${index}.levelOffset`, issues);
  }
  validateFieldSupportWave(source, round, path, issues);
  validateAvailability(source, map, round.availability, `${path}.availability`, issues);
  if (previous) {
    const fields = ["equipment", "gasLines", "liquidLines"] as const;
    for (const field of fields) {
      if (!isSuperset(round.availability[field], previous.availability[field])) {
        push(issues, `${path}.availability.${field}`, "Round availability must be cumulative.");
      }
    }
  }
};

const validateFieldSupportWave = (
  source: GamePackSource,
  round: RoundDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const fieldCount = round.wave.filter(
    (entry) => source.enemies[entry.type]?.behavior.kind === "shared_field"
  ).length;
  if (fieldCount > 1)
    push(issues, `${path}.wave`, "A round may author at most one shared-field enemy.");
  if (fieldCount === 1 && round.wave.length === 1) {
    push(issues, `${path}.wave`, "A shared-field enemy must enter with at least one ally.");
  }
};

const validateLevel = (
  source: GamePackSource,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const map = mapForLevel(source, level, path, issues);
  validateLevelDefinition(source, map, level, path, issues);
  validateEquipmentLoadout(source, map, level, path, issues);
  issues.push(...validateLevelSupplies(source, map, level, path));
  validateStationaryLoadout(source, map, level, path, issues);
  validateConduitLoadout(source, map, level, path, issues);
};

const mapForLevel = (
  source: GamePackSource,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): WorldMap => {
  if (!level.site) return source.map;
  try {
    return generateSiteLayoutCandidate(
      level.site.spec,
      hullLayoutFromMap(source.map),
      level.site.seed
    ).map;
  } catch (error) {
    push(
      issues,
      `${path}.site`,
      error instanceof Error ? error.message : "Generated site production failed."
    );
    return source.map;
  }
};

const validateLevelDefinition = (
  source: GamePackSource,
  map: WorldMap,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (!(level.focusRoomId in map.rooms))
    push(issues, `${path}.focusRoomId`, `Unknown room ${level.focusRoomId}.`);
  if (
    !Number.isInteger(level.enemyLevel) ||
    level.enemyLevel < MIN_ENEMY_LEVEL ||
    level.enemyLevel > MAX_ENEMY_LEVEL
  ) {
    push(
      issues,
      `${path}.enemyLevel`,
      `Site enemy level must be an integer between ${MIN_ENEMY_LEVEL} and ${MAX_ENEMY_LEVEL}.`
    );
  }
  for (const reactionId of level.featuredReactionIds) {
    if (!(reactionId in source.reactions))
      push(issues, `${path}.featuredReactionIds`, `Unknown reaction ${reactionId}.`);
  }
  if (level.rounds.length === 0)
    push(issues, `${path}.rounds`, "A level must contain at least one round.");
  if (level.rounds.length < 5)
    push(issues, `${path}.rounds`, "A site must contain at least five rounds.");
  const roundIds = level.rounds.map(({ id }) => id);
  if (new Set(roundIds).size !== roundIds.length)
    push(issues, `${path}.rounds`, "Round IDs must be unique within a level.");
  level.rounds.forEach((round, index) =>
    validateRound(
      source,
      map,
      round,
      level.rounds[index - 1],
      level.enemyLevel,
      `${path}.rounds.${index}`,
      issues
    )
  );
};

const validateEquipmentLoadout = (
  source: GamePackSource,
  map: WorldMap,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  for (const [roomId, equipment] of Object.entries(level.loadout.equipment)) {
    if (!(roomId in map.rooms))
      push(issues, `${path}.loadout.equipment`, `Unknown room ${roomId}.`);
    for (const instance of Object.values(equipment ?? {})) {
      if (instance && !(instance.equipmentId in source.equipment))
        push(issues, `${path}.loadout.equipment`, `Unknown equipment ${instance.equipmentId}.`);
    }
  }
};

const validateStationaryLoadout = (
  source: GamePackSource,
  map: WorldMap,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  for (const [roomId, inventory] of Object.entries(level.loadout.stationary)) {
    if (!(roomId in map.rooms))
      push(issues, `${path}.loadout.stationary`, `Unknown room ${roomId}.`);
    for (const [speciesId, amount] of Object.entries(inventory ?? {})) {
      if (source.species[speciesId as SpeciesId]?.phase !== "stationary")
        push(
          issues,
          `${path}.loadout.stationary.${roomId}`,
          `${speciesId} is not a stationary species.`
        );
      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0))
        push(
          issues,
          `${path}.loadout.stationary.${roomId}.${speciesId}`,
          "Stationary inventory must be finite and nonnegative."
        );
    }
  }
};

const validateConduitLoadout = (
  source: GamePackSource,
  map: WorldMap,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const conduitLoadouts = [
    ["gasConduits", level.loadout.gasConduits, "gas_line"],
    ["liquidConduits", level.loadout.liquidConduits, "liquid_line"],
  ] as const;
  for (const [field, loadouts, kind] of conduitLoadouts) {
    for (const id of Object.keys(loadouts)) {
      if ((map.connections[id] ?? source.lineBlueprints[id])?.kind !== kind)
        push(issues, `${path}.loadout.${field}`, `${id} is not an authored ${kind}.`);
    }
  }
};

const validateMap = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const { path, message } of validateWorldMap(source.map)) {
    push(issues, `map.${path}`, message);
  }
};

const validateLevelOrder = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  const orderedLevels = new Set<string>(source.levelOrder);
  if (source.levelOrder.length === 0)
    push(issues, "levelOrder", "A pack must contain at least one level.");
  if (new Set(source.levelOrder).size !== source.levelOrder.length)
    push(issues, "levelOrder", "Level order must contain unique IDs.");
  for (const levelId of source.levelOrder) {
    const level = source.levels[levelId];
    if (!level) {
      push(issues, "levelOrder", `Unknown level ${levelId}.`);
      continue;
    }
    validateIdentity(issues, `levels.${levelId}.id`, levelId, level.id);
    validateLevel(source, level, `levels.${levelId}`, issues);
  }
  for (const levelId of Object.keys(source.levels)) {
    if (!orderedLevels.has(levelId))
      push(issues, `levels.${levelId}`, "Level is missing from levelOrder.");
  }
};

const validateSpeciesHazardSources = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const [speciesId, species] of Object.entries(source.species)) {
    if (species.hazards.length > 0 && species.damageSourceId === null) {
      push(
        issues,
        `species.${speciesId}.damageSourceId`,
        "A hazardous species requires a combat damage source."
      );
    }
    for (const [index, hazard] of species.hazards.entries()) {
      if (
        hazard.maximumExcess !== null &&
        (!Number.isFinite(hazard.maximumExcess) || hazard.maximumExcess <= 0)
      ) {
        push(
          issues,
          `species.${speciesId}.hazards.${index}.maximumExcess`,
          "Maximum hazard excess must be finite and positive."
        );
      }
    }
  }
};

export const validateGamePack = (source: GamePackSource): readonly AuthoringIssue[] => {
  const issues: AuthoringIssue[] = [];
  if (source.packId.trim().length === 0) push(issues, "packId", "Pack ID must be non-empty.");
  issues.push(...validateCatalogStructure(source));
  if (!Number.isInteger(source.contentVersion) || source.contentVersion < 1)
    push(issues, "contentVersion", "Content version must be a positive integer.");
  validateLevelOrder(source, issues);
  validateSpeciesHazardSources(source, issues);
  validateReactions(source, issues);
  validateEquipmentOperations(source, issues);
  validateMap(source, issues);
  issues.push(...validateEnemyDefinitions(source));
  return issues;
};

export const compileGamePack = (source: GamePackSource): GameDefinition => {
  const issues = validateGamePack(source);
  if (issues.length > 0) throw new GamePackCompilationError(issues);
  return deepFreeze({ ...source });
};
