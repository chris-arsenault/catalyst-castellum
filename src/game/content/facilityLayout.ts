import type { FacilityMapDefinition, FacilityPortalDefinition, GridCell } from "../types";

export const cell = (column: number, elevation: number): GridCell => ({ column, elevation });

export const cellKey = ({ column, elevation }: GridCell): string => `${column}:${elevation}`;

const horizontalCells = (fromColumn: number, toColumn: number, elevation: number): GridCell[] =>
  Array.from({ length: toColumn - fromColumn + 1 }, (_, index) =>
    cell(fromColumn + index, elevation)
  );

const verticalCells = (column: number, fromElevation: number, toElevation: number): GridCell[] =>
  Array.from({ length: toElevation - fromElevation + 1 }, (_, index) =>
    cell(column, fromElevation + index)
  );

/** Expand orthogonal waypoints into the exact grid cells a route occupies. */
export const orthogonalGridPath = (...waypoints: readonly GridCell[]): GridCell[] => {
  const first = waypoints[0];
  if (!first) return [];
  const result: GridCell[] = [{ ...first }];
  let current = { ...first };
  for (const target of waypoints.slice(1)) {
    if (current.column !== target.column && current.elevation !== target.elevation) {
      throw new Error(
        `Facility routes must be orthogonal: ${cellKey(current)} -> ${cellKey(target)}`
      );
    }
    const columnStep = Math.sign(target.column - current.column);
    const elevationStep = Math.sign(target.elevation - current.elevation);
    while (current.column !== target.column || current.elevation !== target.elevation) {
      current = {
        column: current.column + columnStep,
        elevation: current.elevation + elevationStep,
      };
      result.push(current);
    }
  }
  return result;
};

const portal = (
  definition: Omit<FacilityPortalDefinition, "defaultOpen" | "defaultSealed" | "sealGroupId"> &
    Partial<Pick<FacilityPortalDefinition, "defaultOpen" | "defaultSealed" | "sealGroupId">>
): FacilityPortalDefinition => ({
  ...definition,
  defaultOpen: definition.defaultOpen ?? true,
  defaultSealed: definition.defaultSealed ?? false,
  sealGroupId: definition.sealGroupId ?? null,
});

/** Compact, room-dominant side-view platform facility authored in exact grid cells. */
export const FACILITY_MAP: FacilityMapDefinition = {
  width: 76,
  height: 40,
  cellSize: 16,
  coreAnchor: cell(60, 12),
  ringRadii: { inner: 22, middle: 38 },
  entryCell: cell(1, 4),
  coreBreachCell: cell(49, 4),
  rooms: {
    west_intake: {
      bounds: { column: 1, elevation: 4, width: 4, height: 8 },
      socketCells: {},
      platformCells: [],
      ladderCells: [],
    },
    switchyard: {
      bounds: { column: 6, elevation: 4, width: 22, height: 8 },
      socketCells: { socket_a: cell(12, 4), socket_b: cell(22, 4) },
      platformCells: [],
      ladderCells: verticalCells(8, 4, 11),
    },
    furnace: {
      bounds: { column: 6, elevation: 13, width: 15, height: 20 },
      socketCells: { socket_a: cell(12, 13), socket_b: cell(18, 13) },
      platformCells: horizontalCells(9, 20, 23),
      ladderCells: verticalCells(8, 13, 24),
    },
    reservoir: {
      bounds: { column: 22, elevation: 24, width: 27, height: 9 },
      socketCells: { socket_a: cell(32, 24), socket_b: cell(43, 24) },
      platformCells: [],
      ladderCells: [],
    },
    gallery: {
      bounds: { column: 22, elevation: 14, width: 12, height: 9 },
      socketCells: { socket_a: cell(25, 14), socket_b: cell(31, 14) },
      platformCells: [],
      ladderCells: [],
    },
    lower_intake: {
      bounds: { column: 36, elevation: 14, width: 13, height: 9 },
      socketCells: { socket_a: cell(39, 14), socket_b: cell(46, 14) },
      platformCells: [],
      ladderCells: [],
    },
    washlock: {
      bounds: { column: 30, elevation: 4, width: 19, height: 9 },
      socketCells: { socket_a: cell(35, 4), socket_b: cell(45, 4) },
      platformCells: [],
      ladderCells: [],
    },
    core: {
      bounds: { column: 51, elevation: 4, width: 18, height: 16 },
      socketCells: {},
      platformCells: [],
      ladderCells: [],
    },
  },
  portals: [
    portal({
      id: "entry_to_switchyard",
      rooms: ["west_intake", "switchyard"],
      kind: "passage",
      connectorCells: [cell(5, 4)],
      endpoints: [cell(4, 4), cell(6, 4)],
      orientation: "horizontal",
      sillElevation: 4,
      aperture: 1,
      gasConductance: 0.2,
      liquidConductance: 0.2,
      liquidMode: "spill",
      hostRoomId: "west_intake",
      sealGroupId: "outer_entry_seal",
    }),
    portal({
      id: "switchyard_to_furnace_shaft",
      rooms: ["switchyard", "furnace"],
      kind: "ladder_shaft",
      connectorCells: [cell(8, 12)],
      endpoints: [cell(8, 11), cell(8, 13)],
      orientation: "vertical",
      sillElevation: 12,
      aperture: 1,
      gasConductance: 0.24,
      liquidConductance: 0.3,
      liquidMode: "drain",
      hostRoomId: "switchyard",
      sealGroupId: "outer_shaft_seal",
    }),
    portal({
      id: "furnace_to_reservoir_passage",
      rooms: ["furnace", "reservoir"],
      kind: "passage",
      connectorCells: [cell(21, 24)],
      endpoints: [cell(20, 24), cell(22, 24)],
      orientation: "horizontal",
      sillElevation: 24,
      aperture: 1,
      gasConductance: 0.2,
      liquidConductance: 0.16,
      liquidMode: "spill",
      hostRoomId: "furnace",
      sealGroupId: "upper_passage_seal",
    }),
    portal({
      id: "reservoir_to_gallery_trapdoor",
      rooms: ["reservoir", "gallery"],
      kind: "trapdoor",
      connectorCells: [cell(28, 23)],
      endpoints: [cell(28, 24), cell(28, 22)],
      orientation: "vertical",
      sillElevation: 24,
      aperture: 1,
      gasConductance: 0.18,
      liquidConductance: 0.42,
      liquidMode: "drain",
      hostRoomId: "gallery",
      sealGroupId: "upper_trapdoor_seal",
    }),
    portal({
      id: "gallery_to_lower_intake",
      rooms: ["gallery", "lower_intake"],
      kind: "passage",
      connectorCells: [cell(34, 14), cell(35, 14)],
      endpoints: [cell(33, 14), cell(36, 14)],
      orientation: "horizontal",
      sillElevation: 14,
      aperture: 2,
      gasConductance: 0.28,
      liquidConductance: 0.22,
      liquidMode: "spill",
      hostRoomId: "gallery",
      sealGroupId: "middle_passage_seal",
    }),
    portal({
      id: "lower_intake_to_washlock_drop",
      rooms: ["lower_intake", "washlock"],
      kind: "floor_hole",
      connectorCells: [cell(42, 13)],
      endpoints: [cell(42, 14), cell(42, 12)],
      orientation: "vertical",
      sillElevation: 14,
      aperture: 1,
      gasConductance: 0.2,
      liquidConductance: 0.45,
      liquidMode: "drain",
      hostRoomId: "washlock",
      sealGroupId: "inner_drop_seal",
    }),
    portal({
      id: "washlock_to_core_door",
      rooms: ["washlock", "core"],
      kind: "core_door",
      connectorCells: [cell(49, 4), cell(50, 4)],
      endpoints: [cell(48, 4), cell(51, 4)],
      orientation: "horizontal",
      sillElevation: 4,
      aperture: 2,
      gasConductance: 0,
      liquidConductance: 0,
      liquidMode: "blocked",
      hostRoomId: "washlock",
      defaultOpen: false,
      defaultSealed: true,
    }),
  ],
  utilityNodes: {
    starter_gas_header: { cell: cell(54, 16), hostRoomId: "core" },
    water_tank: { cell: cell(54, 6), hostRoomId: "core" },
    sodium_chloride_tank: { cell: cell(58, 6), hostRoomId: "core" },
    anode_header: { cell: cell(38, 20), hostRoomId: "lower_intake" },
    cathode_header: { cell: cell(42, 20), hostRoomId: "lower_intake" },
    cell_liquor: { cell: cell(46, 16), hostRoomId: "lower_intake" },
    gas_vent: { cell: cell(64, 16), hostRoomId: "core" },
    liquid_drain: { cell: cell(64, 6), hostRoomId: "core" },
  },
};
