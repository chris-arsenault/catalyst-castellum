import type {
  FacilityCellDefinition,
  FacilityMapDefinition,
  FacilityPortalDefinition,
  FacilityPortalState,
  FacilityRing,
  FacilityTerrainKind,
  GridCell,
  RoomGeometryDefinition,
  RoomId,
  WorldPoint,
} from "../types";
import type { FacilityModel } from "../definitionTypes";
import { cell, cellKey, worldPointToGridCell } from "../spatial";
import { instance } from "../world/instances";

const STANDARD_ROOM_CELL_AREA = 14 * 8;
const STANDARD_ROOM_VOLUME = 100;
export const ROOM_VOLUME_PER_CELL = STANDARD_ROOM_VOLUME / STANDARD_ROOM_CELL_AREA;

export type { FacilityModel } from "../definitionTypes";
export { gridCellToWorldPoint, gridPathToWorldPath, worldPointToGridCell } from "../spatial";

const portalTerrain = (definition: FacilityPortalDefinition): FacilityTerrainKind => {
  if (definition.kind === "ladder_shaft") return "ladder";
  if (definition.kind === "door" || definition.kind === "core_door") return "door";
  if (definition.kind === "trapdoor") return "trapdoor";
  return "passage";
};

// The factory deliberately encloses all caches so two definitions never share derived topology.
// eslint-disable-next-line max-lines-per-function
export const createFacilityModel = (map: FacilityMapDefinition): FacilityModel => {
  const roomForBoundsCell = (gridCell: GridCell): RoomId | null => {
    for (const [roomId, room] of Object.entries(map.rooms) as [
      RoomId,
      FacilityMapDefinition["rooms"][RoomId],
    ][]) {
      const { bounds } = room;
      if (
        gridCell.column >= bounds.column &&
        gridCell.column < bounds.column + bounds.width &&
        gridCell.elevation >= bounds.elevation &&
        gridCell.elevation < bounds.elevation + bounds.height
      )
        return roomId;
    }
    return null;
  };

  const platformKeys = new Set(
    Object.values(map.rooms).flatMap((room) => room.platformCells.map(cellKey))
  );
  const ladderKeys = new Set(
    Object.values(map.rooms).flatMap((room) => room.ladderCells.map(cellKey))
  );
  const portalByConnectorKey = new Map(
    map.portals.flatMap((definition) =>
      definition.connectorCells.map((connector) => [cellKey(connector), definition] as const)
    )
  );
  const coreBounds = instance(map.rooms, "core", "map room").bounds;
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

  const portalDefinition = (portalId: string): FacilityPortalDefinition => {
    const definition = map.portals.find((candidate) => candidate.id === portalId);
    if (!definition) throw new Error(`Unknown facility portal: ${portalId}`);
    return definition;
  };
  const initialPortalStates = (): Record<string, FacilityPortalState> =>
    Object.fromEntries(
      map.portals.map((definition) => [
        definition.id,
        {
          open: definition.defaultOpen,
          sealed: definition.defaultSealed,
          lastGasFlow: 0,
          lastLiquidFlow: 0,
        },
      ])
    );
  const inBounds = ({ column, elevation }: GridCell): boolean =>
    column >= 0 && column < map.width && elevation >= 0 && elevation < map.height;
  const cellDefinitionCache = new Map<string, FacilityCellDefinition>();
  const cellDefinition = (gridCell: GridCell): FacilityCellDefinition => {
    if (!inBounds(gridCell))
      return { cell: gridCell, terrain: "solid", roomId: null, portalId: null };
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
    if (coreShellKeys.has(key))
      definition = { cell: gridCell, terrain: "core_shell", roomId: null, portalId: null };
    else if (platformKeys.has(key))
      definition = { cell: gridCell, terrain: "platform", roomId, portalId: null };
    else if (ladderKeys.has(key))
      definition = { cell: gridCell, terrain: "ladder", roomId, portalId: null };
    else if (roomId) definition = { cell: gridCell, terrain: "room", roomId, portalId: null };
    else definition = { cell: gridCell, terrain: "solid", roomId: null, portalId: null };
    cellDefinitionCache.set(key, definition);
    return definition;
  };
  const facilityCells = Array.from({ length: map.height }, (_, elevation) =>
    Array.from({ length: map.width }, (__, column) => cellDefinition(cell(column, elevation)))
  ).flat();
  const cells = (): readonly FacilityCellDefinition[] => facilityCells;
  const cellIsTraversable = (
    gridCell: GridCell,
    portalStates?: Readonly<Record<string, FacilityPortalState>>
  ): boolean => {
    const definition = cellDefinition(gridCell);
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
  const cellHasSupport = (
    gridCell: GridCell,
    portalStates?: Readonly<Record<string, FacilityPortalState>>
  ): boolean => {
    const definition = cellDefinition(cell(gridCell.column, gridCell.elevation - 1));
    if (
      definition.terrain === "solid" ||
      definition.terrain === "platform" ||
      definition.terrain === "core_shell"
    )
      return true;
    if (definition.terrain === "trapdoor" && definition.portalId)
      return !(portalStates?.[definition.portalId]?.open ?? true);
    return false;
  };
  const roomAtmosphericCellCache = new Map<RoomId, readonly GridCell[]>();
  const roomAtmosphericCells = (roomId: RoomId): readonly GridCell[] => {
    const cached = roomAtmosphericCellCache.get(roomId);
    if (cached) return cached;
    const atmosphericCells = facilityCells
      .filter(
        (definition) =>
          definition.roomId === roomId &&
          definition.terrain !== "platform" &&
          definition.terrain !== "core_shell"
      )
      .map((definition) => definition.cell);
    roomAtmosphericCellCache.set(roomId, atmosphericCells);
    return atmosphericCells;
  };
  const roomGeometry = Object.fromEntries(
    Object.entries(map.rooms).map(([roomId, room]) => [
      roomId,
      {
        x: room.bounds.column,
        floorElevation: room.bounds.elevation,
        width: room.bounds.width,
        height: room.bounds.height,
      },
    ])
  ) as Record<RoomId, RoomGeometryDefinition>;
  const roomCenterWorld = (roomId: RoomId): WorldPoint => {
    const bounds = instance(map.rooms, roomId, "map room").bounds;
    return {
      x: bounds.column + bounds.width / 2,
      elevation: bounds.elevation + bounds.height / 2,
    };
  };
  const roomContainsWorldPoint = (roomId: RoomId, point: WorldPoint): boolean =>
    cellDefinition(worldPointToGridCell(point)).roomId === roomId;
  const roomAtWorldPoint = (point: WorldPoint): RoomId | null =>
    cellDefinition(worldPointToGridCell(point)).roomId;
  const ringForRoom = (roomId: RoomId): FacilityRing => {
    if (roomId === "core") return "core";
    const center = roomCenterWorld(roomId);
    const distance = Math.hypot(
      center.x - map.coreAnchor.column,
      center.elevation - map.coreAnchor.elevation
    );
    if (distance <= map.ringRadii.inner) return "inner";
    if (distance <= map.ringRadii.middle) return "middle";
    return "outer";
  };
  const roomVolume = (roomId: RoomId): number =>
    roomAtmosphericCells(roomId).length * ROOM_VOLUME_PER_CELL;
  const roomLiquidSurfaceElevation = (roomId: RoomId, liquidVolume: number): number => {
    const rows = new Map<number, number>();
    for (const atmosphericCell of roomAtmosphericCells(roomId))
      rows.set(atmosphericCell.elevation, (rows.get(atmosphericCell.elevation) ?? 0) + 1);
    const elevations = [...rows.keys()].sort((left, right) => left - right);
    const floor = elevations[0] ?? instance(map.rooms, roomId, "map room").bounds.elevation;
    let remaining = Math.max(0, liquidVolume);
    for (const elevation of elevations) {
      const rowCapacity = (rows.get(elevation) ?? 0) * ROOM_VOLUME_PER_CELL;
      if (remaining <= rowCapacity)
        return elevation + (rowCapacity > 0 ? remaining / rowCapacity : 0);
      remaining -= rowCapacity;
    }
    return (elevations.at(-1) ?? floor) + 1;
  };
  const roomPortHeight = (roomId: RoomId, elevation: number): number => {
    const bounds = instance(map.rooms, roomId, "map room").bounds;
    return Math.max(0, Math.min(1, (elevation - bounds.elevation) / bounds.height));
  };

  return {
    map,
    roomGeometry,
    portalDefinition,
    initialPortalStates,
    inBounds,
    cellDefinition,
    cells,
    cellIsTraversable,
    cellHasSupport,
    roomAtmosphericCells,
    roomCenterWorld,
    roomContainsWorldPoint,
    roomAtWorldPoint,
    ringForRoom,
    roomVolume,
    roomLiquidSurfaceElevation,
    roomPortHeight,
  };
};
