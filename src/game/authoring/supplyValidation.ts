import type { GamePackSource, LevelDefinition } from "../definitionTypes";
import type { SpeciesId } from "../types";
import type { WorldMap } from "../world/map";
import type { EnemyAuthoringIssue } from "./enemyValidation";

const add = (issues: EnemyAuthoringIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const inventoryTotal = (contents: object): number =>
  Object.values(contents).reduce<number>((total, amount) => total + Number(amount ?? 0), 0);

const validateContents = (
  source: GamePackSource,
  phase: "gas" | "liquid",
  contents: object,
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  for (const [speciesId, amount] of Object.entries(contents)) {
    if (source.species[speciesId as SpeciesId]?.phase !== phase) {
      add(issues, path, `${speciesId} is not a ${phase} species.`);
    }
    if (!Number.isFinite(amount) || amount < 0) {
      add(issues, `${path}.${speciesId}`, "Supply inventory must be finite and nonnegative.");
    }
  }
};

const validatePhysicalConnection = (
  map: WorldMap,
  supply: LevelDefinition["supplies"][number],
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  const utilityNode = map.utilityNodes[supply.id];
  if (!utilityNode) {
    add(issues, `${path}.id`, `Supply ${supply.id} has no physical utility node.`);
    return;
  }
  const room = map.rooms[utilityNode.hostRoomId];
  if (!room?.taps[supply.phase].sourceIds.includes(supply.id)) {
    add(
      issues,
      `${path}.id`,
      `Supply ${supply.id} is not connected to its host room's ${supply.phase} tap.`
    );
  }
};

const validateInventoryTotals = (
  supply: LevelDefinition["supplies"][number],
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (inventoryTotal(supply.initial) > supply.capacity) {
    add(issues, `${path}.initial`, "Initial inventory exceeds supply capacity.");
  }
  const chargeTotal = inventoryTotal(supply.replenishment.contents);
  if (chargeTotal <= 0) {
    add(issues, `${path}.replenishment.contents`, "A supply charge must be positive.");
  }
  if (chargeTotal > supply.capacity) {
    add(issues, `${path}.replenishment.contents`, "A supply charge exceeds capacity.");
  }
};

const validateSupply = (
  source: GamePackSource,
  map: WorldMap,
  level: LevelDefinition,
  supply: LevelDefinition["supplies"][number],
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (supply.id.trim().length === 0) add(issues, `${path}.id`, "Supply ID is required.");
  if (supply.code.trim().length === 0) add(issues, `${path}.code`, "Supply code is required.");
  if (!Number.isFinite(supply.capacity) || supply.capacity <= 0) {
    add(issues, `${path}.capacity`, "Supply capacity must be finite and positive.");
  }
  if (!/^#[0-9a-f]{6}$/iu.test(supply.accent)) {
    add(issues, `${path}.accent`, "Supply accent must be a six-digit hex color.");
  }
  if (!level.rounds.some(({ id }) => id === supply.availableFromRound)) {
    add(issues, `${path}.availableFromRound`, `Unknown round ${supply.availableFromRound}.`);
  }
  validatePhysicalConnection(map, supply, path, issues);
  validateContents(source, supply.phase, supply.initial, `${path}.initial`, issues);
  validateContents(
    source,
    supply.phase,
    supply.replenishment.contents,
    `${path}.replenishment.contents`,
    issues
  );
  validateInventoryTotals(supply, path, issues);
  if (
    supply.replenishment.kind === "matter" &&
    (!Number.isInteger(supply.replenishment.cost) || supply.replenishment.cost < 0)
  ) {
    add(issues, `${path}.replenishment.cost`, "Supply Matter cost must be a nonnegative integer.");
  }
};

export const validateLevelSupplies = (
  source: GamePackSource,
  map: WorldMap,
  level: LevelDefinition,
  path: string
): readonly EnemyAuthoringIssue[] => {
  const issues: EnemyAuthoringIssue[] = [];
  const ids = level.supplies.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    add(issues, `${path}.supplies`, "Supply IDs must be unique within a level.");
  }
  level.supplies.forEach((supply, index) =>
    validateSupply(source, map, level, supply, `${path}.supplies.${index}`, issues)
  );
  return issues;
};
