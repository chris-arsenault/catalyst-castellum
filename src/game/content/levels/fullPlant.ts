import type { GasConduitLoadout, LiquidConduitLoadout } from "../../definitionTypes";
import { EQUIPMENT_IDS, type ConnectionId, type ProcessFamilyId } from "../../types";
import type { ScenarioAvailability } from "../../gameStateTypes";
import { paletteEquipment } from "../palette";
import { WORLD_LINE_BLUEPRINTS } from "../worldMap";
import { availability, gasRun, liquidRun } from "./helpers";

const LINES = Object.values(WORLD_LINE_BLUEPRINTS);
export const ALL_GAS_RUNS = LINES.filter(({ kind }) => kind === "gas_line").map(({ id }) => id);
export const ALL_LIQUID_RUNS = LINES.filter(({ kind }) => kind === "liquid_line").map(
  ({ id }) => id
);
export const ALL_AVAILABILITY = availability({
  equipment: [...EQUIPMENT_IDS],
  gasLines: ALL_GAS_RUNS,
  liquidLines: ALL_LIQUID_RUNS,
});

/** Availability derived from a site's chemistry palette (ADR-0008). */
export const paletteAvailability = (palette: readonly ProcessFamilyId[]): ScenarioAvailability =>
  availability({
    equipment: paletteEquipment(palette),
    gasLines: ALL_GAS_RUNS,
    liquidLines: ALL_LIQUID_RUNS,
  });

/** Every mechanism established by the end of Act I; later specialist cells stay campaign-gated. */
export const ACT_I_AVAILABILITY = availability({
  equipment: ["gas_agitator", "wet_contactor", "thermal_coil", "membrane_cell"],
  gasLines: ALL_GAS_RUNS,
  liquidLines: ALL_LIQUID_RUNS,
});

/** Kettleblack introduces the packed bed; the catalytic vessels stay campaign-gated. */
export const KETTLEBLACK_AVAILABILITY = availability({
  equipment: ["gas_agitator", "wet_contactor", "thermal_coil", "membrane_cell", "packed_bed"],
  gasLines: ALL_GAS_RUNS,
  liquidLines: ALL_LIQUID_RUNS,
});

/** Cordon 41 and Junction L-6 open the full catalytic vessel roster. */
export const CATALYTIC_AVAILABILITY = availability({
  equipment: [
    "gas_agitator",
    "wet_contactor",
    "thermal_coil",
    "membrane_cell",
    "packed_bed",
    "catalytic_reactor",
    "catalytic_burner",
    "absorber_column",
  ],
  gasLines: ALL_GAS_RUNS,
  liquidLines: ALL_LIQUID_RUNS,
});

/** Pell Cut adds the specialist fluorine cell after every ordinary process control is established. */
export const ACT_II_AVAILABILITY = availability({
  equipment: [
    "gas_agitator",
    "wet_contactor",
    "thermal_coil",
    "membrane_cell",
    "packed_bed",
    "catalytic_reactor",
    "catalytic_burner",
    "absorber_column",
    "fluorine_cell",
  ],
  gasLines: ALL_GAS_RUNS,
  liquidLines: ALL_LIQUID_RUNS,
});

export const FULL_GAS_LOADOUT = Object.fromEntries(
  ALL_GAS_RUNS.map((runId: ConnectionId) => [runId, gasRun(false)])
) as Partial<Record<ConnectionId, GasConduitLoadout>>;
export const FULL_LIQUID_LOADOUT = Object.fromEntries(
  ALL_LIQUID_RUNS.map((runId: ConnectionId) => [runId, liquidRun(false)])
) as Partial<Record<ConnectionId, LiquidConduitLoadout>>;
