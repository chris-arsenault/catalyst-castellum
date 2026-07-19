import type { ReactionDefinition } from "../game/types";
import type { Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

const concise = (value: number): string => String(Number(value.toFixed(2)));

const standardMechanics = (
  translator: Translator,
  reaction: ReactionDefinition
): string[] | null => {
  const behavior = reaction.behavior;
  if (behavior.kind === "electrolysis")
    return [
      translator.text("manual.mechanics.electrolysis.rate"),
      translator.text("manual.mechanics.electrolysis.heat", {
        heat: concise(behavior.roomHeatPerExtent),
      }),
      translator.text("manual.mechanics.electrolysis.limits"),
    ];
  if (behavior.kind === "flash")
    return [
      translator.text("manual.mechanics.flash.ignition", {
        hydrogen: concise(behavior.minimumHydrogenFraction * 100),
        oxygen: concise(behavior.minimumOxygenFraction * 100),
      }),
      translator.text("manual.mechanics.flash.extent", {
        extent: concise(behavior.maximumExtent),
        cooldown: concise(behavior.cooldownSeconds),
      }),
      translator.text("manual.mechanics.flash.pressure", {
        base: concise(behavior.pressurePulseBase),
        gain: concise(behavior.pressurePulsePerExtent),
      }),
    ];
  if (behavior.kind === "gas_recombination")
    return [
      translator.text("manual.mechanics.recombination.activation", {
        start: concise(behavior.activationTemperature),
        full: concise(behavior.activationTemperature + behavior.activationRange),
      }),
      translator.text("manual.mechanics.recombination.rate", {
        rate: concise(behavior.maximumRate),
      }),
      translator.text("manual.mechanics.recombination.heat", {
        heat: concise(behavior.gasHeatPerExtent),
      }),
    ];
  return null;
};

const contactMechanics = (
  translator: Translator,
  reaction: ReactionDefinition
): string[] | null => {
  const behavior = reaction.behavior;
  if (behavior.kind === "absorption")
    return [
      translator.text("manual.mechanics.absorption.rate", {
        rate: concise(behavior.maximumRate),
      }),
      translator.text("manual.mechanics.absorption.solvent", {
        amount: concise(behavior.solventInventoryScale),
      }),
      translator.text("manual.mechanics.absorption.ceiling", {
        percent: concise(behavior.maximumProductFraction * 100),
      }),
    ];
  if (behavior.kind === "mixed_contact")
    return [
      translator.text("manual.mechanics.contact.rate", {
        rate: concise(behavior.maximumRate),
      }),
      translator.text("manual.mechanics.contact.mixing", {
        amount: concise(behavior.mixingInventoryScale),
      }),
      translator.text("manual.mechanics.contact.heat", {
        heat: concise(behavior.roomHeatPerExtent),
      }),
    ];
  return null;
};

const massActionMechanics = (
  translator: Translator,
  reaction: ReactionDefinition
): string[] | null => {
  const behavior = reaction.behavior;
  if (behavior.kind !== "mass_action") return null;
  const catalyst = behavior.catalyst
    ? translator.text("manual.mechanics.massAction.catalyst", {
        catalyst: translator.text(
          `entities.species.${behavior.catalyst.species}.name` as LocaleKey
        ),
      })
    : translator.text("manual.mechanics.massAction.orders");
  return [
    translator.text("manual.mechanics.massAction.rate", {
      rate: concise(behavior.maximumRate),
    }),
    translator.text("manual.mechanics.massAction.temperature", {
      start: concise(behavior.forward.activationTemperature),
      full: concise(behavior.forward.fullActivationTemperature),
    }),
    catalyst,
  ];
};

export const createReactionMechanics =
  (translator: Translator) =>
  (reaction: ReactionDefinition): string[] =>
    standardMechanics(translator, reaction) ??
    contactMechanics(translator, reaction) ??
    massActionMechanics(translator, reaction) ??
    [];
