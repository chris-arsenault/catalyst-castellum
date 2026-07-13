import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import type { GasZone, LimitingFactor, ReactionDefinition, SpeciesId } from "../types";

export interface MutableReactionInventory {
  amount(speciesId: SpeciesId): number;
  change(speciesId: SpeciesId, delta: number): void;
}

export type ReactionLimitCandidate = [factor: LimitingFactor, extent: number];

export const reactionReactantCandidates = (
  reaction: ReactionDefinition,
  inventory: MutableReactionInventory,
  _definition: GameDefinition = DEFAULT_GAME_DEFINITION,
  zone: GasZone | null = null
): ReactionLimitCandidate[] =>
  reaction.reactants.map((participant) => [
    { kind: "species", speciesId: participant.species, zone },
    inventory.amount(participant.species) / participant.coefficient,
  ]);

export const maximumReactionExtent = (
  reaction: ReactionDefinition,
  inventory: MutableReactionInventory,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number =>
  Math.max(
    0,
    Math.min(
      ...reactionReactantCandidates(reaction, inventory, definition).map(([, extent]) => extent)
    )
  );

export const applyReactionExtent = (
  reaction: ReactionDefinition,
  inventory: MutableReactionInventory,
  extent: number,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): void => {
  if (!Number.isFinite(extent) || extent < 0)
    throw new Error(`Invalid extent for ${reaction.id}: ${extent}`);
  const maximum = maximumReactionExtent(reaction, inventory, definition);
  if (extent > maximum + 1e-9)
    throw new Error(`Reaction ${reaction.id} exceeds available reactants (${extent} > ${maximum})`);
  for (const participant of reaction.reactants) {
    inventory.change(participant.species, -extent * participant.coefficient);
  }
  for (const participant of reaction.products) {
    inventory.change(participant.species, extent * participant.coefficient);
  }
};
