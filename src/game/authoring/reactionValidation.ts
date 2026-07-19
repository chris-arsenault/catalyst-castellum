import type { GamePackSource } from "../definitionTypes";
import type { MassActionDirectionDefinition, SpeciesId } from "../types";
import type { EnemyAuthoringIssue } from "./enemyValidation";

type AuthoringIssue = EnemyAuthoringIssue;

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

const validateMassActionDirection = (
  direction: MassActionDirectionDefinition,
  participants: ReactionParticipants,
  path: string,
  issues: AuthoringIssue[]
): void => {
  const participantIds = new Set(participants.map(({ species }) => species));
  if (direction.rateConstant < 0)
    push(issues, `${path}.rateConstant`, "Rate constant must be nonnegative.");
  if (direction.fullActivationTemperature < direction.activationTemperature)
    push(issues, path, "Full activation temperature must follow activation temperature.");
  if (
    direction.deactivationTemperature !== undefined &&
    (direction.inactiveTemperature === undefined ||
      direction.inactiveTemperature <= direction.deactivationTemperature)
  )
    push(issues, path, "A deactivation range requires a later inactive temperature.");
  for (const order of direction.rateOrders) {
    if (!participantIds.has(order.species))
      push(issues, `${path}.rateOrders`, `Rate-order species ${order.species} is not consumed.`);
    if (order.order <= 0) push(issues, `${path}.rateOrders`, "Reaction orders must be positive.");
  }
};

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

type AuthoredReaction = GamePackSource["reactions"][keyof GamePackSource["reactions"]];

const validateMassActionBehavior = (
  source: GamePackSource,
  reaction: AuthoredReaction,
  behaviorPath: string,
  issues: AuthoringIssue[]
): void => {
  if (reaction.behavior.kind !== "mass_action") return;
  if (reaction.behavior.maximumRate <= 0)
    push(issues, `${behaviorPath}.maximumRate`, "Maximum rate must be positive.");
  if (reaction.behavior.halfSaturation <= 0)
    push(issues, `${behaviorPath}.halfSaturation`, "Half-saturation must be positive.");
  validateMassActionDirection(
    reaction.behavior.forward,
    reaction.reactants,
    `${behaviorPath}.forward`,
    issues
  );
  if (reaction.behavior.reverse)
    validateMassActionDirection(
      reaction.behavior.reverse,
      reaction.products,
      `${behaviorPath}.reverse`,
      issues
    );
  const catalyst = reaction.behavior.catalyst;
  if (catalyst && source.species[catalyst.species]?.phase !== "stationary")
    push(issues, `${behaviorPath}.catalyst`, "Catalyst inventory must be stationary.");
};

export const validateReactions = (source: GamePackSource, issues: AuthoringIssue[]): void => {
  for (const [reactionId, reaction] of Object.entries(source.reactions)) {
    validateIdentity(issues, `reactions.${reactionId}.id`, reactionId, reaction.id);
    validateReactionSide(source, reaction.reactants, `reactions.${reactionId}.reactants`, issues);
    validateReactionSide(source, reaction.products, `reactions.${reactionId}.products`, issues);
    validateReactionBalance(source, reaction, `reactions.${reactionId}`, issues);
    validateMassActionBehavior(source, reaction, `reactions.${reactionId}.behavior`, issues);
  }
};
