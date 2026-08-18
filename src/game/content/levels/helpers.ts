import type {
  FacilityLoadout,
  GasConduitLoadout,
  LiquidConduitLoadout,
  RouteIngressDefinition,
} from "../../definitionTypes";
import type { GasAmounts, LiquidAmounts, ScenarioAvailability } from "../../types";

export const availability = (options: Partial<ScenarioAvailability>): ScenarioAvailability => ({
  towers: options.towers ?? [],
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

export const DEFAULT_ROUTE_INGRESSES: readonly RouteIngressDefinition[] = [
  {
    id: "entry_to_core",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
];

export const gasRun = (
  enabled = false,
  gas: Partial<GasAmounts> | null = null
): GasConduitLoadout => ({ enabled, gas });

export const liquidRun = (
  enabled = false,
  liquid: Partial<LiquidAmounts> | null = null
): LiquidConduitLoadout => ({ enabled, liquid });
