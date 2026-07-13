import {
  TRANSPORT_RUN_IDS,
  type FacilityCellDefinition,
  type FacilityMapDefinition,
  type FacilityPortalDefinition,
  type FacilityPortalState,
  type FacilityRing,
  type FacilityTerrainKind,
  type FacilityUtilityNodeId,
  type GridCell,
  type RoomGeometryDefinition,
  type RoomId,
  type TransportPhase,
  type TransportRunId,
  type WorldPoint,
} from "../types";
import { FACILITY_MAP, cell, cellKey, orthogonalGridPath } from "./facilityLayout";

export { FACILITY_MAP, cell, cellKey, orthogonalGridPath } from "./facilityLayout";

export const WORLD_WIDTH = FACILITY_MAP.width;
export const WORLD_MAX_ELEVATION = FACILITY_MAP.height;

const roomForBoundsCell = (gridCell: GridCell): RoomId | null => {
  for (const [roomId, room] of Object.entries(FACILITY_MAP.rooms) as [
    RoomId,
    FacilityMapDefinition["rooms"][RoomId],
  ][]) {
    const { bounds } = room;
    if (
      gridCell.column >= bounds.column &&
      gridCell.column < bounds.column + bounds.width &&
      gridCell.elevation >= bounds.elevation &&
      gridCell.elevation < bounds.elevation + bounds.height
    ) {
      return roomId;
    }
  }
  return null;
};

const platformKeys = new Set(
  Object.values(FACILITY_MAP.rooms).flatMap((room) => room.platformCells.map(cellKey))
);
const ladderKeys = new Set(
  Object.values(FACILITY_MAP.rooms).flatMap((room) => room.ladderCells.map(cellKey))
);
const portalByConnectorKey = new Map(
  FACILITY_MAP.portals.flatMap((definition) =>
    definition.connectorCells.map((connector) => [cellKey(connector), definition] as const)
  )
);
const coreBounds = FACILITY_MAP.rooms.core.bounds;
const coreShellKeys = new Set<string>();
for (
  let column = coreBounds.column - 1;
  column <= coreBounds.column + coreBounds.width;
  column += 1
) {
  coreShellKeys.add(cellKey(cell(column, coreBounds.elevation - 1)));
  coreShellKeys.add(cellKey(cell(column, coreBounds.elevation + coreBounds.height)));
}
for (
  let elevation = coreBounds.elevation;
  elevation < coreBounds.elevation + coreBounds.height;
  elevation += 1
) {
  coreShellKeys.add(cellKey(cell(coreBounds.column - 1, elevation)));
  coreShellKeys.add(cellKey(cell(coreBounds.column + coreBounds.width, elevation)));
}

export const portalDefinition = (portalId: string): FacilityPortalDefinition => {
  const definition = FACILITY_MAP.portals.find((candidate) => candidate.id === portalId);
  if (!definition) throw new Error(`Unknown facility portal: ${portalId}`);
  return definition;
};

export const initialPortalStates = (): Record<string, FacilityPortalState> =>
  Object.fromEntries(
    FACILITY_MAP.portals.map((definition) => [
      definition.id,
      {
        open: definition.defaultOpen,
        sealed: definition.defaultSealed,
        lastGasFlow: 0,
        lastLiquidFlow: 0,
      },
    ])
  );

export const inFacilityBounds = ({ column, elevation }: GridCell): boolean =>
  column >= 0 && column < FACILITY_MAP.width && elevation >= 0 && elevation < FACILITY_MAP.height;

const portalTerrain = (definition: FacilityPortalDefinition): FacilityTerrainKind => {
  if (definition.kind === "ladder_shaft") return "ladder";
  if (definition.kind === "door" || definition.kind === "core_door") return "door";
  if (definition.kind === "trapdoor") return "trapdoor";
  return "passage";
};

const cellDefinitionCache = new Map<string, FacilityCellDefinition>();

export const facilityCellDefinition = (gridCell: GridCell): FacilityCellDefinition => {
  if (!inFacilityBounds(gridCell)) {
    return { cell: gridCell, terrain: "solid", roomId: null, portalId: null };
  }
  const key = cellKey(gridCell);
  const cached = cellDefinitionCache.get(key);
  if (cached) return cached;
  const connector = portalByConnectorKey.get(key);
  if (connector) {
    const definition: FacilityCellDefinition = {
      cell: gridCell,
      terrain: portalTerrain(connector),
      roomId: connector.hostRoomId,
      portalId: connector.id,
    };
    cellDefinitionCache.set(key, definition);
    return definition;
  }
  const roomId = roomForBoundsCell(gridCell);
  let definition: FacilityCellDefinition;
  if (coreShellKeys.has(key)) {
    definition = { cell: gridCell, terrain: "core_shell", roomId: null, portalId: null };
  } else if (platformKeys.has(key)) {
    definition = { cell: gridCell, terrain: "platform", roomId, portalId: null };
  } else if (ladderKeys.has(key)) {
    definition = { cell: gridCell, terrain: "ladder", roomId, portalId: null };
  } else if (roomId) {
    definition = { cell: gridCell, terrain: "room", roomId, portalId: null };
  } else {
    definition = { cell: gridCell, terrain: "solid", roomId: null, portalId: null };
  }
  cellDefinitionCache.set(key, definition);
  return definition;
};

const facilityCellCache: FacilityCellDefinition[] = Array.from(
  { length: FACILITY_MAP.height },
  (_, elevation) =>
    Array.from({ length: FACILITY_MAP.width }, (__, column) =>
      facilityCellDefinition(cell(column, elevation))
    )
).flat();

export const facilityCells = (): readonly FacilityCellDefinition[] => facilityCellCache;

export const facilityCellIsTraversable = (
  gridCell: GridCell,
  portalStates?: Readonly<Record<string, FacilityPortalState>>
): boolean => {
  const definition = facilityCellDefinition(gridCell);
  if (
    definition.terrain === "solid" ||
    definition.terrain === "platform" ||
    definition.terrain === "core_shell"
  )
    return false;
  if (!definition.portalId || !portalStates) return true;
  return (
    portalStates[definition.portalId]?.open ?? portalDefinition(definition.portalId).defaultOpen
  );
};

export const facilityCellHasSupport = (
  gridCell: GridCell,
  portalStates?: Readonly<Record<string, FacilityPortalState>>
): boolean => {
  const below = cell(gridCell.column, gridCell.elevation - 1);
  const definition = facilityCellDefinition(below);
  if (
    definition.terrain === "solid" ||
    definition.terrain === "platform" ||
    definition.terrain === "core_shell"
  )
    return true;
  if (definition.terrain === "trapdoor" && definition.portalId) {
    return !(portalStates?.[definition.portalId]?.open ?? true);
  }
  return false;
};

const roomAtmosphericCellCache = new Map<RoomId, readonly GridCell[]>();

export const roomAtmosphericCells = (roomId: RoomId): readonly GridCell[] => {
  const cached = roomAtmosphericCellCache.get(roomId);
  if (cached) return cached;
  const cells = facilityCellCache
    .filter(
      (definition) =>
        definition.roomId === roomId &&
        definition.terrain !== "platform" &&
        definition.terrain !== "core_shell"
    )
    .map((definition) => definition.cell);
  roomAtmosphericCellCache.set(roomId, cells);
  return cells;
};

/** Compatibility view for finite-volume physics and inspector readouts. */
export const ROOM_GEOMETRY: Record<RoomId, RoomGeometryDefinition> = Object.fromEntries(
  Object.entries(FACILITY_MAP.rooms).map(([roomId, room]) => [
    roomId,
    {
      x: room.bounds.column,
      floorElevation: room.bounds.elevation,
      width: room.bounds.width,
      height: room.bounds.height,
    },
  ])
) as Record<RoomId, RoomGeometryDefinition>;

export const gridCellToWorldPoint = ({ column, elevation }: GridCell): WorldPoint => ({
  x: column + 0.5,
  elevation: elevation + 0.5,
});

export const worldPointToGridCell = ({ x, elevation }: WorldPoint): GridCell => ({
  column: Math.floor(x),
  elevation: Math.floor(elevation),
});

export const gridPathToWorldPath = (path: readonly GridCell[]): WorldPoint[] =>
  path.map(gridCellToWorldPoint);

export const gridCellsToWorldPath = gridPathToWorldPath;

export const roomCenterWorld = (roomId: RoomId): WorldPoint => {
  const bounds = FACILITY_MAP.rooms[roomId].bounds;
  return {
    x: bounds.column + bounds.width / 2,
    elevation: bounds.elevation + bounds.height / 2,
  };
};

export const roomContainsWorldPoint = (roomId: RoomId, point: WorldPoint): boolean =>
  facilityCellDefinition(worldPointToGridCell(point)).roomId === roomId;

export const roomAtWorldPoint = (point: WorldPoint): RoomId | null =>
  facilityCellDefinition(worldPointToGridCell(point)).roomId;

export const facilityRingForRoom = (roomId: RoomId): FacilityRing => {
  if (roomId === "core") return "core";
  const center = roomCenterWorld(roomId);
  const distance = Math.hypot(
    center.x - FACILITY_MAP.coreAnchor.column,
    center.elevation - FACILITY_MAP.coreAnchor.elevation
  );
  if (distance <= FACILITY_MAP.ringRadii.inner) return "inner";
  if (distance <= FACILITY_MAP.ringRadii.middle) return "middle";
  return "outer";
};

export const roomRing = facilityRingForRoom;

const STANDARD_ROOM_CELL_AREA = 14 * 8;
const STANDARD_ROOM_VOLUME = 100;
export const ROOM_VOLUME_PER_CELL = STANDARD_ROOM_VOLUME / STANDARD_ROOM_CELL_AREA;

export const roomVolume = (roomId: RoomId): number =>
  roomAtmosphericCells(roomId).length * ROOM_VOLUME_PER_CELL;

/** Height of a liquid inventory filled upward through the room's actual atmospheric cells. */
export const roomLiquidSurfaceElevation = (roomId: RoomId, liquidVolume: number): number => {
  const rows = new Map<number, number>();
  for (const atmosphericCell of roomAtmosphericCells(roomId)) {
    rows.set(atmosphericCell.elevation, (rows.get(atmosphericCell.elevation) ?? 0) + 1);
  }
  const elevations = [...rows.keys()].sort((left, right) => left - right);
  const floor = elevations[0] ?? FACILITY_MAP.rooms[roomId].bounds.elevation;
  let remaining = Math.max(0, liquidVolume);
  for (const elevation of elevations) {
    const rowCapacity = (rows.get(elevation) ?? 0) * ROOM_VOLUME_PER_CELL;
    if (remaining <= rowCapacity) {
      return elevation + (rowCapacity > 0 ? remaining / rowCapacity : 0);
    }
    remaining -= rowCapacity;
  }
  return (elevations.at(-1) ?? floor) + 1;
};

export const roomPortHeight = (roomId: RoomId, elevation: number): number => {
  const bounds = FACILITY_MAP.rooms[roomId].bounds;
  return Math.max(0, Math.min(1, (elevation - bounds.elevation) / bounds.height));
};

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
