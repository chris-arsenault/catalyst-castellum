import type { GasZone, LimitingFactor, ReactionDefinition, SpeciesId } from "../types";

export interface MutableReactionInventory {
  amount(speciesId: SpeciesId): number;
  change(speciesId: SpeciesId, delta: number): void;
}

export type ReactionLimitCandidate = [factor: LimitingFactor, extent: number];

export const reactionReactantCandidates = (
  reaction: ReactionDefinition,
  inventory: MutableReactionInventory,
  zone: GasZone | null = null
): ReactionLimitCandidate[] =>
  reaction.reactants.map((participant) => [
    { kind: "species", speciesId: participant.species, zone },
    inventory.amount(participant.species) / participant.coefficient,
  ]);

export const maximumReactionExtent = (
  reaction: ReactionDefinition,
  inventory: MutableReactionInventory
): number =>
  Math.max(
    0,
    Math.min(...reactionReactantCandidates(reaction, inventory).map(([, extent]) => extent))
  );

export const applyReactionExtent = (
  reaction: ReactionDefinition,
  inventory: MutableReactionInventory,
  extent: number
): void => {
  if (!Number.isFinite(extent) || extent < 0)
    throw new Error(`Invalid extent for ${reaction.id}: ${extent}`);
  const maximum = maximumReactionExtent(reaction, inventory);
  if (extent > maximum + 1e-9)
    throw new Error(`Reaction ${reaction.id} exceeds available reactants (${extent} > ${maximum})`);
  for (const participant of reaction.reactants) {
    inventory.change(participant.species, -extent * participant.coefficient);
  }
  for (const participant of reaction.products) {
    inventory.change(participant.species, extent * participant.coefficient);
  }
};
