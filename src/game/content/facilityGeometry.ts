import type { FacilityUtilityNodeId, WorldPoint } from "../types";
import {
  createFacilityModel,
  gridCellToWorldPoint,
  gridPathToWorldPath,
  ROOM_VOLUME_PER_CELL,
  worldPointToGridCell,
} from "../engine/facilityModel";
import { instance } from "../world/instances";
import { WORLD_MAP } from "./worldMap";

export { cell, cellKey, orthogonalGridPath } from "../spatial";

/** @deprecated Module-constant world geometry; UI moves to the runtime Map (plan M2). */
export const FACILITY_MAP = WORLD_MAP;

export const WORLD_WIDTH = WORLD_MAP.width;
export const WORLD_MAX_ELEVATION = WORLD_MAP.height;

export const DEFAULT_FACILITY_MODEL = createFacilityModel(WORLD_MAP);
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

export const utilityNodeWorldPoint = (nodeId: FacilityUtilityNodeId): WorldPoint =>
  gridCellToWorldPoint(instance(WORLD_MAP.utilityNodes, nodeId, "utility node").cell);
