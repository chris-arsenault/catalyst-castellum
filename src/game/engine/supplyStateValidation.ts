import type { ProcessEncounterState, ProcessSimulationDefinition } from "../encounter/processTypes";
import type { StateValidationIssue } from "./stateValidationTypes";

const sameIdentifiers = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length &&
  new Set(actual).size === actual.length &&
  expected.every((id) => actual.includes(id));

const supplyIssue = (path: string, message: string): StateValidationIssue => ({
  code: "supply_state_invalid",
  path,
  message,
});

const validateRecordKeys = (
  state: ProcessEncounterState,
  definition: ProcessSimulationDefinition
): readonly StateValidationIssue[] => {
  const supplies = definition.supplies;
  const expectedGas = supplies.filter(({ phase }) => phase === "gas").map(({ id }) => id);
  const expectedLiquid = supplies.filter(({ phase }) => phase === "liquid").map(({ id }) => id);
  const issues: StateValidationIssue[] = [];
  if (!sameIdentifiers(Object.keys(state.process.gasSources), expectedGas)) {
    issues.push(
      supplyIssue(
        "gasSources",
        "Gas reservoir state differs from the active site's supply authoring."
      )
    );
  }
  if (!sameIdentifiers(Object.keys(state.process.liquidSources), expectedLiquid)) {
    issues.push(
      supplyIssue(
        "liquidSources",
        "Liquid reservoir state differs from the active site's supply authoring."
      )
    );
  }
  return issues;
};

export const validateSupplyStates = (
  state: ProcessEncounterState,
  definition: ProcessSimulationDefinition
): readonly StateValidationIssue[] => {
  const issues = [...validateRecordKeys(state, definition)];
  for (const supply of definition.supplies) {
    const inventory =
      supply.phase === "gas"
        ? state.process.gasSources[supply.id]?.gas
        : state.process.liquidSources[supply.id]?.liquid;
    if (!inventory) continue;
    const amounts = Object.values(inventory);
    const path = `${supply.phase}Sources.${supply.id}`;
    if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
      issues.push(supplyIssue(path, "Supply inventory must be finite and nonnegative."));
    }
    if (amounts.reduce((total, amount) => total + amount, 0) > supply.capacity + 0.001) {
      issues.push(supplyIssue(path, "Supply inventory exceeds its site-authored capacity."));
    }
  }
  return issues;
};
