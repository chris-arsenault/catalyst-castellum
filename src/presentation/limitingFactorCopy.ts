import { SPECIES_DEFINITIONS } from "./defaultGame";
import type { LimitConditionCode, LimitingFactor } from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

const CONDITION_KEYS = Object.fromEntries(
  [
    "conditions",
    "offline",
    "activation_temperature",
    "aqueous_solvent",
    "product_concentration",
    "liquid_headroom",
    "liquid_mixing",
    "gas_headroom",
    "anode_headroom",
    "cathode_headroom",
    "outlet_headroom",
    "cell_current",
    "ignition_hydrogen",
    "ignition_oxygen",
    "gas_agitation",
    "combustible_batch",
    "cooldown",
  ].map((code) => [code, `presentation.limit.${code}`])
) as Record<LimitConditionCode, LocaleKey>;

export const createLimitingFactorCopy =
  (translator: Translator) =>
  (factor: LimitingFactor): string => {
    if (factor.kind === "legacy") return factor.label;
    const label =
      factor.kind === "species"
        ? SPECIES_DEFINITIONS[factor.speciesId].formula
        : translator.text(CONDITION_KEYS[factor.code]);
    if (factor.zone === null) return label;
    return translator.text("presentation.limit.zone", { zone: factor.zone, factor: label });
  };

export const limitingFactorCopy = createLimitingFactorCopy(DEFAULT_TRANSLATOR);
