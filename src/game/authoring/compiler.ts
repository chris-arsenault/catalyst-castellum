import type {
  GameDefinition,
  GamePackSource,
  LevelDefinition,
  RoundDefinition,
} from "../definitionTypes";
import type { ScenarioAvailability, SpeciesId } from "../types";
import { createFacilityModel } from "../engine/facilityModel";
import { isProcessLine } from "../world/map";
import { validateWorldMap } from "../world/mapValidation";

export interface AuthoringIssue {
  path: string;
  message: string;
}

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
  availability: ScenarioAvailability,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const checks = [
    ["equipment", availability.equipment, source.equipment],
    ["gasLines", availability.gasLines, source.map.connections],
    ["liquidLines", availability.liquidLines, source.map.connections],
    ["gasSources", availability.gasSources, source.gasSources],
    ["liquidSources", availability.liquidSources, source.liquidSources],
  ] as const;
  for (const [field, ids, catalog] of checks) {
    validateAvailableIds(ids, catalog, `${path}.${field}`, issues);
  }
  for (const [field, kind] of [
    ["gasLines", "gas_line"],
    ["liquidLines", "liquid_line"],
  ] as const) {
    for (const id of availability[field]) {
      if (source.map.connections[id] && source.map.connections[id].kind !== kind)
        push(issues, `${path}.${field}`, `${id} is not a ${kind}.`);
    }
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

const validateRound = (
  source: GamePackSource,
  round: RoundDefinition,
  previous: RoundDefinition | undefined,
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
  }
  validateAvailability(source, round.availability, `${path}.availability`, issues);
  if (previous) {
    const fields = ["equipment", "gasLines", "liquidLines", "gasSources", "liquidSources"] as const;
    for (const field of fields) {
      if (!isSuperset(round.availability[field], previous.availability[field])) {
        push(issues, `${path}.availability.${field}`, "Round availability must be cumulative.");
      }
    }
  }
};

const validateLevel = (
  source: GamePackSource,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  validateLevelDefinition(source, level, path, issues);
  validateEquipmentLoadout(source, level, path, issues);
  validateConduitLoadout(source, level, path, issues);
};

const validateLevelDefinition = (
  source: GamePackSource,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (!(level.focusRoomId in source.rooms))
    push(issues, `${path}.focusRoomId`, `Unknown room ${level.focusRoomId}.`);
  for (const reactionId of level.featuredReactionIds) {
    if (!(reactionId in source.reactions))
      push(issues, `${path}.featuredReactionIds`, `Unknown reaction ${reactionId}.`);
  }
  if (level.rounds.length === 0)
    push(issues, `${path}.rounds`, "A level must contain at least one round.");
  const roundIds = level.rounds.map(({ id }) => id);
  if (new Set(roundIds).size !== roundIds.length)
    push(issues, `${path}.rounds`, "Round IDs must be unique within a level.");
  level.rounds.forEach((round, index) =>
    validateRound(source, round, level.rounds[index - 1], `${path}.rounds.${index}`, issues)
  );
};

const validateEquipmentLoadout = (
  source: GamePackSource,
  level: LevelDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  for (const [roomId, equipment] of Object.entries(level.loadout.equipment)) {
    if (!(roomId in source.rooms))
      push(issues, `${path}.loadout.equipment`, `Unknown room ${roomId}.`);
    for (const instance of Object.values(equipment ?? {})) {
      if (instance && !(instance.equipmentId in source.equipment))
        push(issues, `${path}.loadout.equipment`, `Unknown equipment ${instance.equipmentId}.`);
    }
  }
};

const validateConduitLoadout = (
  source: GamePackSource,
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
      if (source.map.connections[id]?.kind !== kind)
        push(issues, `${path}.loadout.${field}`, `${id} is not an authored ${kind}.`);
    }
  }
};

const compositionFor = (source: GamePackSource, speciesId: SpeciesId) =>
  source.species[speciesId]?.elements;

const reactionElementTotals = (
  source: GamePackSource,
  participants: GamePackSource["reactions"][keyof GamePackSource["reactions"]]["reactants"]
): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const participant of participants) {
    const composition = compositionFor(source, participant.species);
    if (!composition) continue;
    for (const [element, amount] of Object.entries(composition)) {
      totals[element] = (totals[element] ?? 0) + amount * participant.coefficient;
    }
  }
  return totals;
};

type ReactionParticipants =
  GamePackSource["reactions"][keyof GamePackSource["reactions"]]["reactants"];

const validateReactionSide = (
  source: GamePackSource,
  participants: ReactionParticipants,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (participants.length === 0) push(issues, path, "Reaction side must contain participants.");
  for (const participant of participants) {
    if (!(participant.species in source.species))
      push(issues, path, `Unknown species ${participant.species}.`);
    if (participant.coefficient <= 0) push(issues, path, "Coefficients must be positive.");
  }
};

const validateReactionBalance = (
  source: GamePackSource,
  reaction: GamePackSource["reactions"][keyof GamePackSource["reactions"]],
  path: string,
  issues: AuthoringIssue[]
): void => {
  const reactants = reactionElementTotals(source, reaction.reactants);
  const products = reactionElementTotals(source, reaction.products);
  for (const element of new Set([...Object.keys(reactants), ...Object.keys(products)])) {
    if (Math.abs((reactants[element] ?? 0) - (products[element] ?? 0)) > 1e-8)
      push(issues, path, `Element ${element} is unbalanced.`);
  }
};

const validateReactions = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const [reactionId, reaction] of Object.entries(source.reactions)) {
    validateIdentity(issues, `reactions.${reactionId}.id`, reactionId, reaction.id);
    validateReactionSide(source, reaction.reactants, `reactions.${reactionId}.reactants`, issues);
    validateReactionSide(source, reaction.products, `reactions.${reactionId}.products`, issues);
    validateReactionBalance(source, reaction, `reactions.${reactionId}`, issues);
  }
};

const validateMap = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const { path, message } of validateWorldMap(source.map)) {
    push(issues, `map.${path}`, message);
  }
  for (const [roomId, room] of Object.entries(source.map.rooms)) {
    for (const sourceId of room.taps.gas.sourceIds) {
      if (!(sourceId in source.gasSources))
        push(issues, `map.rooms.${roomId}.taps.gas`, `Unknown gas source ${sourceId}.`);
    }
    for (const sourceId of room.taps.liquid.sourceIds) {
      if (!(sourceId in source.liquidSources))
        push(issues, `map.rooms.${roomId}.taps.liquid`, `Unknown liquid source ${sourceId}.`);
    }
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

const validateProcesses = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const [processId, process] of Object.entries(source.processes)) {
    validateIdentity(issues, `processes.${processId}.id`, processId, process.id);
    if (!(process.reactionId in source.reactions))
      push(issues, `processes.${processId}.reactionId`, `Unknown reaction ${process.reactionId}.`);
    if (!(process.equipmentId in source.equipment))
      push(
        issues,
        `processes.${processId}.equipmentId`,
        `Unknown equipment ${process.equipmentId}.`
      );
  }
};

const validateWorldCoverage = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  const roomIds = Object.keys(source.rooms);
  if ([...source.roomOrder].sort().join("|") !== [...roomIds].sort().join("|")) {
    push(issues, "roomOrder", "roomOrder must list every room exactly once.");
  }
  for (const [roomId, room] of Object.entries(source.rooms)) {
    validateIdentity(issues, `rooms.${roomId}.id`, roomId, room.id);
    if (!(roomId in source.map.rooms))
      push(issues, `map.rooms.${roomId}`, "Every room requires map geometry.");
  }
  for (const roomId of Object.keys(source.map.rooms)) {
    if (!(roomId in source.rooms))
      push(issues, `map.rooms.${roomId}`, `Map room ${roomId} has no room definition.`);
  }
  for (const connection of Object.values(source.map.connections)) {
    if (!isProcessLine(connection)) continue;
    for (const roomId of connection.rooms) {
      if (!(roomId in source.rooms))
        push(issues, `map.connections.${connection.id}.rooms`, `Unknown room ${roomId}.`);
    }
  }
};

export const validateGamePack = (source: GamePackSource): readonly AuthoringIssue[] => {
  const issues: AuthoringIssue[] = [];
  if (source.packId.trim().length === 0) push(issues, "packId", "Pack ID must be non-empty.");
  validateWorldCoverage(source, issues);
  if (!Number.isInteger(source.contentVersion) || source.contentVersion < 1)
    push(issues, "contentVersion", "Content version must be a positive integer.");
  validateLevelOrder(source, issues);
  validateReactions(source, issues);
  validateMap(source, issues);
  validateProcesses(source, issues);
  return issues;
};

export const compileGamePack = (source: GamePackSource): GameDefinition => {
  const issues = validateGamePack(source);
  if (issues.length > 0) throw new GamePackCompilationError(issues);
  return deepFreeze({ ...source, facility: createFacilityModel(source.map) });
};
