import type { GamePackSource } from "../definitionTypes";
import type {
  EquipmentOutputDefinition,
  EquipmentSeparatorBackflowDefinition,
  GasType,
  SpeciesId,
} from "../types";
import type { EnemyAuthoringIssue } from "./enemyValidation";

type AuthoringIssue = EnemyAuthoringIssue;
type AuthoredEquipment = GamePackSource["equipment"][keyof GamePackSource["equipment"]];

const push = (issues: AuthoringIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const validateOutput = (
  source: GamePackSource,
  equipment: AuthoredEquipment,
  output: EquipmentOutputDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const operation = equipment.operation;
  if (!operation) return;
  const reaction = source.reactions[operation.reactionId];
  if (!Number.isFinite(output.capacity) || output.capacity <= 0)
    push(issues, `${path}.capacity`, "Output capacity must be finite and positive.");
  if (source.species[output.speciesId]?.phase !== output.phase)
    push(issues, `${path}.speciesId`, `Output phase does not match ${output.speciesId}.`);
  if (!reaction) return;
  if (!reaction.products.some(({ species }) => species === output.speciesId))
    push(issues, `${path}.speciesId`, `${output.speciesId} is not produced by the reaction.`);
  if (reaction.reactants.some(({ species }) => species === output.speciesId))
    push(issues, `${path}.speciesId`, "An output species cannot also be a reactant.");
};

const validateSeparator = (
  equipment: AuthoredEquipment,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const operation = equipment.operation;
  const separator = operation?.separatorBackflow;
  if (!operation || !separator) return;
  const left = operation.outputs.find(({ id }) => id === separator.leftOutputId);
  const right = operation.outputs.find(({ id }) => id === separator.rightOutputId);
  if (separator.leftOutputId === separator.rightOutputId)
    push(issues, path, "Separator sides must use different outputs.");
  validateSeparatorPort(left, separator.leftSpeciesId, "left", path, issues);
  validateSeparatorPort(right, separator.rightSpeciesId, "right", path, issues);
  validateSeparatorRates(separator, path, issues);
};

const validateSeparatorPort = (
  output: EquipmentOutputDefinition | undefined,
  speciesId: GasType,
  side: "left" | "right",
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (!output || output.phase !== "gas") {
    push(
      issues,
      `${path}.${side}OutputId`,
      `Separator ${side} output must reference a gas output.`
    );
    return;
  }
  if (output.speciesId !== speciesId)
    push(
      issues,
      `${path}.${side}SpeciesId`,
      `Separator ${side} species must match its output product.`
    );
};

const validateSeparatorRates = (
  separator: EquipmentSeparatorBackflowDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (!Number.isFinite(separator.activationDifference) || separator.activationDifference < 0)
    push(issues, `${path}.activationDifference`, "Activation difference must be nonnegative.");
  if (
    !Number.isFinite(separator.flowOffset) ||
    separator.flowOffset < 0 ||
    separator.flowOffset > separator.activationDifference
  )
    push(issues, `${path}.flowOffset`, "Flow offset must lie within the activation difference.");
  if (!Number.isFinite(separator.rate) || separator.rate < 0)
    push(issues, `${path}.rate`, "Separator rate must be finite and nonnegative.");
};

const validateOperation = (
  source: GamePackSource,
  equipment: AuthoredEquipment,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const operation = equipment.operation;
  const gradeKinds = new Set(equipment.grades.map(({ behavior }) => behavior.kind));
  if (!operation) {
    if (gradeKinds.has("electrolyzer"))
      push(issues, `${path}.grades`, "Electrolyzer grades require an authored operation.");
    return;
  }
  if (gradeKinds.size !== 1 || !gradeKinds.has("electrolyzer"))
    push(issues, `${path}.grades`, "Reaction operations require electrolyzer grades.");
  validateElectrolyzerGrades(equipment, `${path}.grades`, issues);
  validateOperationReaction(source, equipment, `${path}.operation.reactionId`, issues);
  const ids = operation.outputs.map(({ id }) => id);
  const species = operation.outputs.map(({ speciesId }) => speciesId as SpeciesId);
  if (new Set(ids).size !== ids.length)
    push(issues, `${path}.operation.outputs`, "Output IDs must be unique within an operation.");
  if (new Set(species).size !== species.length)
    push(issues, `${path}.operation.outputs`, "Each product may use at most one dedicated output.");
  operation.outputs.forEach((output, index) =>
    validateOutput(source, equipment, output, `${path}.operation.outputs.${index}`, issues)
  );
  validateSeparator(equipment, `${path}.operation.separatorBackflow`, issues);
};

const validateOperationReaction = (
  source: GamePackSource,
  equipment: AuthoredEquipment,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const operation = equipment.operation;
  if (!operation) return;
  const reaction = source.reactions[operation.reactionId];
  if (!reaction) {
    push(issues, path, `Unknown reaction ${operation.reactionId}.`);
  } else if (reaction.behavior.kind !== "electrolysis") {
    push(issues, path, "Equipment operations require electrolysis.");
  } else if (
    !Number.isFinite(reaction.behavior.maximumRate) ||
    reaction.behavior.maximumRate <= 0
  ) {
    push(issues, path, "Electrolysis maximum rate must be positive.");
  }
};

const validateElectrolyzerGrades = (
  equipment: AuthoredEquipment,
  path: string,
  issues: AuthoringIssue[]
): void => {
  equipment.grades.forEach((grade, index) => {
    if (grade.behavior.kind !== "electrolyzer") return;
    if (!Number.isFinite(grade.behavior.processRate) || grade.behavior.processRate <= 0)
      push(issues, `${path}.${index}.behavior.processRate`, "Process rate must be positive.");
    if (!Number.isFinite(grade.behavior.powerDraw) || grade.behavior.powerDraw <= 0)
      push(issues, `${path}.${index}.behavior.powerDraw`, "Power draw must be positive.");
  });
};

export const validateEquipmentOperations = (
  source: GamePackSource,
  issues: AuthoringIssue[]
): void => {
  for (const [equipmentId, equipment] of Object.entries(source.equipment)) {
    const path = `equipment.${equipmentId}`;
    if (equipment.id !== equipmentId)
      push(
        issues,
        `${path}.id`,
        `Record key ${equipmentId} differs from declared ID ${equipment.id}.`
      );
    validateOperation(source, equipment, path, issues);
  }
};
