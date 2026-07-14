import type {
  GameDefinition,
  GamePackSource,
  LevelDefinition,
  RoundDefinition,
} from "../definitionTypes";
import type { GridCell, ScenarioAvailability, SpeciesId, TransportPhase } from "../types";
import { createFacilityModel } from "../engine/facilityModel";

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

const cellIsAdjacent = (left: GridCell, right: GridCell): boolean =>
  Math.abs(left.column - right.column) + Math.abs(left.elevation - right.elevation) === 1;

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
    ["gasRuns", availability.gasRuns, source.transportRuns],
    ["liquidRuns", availability.liquidRuns, source.transportRuns],
    ["gasSources", availability.gasSources, source.gasSources],
    ["liquidSources", availability.liquidSources, source.liquidSources],
  ] as const;
  for (const [field, ids, catalog] of checks) {
    if (new Set(ids).size !== ids.length)
      push(issues, `${path}.${field}`, "Identifiers must be unique.");
    for (const id of ids) {
      if (!(id in catalog)) push(issues, `${path}.${field}`, `Unknown authored ID ${id}.`);
    }
  }
  for (const runId of availability.gasRuns) {
    if (!source.transportRuns[runId]?.gas)
      push(issues, `${path}.gasRuns`, `${runId} has no gas phase.`);
  }
  for (const runId of availability.liquidRuns) {
    if (!source.transportRuns[runId]?.liquid)
      push(issues, `${path}.liquidRuns`, `${runId} has no liquid phase.`);
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
  if (!(round.primeSeconds >= 0))
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
    const fields = ["equipment", "gasRuns", "liquidRuns", "gasSources", "liquidSources"] as const;
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
  for (const [roomId, equipment] of Object.entries(level.loadout.equipment)) {
    if (!(roomId in source.rooms))
      push(issues, `${path}.loadout.equipment`, `Unknown room ${roomId}.`);
    for (const instance of Object.values(equipment ?? {})) {
      if (instance && !(instance.equipmentId in source.equipment))
        push(issues, `${path}.loadout.equipment`, `Unknown equipment ${instance.equipmentId}.`);
    }
  }
  const conduitLoadouts = [
    ["gasConduits", level.loadout.gasConduits, "gas"],
    ["liquidConduits", level.loadout.liquidConduits, "liquid"],
  ] as const;
  for (const [field, loadouts, phase] of conduitLoadouts) {
    for (const runId of Object.keys(loadouts)) {
      if (!source.transportRuns[runId as keyof typeof source.transportRuns]?.[phase])
        push(issues, `${path}.loadout.${field}`, `${runId} has no ${phase} phase.`);
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

const validateReactions = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const [reactionId, reaction] of Object.entries(source.reactions)) {
    validateIdentity(issues, `reactions.${reactionId}.id`, reactionId, reaction.id);
    for (const [side, participants] of [
      ["reactants", reaction.reactants],
      ["products", reaction.products],
    ] as const) {
      if (participants.length === 0)
        push(issues, `reactions.${reactionId}.${side}`, "Reaction side must contain participants.");
      for (const participant of participants) {
        if (!(participant.species in source.species))
          push(
            issues,
            `reactions.${reactionId}.${side}`,
            `Unknown species ${participant.species}.`
          );
        if (!(participant.coefficient > 0))
          push(issues, `reactions.${reactionId}.${side}`, "Coefficients must be positive.");
      }
    }
    const reactants = reactionElementTotals(source, reaction.reactants);
    const products = reactionElementTotals(source, reaction.products);
    for (const element of new Set([...Object.keys(reactants), ...Object.keys(products)])) {
      if (Math.abs((reactants[element] ?? 0) - (products[element] ?? 0)) > 1e-8)
        push(issues, `reactions.${reactionId}`, `Element ${element} is unbalanced.`);
    }
  }
};

const validateRoutes = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  const facility = createFacilityModel(source.facilityMap);
  for (const [runId, run] of Object.entries(source.transportRuns)) {
    validateIdentity(issues, `transportRuns.${runId}.id`, runId, run.id);
    for (const phase of ["gas", "liquid"] as const satisfies readonly TransportPhase[]) {
      const definition = run[phase];
      if (!definition) continue;
      const path = `transportRuns.${runId}.${phase}.blueprint`;
      if (definition.blueprint.length < 2)
        push(issues, path, "A route requires at least two cells.");
      definition.blueprint.forEach((cell, index) => {
        if (!facility.inBounds(cell))
          push(issues, `${path}.${index}`, "Route cell is outside the facility.");
        const previous = definition.blueprint[index - 1];
        if (previous && !cellIsAdjacent(previous, cell))
          push(issues, `${path}.${index}`, "Route cells must be orthogonally adjacent.");
      });
      if (
        definition.blueprint[0] &&
        facility.cellDefinition(definition.blueprint[0]).roomId !== definition.direction[0]
      )
        push(issues, path, "Route start is outside its source room.");
      if (
        definition.blueprint.at(-1) &&
        facility.cellDefinition(definition.blueprint.at(-1)!).roomId !== definition.direction[1]
      )
        push(issues, path, "Route end is outside its destination room.");
    }
  }
};

export const validateGamePack = (source: GamePackSource): readonly AuthoringIssue[] => {
  const issues: AuthoringIssue[] = [];
  if (source.packId.trim().length === 0) push(issues, "packId", "Pack ID must be non-empty.");
  if (!Number.isInteger(source.contentVersion) || source.contentVersion < 1)
    push(issues, "contentVersion", "Content version must be a positive integer.");
  if (source.levelOrder.length === 0)
    push(issues, "levelOrder", "A pack must contain at least one level.");
  if (new Set(source.levelOrder).size !== source.levelOrder.length)
    push(issues, "levelOrder", "Level order must contain unique IDs.");
  for (const levelId of source.levelOrder) {
    const level = source.levels[levelId];
    if (!level) push(issues, "levelOrder", `Unknown level ${levelId}.`);
    else {
      validateIdentity(issues, `levels.${levelId}.id`, levelId, level.id);
      validateLevel(source, level, `levels.${levelId}`, issues);
    }
  }
  for (const levelId of Object.keys(source.levels)) {
    if (!source.levelOrder.some((orderedId) => orderedId === levelId))
      push(issues, `levels.${levelId}`, "Level is missing from levelOrder.");
  }
  validateReactions(source, issues);
  validateRoutes(source, issues);
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
  return issues;
};

export const compileGamePack = (source: GamePackSource): GameDefinition => {
  const issues = validateGamePack(source);
  if (issues.length > 0) throw new GamePackCompilationError(issues);
  return deepFreeze({ ...source, facility: createFacilityModel(source.facilityMap) });
};
