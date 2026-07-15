import type { GasConduitLoadout, LiquidConduitLoadout } from "../../definitionTypes";
import { EQUIPMENT_IDS, type TransportRunId } from "../../types";
import { TRANSPORT_RUNS } from "../transportRuns";
import { availability, gasRun, liquidRun } from "./helpers";

const RUN_IDS = Object.keys(TRANSPORT_RUNS);
export const ALL_GAS_RUNS = RUN_IDS.filter((runId) => TRANSPORT_RUNS[runId]?.gas != null);
export const ALL_LIQUID_RUNS = RUN_IDS.filter((runId) => TRANSPORT_RUNS[runId]?.liquid != null);
export const ALL_AVAILABILITY = availability({
  equipment: [...EQUIPMENT_IDS],
  gasRuns: ALL_GAS_RUNS,
  liquidRuns: ALL_LIQUID_RUNS,
  gasSources: ["starter_gas_header"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

export const FULL_GAS_LOADOUT = Object.fromEntries(
  ALL_GAS_RUNS.map((runId: TransportRunId) => [runId, gasRun(false)])
) as Partial<Record<TransportRunId, GasConduitLoadout>>;
export const FULL_LIQUID_LOADOUT = Object.fromEntries(
  ALL_LIQUID_RUNS.map((runId: TransportRunId) => [runId, liquidRun(false)])
) as Partial<Record<TransportRunId, LiquidConduitLoadout>>;
