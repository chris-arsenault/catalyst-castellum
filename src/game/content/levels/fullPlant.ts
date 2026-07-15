import type { GasConduitLoadout, LiquidConduitLoadout } from "../../definitionTypes";
import { EQUIPMENT_IDS, type ConnectionId } from "../../types";
import { WORLD_MAP } from "../worldMap";
import { isProcessLine } from "../../world/map";
import { availability, gasRun, liquidRun } from "./helpers";

const LINES = Object.values(WORLD_MAP.connections).filter(isProcessLine);
export const ALL_GAS_RUNS = LINES.filter(({ kind }) => kind === "gas_line").map(({ id }) => id);
export const ALL_LIQUID_RUNS = LINES.filter(({ kind }) => kind === "liquid_line").map(
  ({ id }) => id
);
export const ALL_AVAILABILITY = availability({
  equipment: [...EQUIPMENT_IDS],
  gasLines: ALL_GAS_RUNS,
  liquidLines: ALL_LIQUID_RUNS,
  gasSources: ["starter_gas_header"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

export const FULL_GAS_LOADOUT = Object.fromEntries(
  ALL_GAS_RUNS.map((runId: ConnectionId) => [runId, gasRun(false)])
) as Partial<Record<ConnectionId, GasConduitLoadout>>;
export const FULL_LIQUID_LOADOUT = Object.fromEntries(
  ALL_LIQUID_RUNS.map((runId: ConnectionId) => [runId, liquidRun(false)])
) as Partial<Record<ConnectionId, LiquidConduitLoadout>>;
