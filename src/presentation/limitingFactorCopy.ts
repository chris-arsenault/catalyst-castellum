import { SPECIES_DEFINITIONS } from "./defaultGame";
import type { LimitConditionCode, LimitingFactor } from "../game/types";

const CONDITION_COPY: Record<LimitConditionCode, string> = {
  conditions: "conditions",
  offline: "cell offline",
  activation_temperature: "activation temperature",
  aqueous_solvent: "aqueous solvent",
  product_concentration: "product concentration",
  liquid_headroom: "liquid headroom",
  liquid_mixing: "liquid mixing",
  gas_headroom: "gas headroom",
  anode_headroom: "Cl₂ anode headroom",
  cathode_headroom: "H₂ cathode headroom",
  outlet_headroom: "NaOH outlet headroom",
  cell_current: "cell current",
  ignition_hydrogen: "H₂ ignition concentration",
  ignition_oxygen: "O₂ ignition concentration",
  gas_agitation: "active gas agitation",
  combustible_batch: "combustible batch / gas mixing",
  cooldown: "flash cooldown",
};

export const limitingFactorCopy = (factor: LimitingFactor): string => {
  if (factor.kind === "legacy") return factor.label;
  const label =
    factor.kind === "species"
      ? SPECIES_DEFINITIONS[factor.speciesId].formula
      : CONDITION_COPY[factor.code];
  if (factor.zone === null) return label;
  return `${factor.zone === "lower" ? "lower layer" : "upper layer"}: ${label}`;
};
