import {
  TRANSPORT_RUN_IDS,
  type FacilityUtilityNodeId,
  type GridCell,
  type TransportPhase,
  type TransportRunId,
  type WorldPoint,
} from "../types";
import {
  createFacilityModel,
  gridCellToWorldPoint,
  gridPathToWorldPath,
  ROOM_VOLUME_PER_CELL,
  worldPointToGridCell,
} from "../engine/facilityModel";
import { FACILITY_MAP, cell, orthogonalGridPath } from "./facilityLayout";

export { FACILITY_MAP, cell, cellKey, orthogonalGridPath } from "./facilityLayout";

export const WORLD_WIDTH = FACILITY_MAP.width;
export const WORLD_MAX_ELEVATION = FACILITY_MAP.height;

export const DEFAULT_FACILITY_MODEL = createFacilityModel(FACILITY_MAP);
export const portalDefinition = DEFAULT_FACILITY_MODEL.portalDefinition;
export const initialPortalStates = DEFAULT_FACILITY_MODEL.initialPortalStates;
export const inFacilityBounds = DEFAULT_FACILITY_MODEL.inBounds;
export const facilityCellDefinition = DEFAULT_FACILITY_MODEL.cellDefinition;
export const facilityCells = DEFAULT_FACILITY_MODEL.cells;
export const facilityCellIsTraversable = DEFAULT_FACILITY_MODEL.cellIsTraversable;
export const facilityCellHasSupport = DEFAULT_FACILITY_MODEL.cellHasSupport;
export const roomAtmosphericCells = DEFAULT_FACILITY_MODEL.roomAtmosphericCells;
export const ROOM_GEOMETRY = DEFAULT_FACILITY_MODEL.roomGeometry;
export { gridCellToWorldPoint, gridPathToWorldPath, ROOM_VOLUME_PER_CELL, worldPointToGridCell };
export const gridCellsToWorldPath = gridPathToWorldPath;
export const roomCenterWorld = DEFAULT_FACILITY_MODEL.roomCenterWorld;
export const roomContainsWorldPoint = DEFAULT_FACILITY_MODEL.roomContainsWorldPoint;
export const roomAtWorldPoint = DEFAULT_FACILITY_MODEL.roomAtWorldPoint;
export const facilityRingForRoom = DEFAULT_FACILITY_MODEL.ringForRoom;
export const roomRing = DEFAULT_FACILITY_MODEL.ringForRoom;
export const roomVolume = DEFAULT_FACILITY_MODEL.roomVolume;
export const roomLiquidSurfaceElevation = DEFAULT_FACILITY_MODEL.roomLiquidSurfaceElevation;
export const roomPortHeight = DEFAULT_FACILITY_MODEL.roomPortHeight;

const blueprint = (...waypoints: readonly GridCell[]): readonly GridCell[] =>
  orthogonalGridPath(...waypoints);

const coreCellRoute = blueprint(cell(54, 8), cell(50, 8), cell(50, 16), cell(48, 16));
const cellAbsorberRoute = blueprint(cell(42, 22), cell(52, 22), cell(52, 28), cell(48, 28));
const coreFinalRoute = blueprint(cell(54, 6), cell(50, 6), cell(48, 6));

/** Physical route blueprints. Each run owns at most one conduit of each phase. */
export const CONDUIT_BLUEPRINTS: Record<
  TransportRunId,
  { gas: readonly GridCell[] | null; liquid: readonly GridCell[] | null }
> = {
  core_furnace: {
    gas: blueprint(cell(54, 16), cell(54, 36), cell(18, 36), cell(18, 32)),
    liquid: null,
  },
  core_switchyard: {
    gas: blueprint(cell(54, 16), cell(58, 16), cell(58, 39), cell(4, 39), cell(4, 11), cell(7, 11)),
    liquid: null,
  },
  core_reservoir: {
    gas: blueprint(
      cell(54, 16),
      cell(54, 18),
      cell(57, 18),
      cell(57, 34),
      cell(40, 34),
      cell(40, 32)
    ),
    liquid: null,
  },
  core_gallery: {
    gas: blueprint(cell(54, 16), cell(56, 16), cell(56, 38), cell(28, 38), cell(28, 22)),
    liquid: null,
  },
  cell_furnace: {
    gas: blueprint(cell(46, 18), cell(52, 18), cell(52, 35), cell(18, 35), cell(18, 32)),
    liquid: null,
  },
  core_cell: { gas: [...coreCellRoute].reverse(), liquid: coreCellRoute },
  cell_absorber: { gas: cellAbsorberRoute, liquid: cellAbsorberRoute },
  furnace_return: {
    gas: blueprint(cell(18, 24), cell(18, 12), cell(26, 12), cell(26, 14)),
    liquid: null,
  },
  return_final: {
    gas: blueprint(cell(32, 14), cell(32, 12), cell(40, 12), cell(40, 11)),
    liquid: null,
  },
  return_outer: {
    gas: blueprint(cell(22, 18), cell(2, 18), cell(2, 2), cell(15, 2), cell(15, 4)),
    liquid: null,
  },
  core_final: { gas: [...coreFinalRoute].reverse(), liquid: coreFinalRoute },
  absorber_final: {
    gas: null,
    liquid: blueprint(cell(44, 24), cell(44, 12), cell(44, 11)),
  },
  core_absorber: {
    gas: null,
    liquid: blueprint(cell(44, 24), cell(70, 24), cell(70, 8), cell(68, 8)),
  },
};

export const CONDUIT_ROUTE_BLUEPRINTS = CONDUIT_BLUEPRINTS;

export const conduitBlueprintWorldPath = (
  runId: TransportRunId,
  phase: TransportPhase
): readonly WorldPoint[] => {
  const path = CONDUIT_BLUEPRINTS[runId][phase];
  return path ? gridPathToWorldPath(path) : [];
};

export const conduitBlueprintEndpoint = (
  runId: TransportRunId,
  phase: TransportPhase,
  endpoint: "from" | "to"
): WorldPoint | null => {
  const path = conduitBlueprintWorldPath(runId, phase);
  return (endpoint === "from" ? path[0] : path.at(-1)) ?? null;
};

export const utilityNodeWorldPoint = (nodeId: FacilityUtilityNodeId): WorldPoint =>
  gridCellToWorldPoint(FACILITY_MAP.utilityNodes[nodeId].cell);

// Keep the key list checked at module construction time when content changes.
if (Object.keys(CONDUIT_BLUEPRINTS).length !== TRANSPORT_RUN_IDS.length) {
  throw new Error("Every transport run must own an explicit spatial blueprint entry.");
}
