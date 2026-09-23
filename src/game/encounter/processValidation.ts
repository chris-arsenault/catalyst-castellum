import { validateEquipmentStates } from "../engine/equipmentStateValidation";
import { validateSupplyStates } from "../engine/supplyStateValidation";
import { processLineIds } from "../world/instances";
import type { EquipmentInstance, GridCell } from "../types";
import { processDefinitionForMap } from "./processDefinition";
import type { ProcessEncounterState, ProcessEncounterContext } from "./processTypes";

const sameIds = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length && expected.every((id) => actual.includes(id));

const validateFinite = (value: unknown, path: string, issues: string[]): void => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) issues.push(`${path}: value must be finite.`);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value))
      validateFinite(child, `${path}.${key}`, issues);
  }
};

const validateInventory = (inventory: object, path: string, issues: string[]): void => {
  for (const [species, amount] of Object.entries(inventory)) {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)
      issues.push(`${path}.${species}: inventory must be finite and nonnegative.`);
  }
};

const sameRoute = (left: readonly GridCell[], right: readonly GridCell[]): boolean =>
  left.length === right.length &&
  left.every(
    (cell, index) =>
      cell.column === right[index]?.column && cell.elevation === right[index]?.elevation
  );

const validateEquipment = (
  equipment: EquipmentInstance,
  path: string,
  context: ProcessEncounterContext,
  issues: string[]
): void => {
  if (!context.definition.process.equipment[equipment.equipmentId]) {
    issues.push(`${path}: equipment is absent from the process catalog.`);
    return;
  }
  for (const [outputId, output] of Object.entries(equipment.operation?.outputs ?? {})) {
    if (output)
      validateInventory(
        output.phase === "gas" ? output.gas : output.liquid,
        `${path}.outputs.${outputId}`,
        issues
      );
  }
};

const validateRooms = (
  state: ProcessEncounterState,
  context: ProcessEncounterContext,
  issues: string[]
): void => {
  for (const [id, room] of Object.entries(state.process.rooms)) {
    const path = `process.rooms.${id}`;
    if (room.id !== id) issues.push(`${path}.id: room identity differs from its record key.`);
    validateInventory(room.gas.lower, `${path}.gas.lower`, issues);
    validateInventory(room.gas.upper, `${path}.gas.upper`, issues);
    validateInventory(room.liquid, `${path}.liquid`, issues);
    validateInventory(room.stationary, `${path}.stationary`, issues);
    for (const [socketId, equipment] of Object.entries(room.equipment)) {
      if (equipment) validateEquipment(equipment, `${path}.equipment.${socketId}`, context, issues);
    }
  }
};

const validateConduits = (
  state: ProcessEncounterState,
  phase: "gas" | "liquid",
  issues: string[]
): void => {
  const conduits = phase === "gas" ? state.process.gasConduits : state.process.liquidConduits;
  for (const [id, conduit] of Object.entries(conduits)) {
    const line = state.map.connections[id];
    if (!line || (line.kind !== "gas_line" && line.kind !== "liquid_line")) continue;
    if (!sameRoute(conduit.route, line.route))
      issues.push(
        `process.${phase}Conduits.${id}.route: route differs from active map connection.`
      );
    validateInventory(
      "gas" in conduit ? conduit.gas : conduit.liquid,
      `process.${phase}Conduits.${id}`,
      issues
    );
  }
};

const validateNetworks = (state: ProcessEncounterState, issues: string[]): void => {
  for (const [id, junction] of Object.entries(state.process.gasJunctions))
    validateInventory(junction.gas, `process.gasJunctions.${id}`, issues);
  for (const [id, junction] of Object.entries(state.process.liquidJunctions))
    validateInventory(junction.liquid, `process.liquidJunctions.${id}`, issues);
  validateConduits(state, "gas", issues);
  validateConduits(state, "liquid", issues);
  validateInventory(state.process.gasVent, "process.gasVent", issues);
  validateInventory(state.process.liquidDrain, "process.liquidDrain", issues);
};

const validateTowerResources = (
  state: ProcessEncounterState,
  context: ProcessEncounterContext,
  issues: string[]
): void => {
  for (const [id, resources] of Object.entries(state.process.towerResources)) {
    const tower = state.towers[id];
    if (!tower) issues.push(`process.towerResources.${id}: tower is absent from encounter.`);
    validateInventory(resources.gas, `process.towerResources.${id}.gas`, issues);
    validateInventory(resources.liquid, `process.towerResources.${id}.liquid`, issues);
    const capacity = tower
      ? context.combat.towers[tower.chassisId]?.supply?.localCapacity
      : undefined;
    const total = [...Object.values(resources.gas), ...Object.values(resources.liquid)].reduce(
      (sum, amount) => sum + (amount ?? 0),
      0
    );
    if (capacity !== undefined && total > capacity + 0.001)
      issues.push(`process.towerResources.${id}: inventory exceeds tower capacity.`);
  }
};

const validateTowerSupply = (state: ProcessEncounterState, issues: string[]): void => {
  for (const [id, status] of Object.entries(state.process.towerSupply)) {
    if (!(id in state.towers) || status.towerId !== id)
      issues.push(`process.towerSupply.${id}: supply status differs from tower identity.`);
  }
};

export const validateProcessState = (
  state: ProcessEncounterState,
  context: ProcessEncounterContext
): readonly string[] => {
  const issues: string[] = [];
  const expectations = [
    ["rooms", Object.keys(state.map.rooms)],
    ["gasJunctions", Object.keys(state.map.rooms)],
    ["liquidJunctions", Object.keys(state.map.rooms)],
    ["gasConduits", processLineIds(state, "gas_line")],
    ["liquidConduits", processLineIds(state, "liquid_line")],
  ] as const;
  for (const [field, ids] of expectations) {
    if (!sameIds(Object.keys(state.process[field]), ids))
      issues.push(`process.${field}: inventory identities differ from the active map.`);
  }
  validateFinite(state.process, "process", issues);
  validateRooms(state, context, issues);
  validateNetworks(state, issues);
  validateTowerResources(state, context, issues);
  validateTowerSupply(state, issues);
  const definition = processDefinitionForMap(context.definition.process, state.map);
  issues.push(
    ...validateSupplyStates(state, definition).map(
      ({ path, message }) => `process.${path}: ${message}`
    )
  );
  // Catalog/record errors above can make equipment lookup invalid; report them before deeper checks.
  if (issues.length === 0)
    issues.push(
      ...validateEquipmentStates(state, definition).map(
        ({ path, message }) => `process.${path}: ${message}`
      )
    );
  return issues;
};
