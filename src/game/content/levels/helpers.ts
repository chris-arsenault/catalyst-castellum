import type {
  FacilityLoadout,
  GasConduitLoadout,
  LiquidConduitLoadout,
} from "../../definitionTypes";
import type { GasAmounts, LiquidAmounts, ScenarioAvailability } from "../../types";

export const availability = (options: Partial<ScenarioAvailability>): ScenarioAvailability => ({
  equipment: options.equipment ?? [],
  gasLines: options.gasLines ?? [],
  liquidLines: options.liquidLines ?? [],
});

export const emptyLoadout = (): FacilityLoadout => ({
  equipment: {},
  initialTemperatures: {},
  gasConduits: {},
  liquidConduits: {},
  stationary: {},
});

export const gasRun = (
  enabled = false,
  gas: Partial<GasAmounts> | null = null
): GasConduitLoadout => ({ enabled, gas });

export const liquidRun = (
  enabled = false,
  liquid: Partial<LiquidAmounts> | null = null
): LiquidConduitLoadout => ({ enabled, liquid });
