import type { GamePackSource } from "../definitionTypes";
import type {
  EquipmentDutyDefinition,
  EquipmentOutputDefinition,
  EquipmentSeparatorBackflowDefinition,
  GasType,
  ReactionId,
  SpeciesId,
} from "../types";
import type { EnemyAuthoringIssue } from "./enemyValidation";

type AuthoringIssue = EnemyAuthoringIssue;
type AuthoredEquipment = GamePackSource["equipment"][keyof GamePackSource["equipment"]];

const push = (issues: AuthoringIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const dutyReactionIds = (equipment: AuthoredEquipment): ReactionId[] =>
  equipment.operation?.duties.flatMap((duty) => duty.reactionIds) ?? [];

const validateOutput = (
  source: GamePackSource,
  equipment: AuthoredEquipment,
  output: EquipmentOutputDefinition,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const operation = equipment.operation;
  if (!operation) return;
  const reactions = dutyReactionIds(equipment).flatMap((id) => {
    const reaction = source.reactions[id];
    return reaction ? [reaction] : [];
  });
  if (!Number.isFinite(output.capacity) || output.capacity <= 0)
    push(issues, `${path}.capacity`, "Output capacity must be finite and positive.");
  if (source.species[output.speciesId]?.phase !== output.phase)
    push(issues, `${path}.speciesId`, `Output phase does not match ${output.speciesId}.`);
  if (reactions.length === 0) return;
  if (
    !reactions.some((reaction) =>
      reaction.products.some(({ species }) => species === output.speciesId)
    )
  )
    push(issues, `${path}.speciesId`, `${output.speciesId} is not produced by any duty reaction.`);
  if (
    reactions.some((reaction) =>
      reaction.reactants.some(({ species }) => species === output.speciesId)
    )
  )
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
    if (gradeKinds.has("electrolyzer") || gradeKinds.has("vessel"))
      push(issues, `${path}.grades`, "Operation grades require an authored operation.");
    return;
  }
  if (gradeKinds.size !== 1 || !(gradeKinds.has("electrolyzer") || gradeKinds.has("vessel")))
    push(issues, `${path}.grades`, "Reaction operations require electrolyzer or vessel grades.");
  validateOperationGrades(equipment, `${path}.grades`, issues);
  validateDuties(source, equipment, `${path}.operation.duties`, issues);
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

const validateDuties = (
  source: GamePackSource,
  equipment: AuthoredEquipment,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const operation = equipment.operation;
  if (!operation) return;
  const electrolyzerGrades = equipment.grades.some(
    ({ behavior }) => behavior.kind === "electrolyzer"
  );
  if (operation.duties.length === 0) push(issues, path, "An operation requires at least one duty.");
  const media = operation.duties.map((duty) => duty.medium);
  if (new Set(media).size !== media.length)
    push(issues, path, "Each medium may select at most one duty.");
  operation.duties.forEach((duty, index) =>
    validateDuty(source, duty, electrolyzerGrades, `${path}.${index}`, issues)
  );
};

const validateDuty = (
  source: GamePackSource,
  duty: EquipmentDutyDefinition,
  electrolyzerGrades: boolean,
  path: string,
  issues: AuthoringIssue[]
): void => {
  if (duty.reactionIds.length === 0)
    push(issues, `${path}.reactionIds`, "A duty requires at least one reaction.");
  if (duty.medium !== null && source.species[duty.medium]?.phase !== "stationary")
    push(issues, `${path}.medium`, `Duty medium ${duty.medium} must be a stationary species.`);
  for (const reactionId of duty.reactionIds)
    validateDutyReaction(source, reactionId, electrolyzerGrades, `${path}.reactionIds`, issues);
};

const validateDutyReaction = (
  source: GamePackSource,
  reactionId: keyof GamePackSource["reactions"],
  electrolyzerGrades: boolean,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const reaction = source.reactions[reactionId];
  if (!reaction) {
    push(issues, path, `Unknown reaction ${reactionId}.`);
    return;
  }
  const kind = reaction.behavior.kind;
  if (electrolyzerGrades && kind !== "electrolysis")
    push(issues, path, "Electrolyzer duties require electrolysis reactions.");
  if (!electrolyzerGrades && kind !== "mass_action")
    push(issues, path, "Vessel duties require mass-action reactions.");
  validateDutyReactionRate(reaction, `${reactionId}`, path, issues);
  if (reaction.regime === "wild")
    push(issues, path, `Wild reaction ${reactionId} runs in rooms, not vessels.`);
};

const validateDutyReactionRate = (
  reaction: GamePackSource["reactions"][keyof GamePackSource["reactions"]],
  reactionId: string,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const behavior = reaction.behavior;
  if (behavior.kind !== "electrolysis" && behavior.kind !== "mass_action") return;
  if (!Number.isFinite(behavior.maximumRate) || behavior.maximumRate <= 0)
    push(issues, path, `Reaction ${reactionId} maximum rate must be positive.`);
};

const validateOperationGrades = (
  equipment: AuthoredEquipment,
  path: string,
  issues: AuthoringIssue[]
): void => {
  equipment.grades.forEach((grade, index) => {
    if (grade.behavior.kind !== "electrolyzer" && grade.behavior.kind !== "vessel") return;
    if (!Number.isFinite(grade.behavior.processRate) || grade.behavior.processRate <= 0)
      push(issues, `${path}.${index}.behavior.processRate`, "Process rate must be positive.");
    if (!Number.isFinite(grade.behavior.powerDraw) || grade.behavior.powerDraw < 0)
      push(issues, `${path}.${index}.behavior.powerDraw`, "Power draw must be nonnegative.");
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
