import type {
  EquipmentDutyDefinition,
  HazardChannels,
  ReactionId,
  ReactionParticipant,
} from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import { REACTION_DEFINITIONS, SPECIES_DEFINITIONS } from "./defaultGame";
import { reactionCopy, speciesCopy } from "./entityCopy";

const ROLE_KEYS = {
  atmosphere: "presentation.hazardRole.atmosphere",
  corrosion: "presentation.hazardRole.corrosion",
  heat: "presentation.hazardRole.heat",
  pressure: "presentation.hazardRole.pressure",
  radiation: "presentation.hazardRole.radiation",
} as const satisfies Record<keyof HazardChannels, string>;

export interface DutyReactionSummary {
  reactionId: ReactionId;
  name: string;
  equation: string;
  /** Plain feeds → products sentence with the product's combat role. */
  effect: string;
}

const participantNames = (
  participants: readonly ReactionParticipant[],
  translator: Translator
): string =>
  participants
    .map((participant) => speciesCopy(SPECIES_DEFINITIONS[participant.species], translator).name)
    .join(" + ");

const productRoles = (reactionId: ReactionId, translator: Translator): string[] => {
  const roles = new Set<string>();
  for (const product of REACTION_DEFINITIONS[reactionId].products) {
    const species = SPECIES_DEFINITIONS[product.species];
    if (species.damageSourceId === null) continue;
    for (const hazard of species.hazards) roles.add(translator.text(ROLE_KEYS[hazard.channel]));
  }
  return [...roles];
};

/** The strongest sustained damage rate any damaging product reaches at saturation. */
const productDamageRating = (reactionId: ReactionId): number => {
  let rating = 0;
  for (const product of REACTION_DEFINITIONS[reactionId].products) {
    const species = SPECIES_DEFINITIONS[product.species];
    if (species.damageSourceId === null) continue;
    for (const hazard of species.hazards) rating = Math.max(rating, hazard.rate);
  }
  return rating;
};

/** One line per duty reaction: what it eats, what it makes, and what the product does to enemies. */
export const dutyReactionSummaries = (
  duty: EquipmentDutyDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): DutyReactionSummary[] =>
  duty.reactionIds.map((reactionId) => {
    const reaction = REACTION_DEFINITIONS[reactionId];
    const consumes = participantNames(reaction.reactants, translator);
    const produces = participantNames(reaction.products, translator);
    const roles = productRoles(reactionId, translator);
    const rating = productDamageRating(reactionId);
    const base =
      roles.length > 0
        ? translator.text("presentation.duty.line", {
            consumes,
            produces,
            role: roles.join(", "),
          })
        : translator.text("presentation.duty.lineNeutral", { consumes, produces });
    const effect =
      rating > 0
        ? `${base} · ${translator.text("presentation.duty.rating", { rate: Math.round(rating) })}`
        : base;
    return {
      reactionId,
      name: reactionCopy(reaction, translator).name,
      equation: reaction.equation,
      effect,
    };
  });

/** The duty's reaction names, joined for compact labels. */
export const dutyTitle = (
  duty: EquipmentDutyDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): string =>
  duty.reactionIds
    .map((reactionId) => reactionCopy(REACTION_DEFINITIONS[reactionId], translator).name)
    .join(" · ");
