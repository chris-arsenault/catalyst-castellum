import type { ConduitDestinationKind, GridCell, RoomId } from "../types";
import { cell, orthogonalGridPath } from "../spatial";
import type { ArchitecturalConnection, MapConnection, ProcessLineConnection } from "../world/map";
import { processLineId } from "../world/map";

const portal = (
  definition: Omit<ArchitecturalConnection, "defaultOpen" | "defaultSealed" | "sealGroupId"> &
    Partial<Pick<ArchitecturalConnection, "defaultOpen" | "defaultSealed" | "sealGroupId">>
): ArchitecturalConnection => ({
  ...definition,
  defaultOpen: definition.defaultOpen ?? true,
  defaultSealed: definition.defaultSealed ?? false,
  sealGroupId: definition.sealGroupId ?? null,
});

interface LineOptions {
  rooms: readonly [RoomId, RoomId];
  direction: readonly [RoomId, RoomId];
  destinationKind?: ConduitDestinationKind;
  actuator: "fan" | "pump" | "passive";
  actuatorHead: number;
  maxFlow: number;
  volumePerCell: number;
  buildCost: number;
  route: readonly GridCell[];
}

const line = (
  kind: ProcessLineConnection["kind"],
  options: LineOptions
): ProcessLineConnection => ({
  id: processLineId(kind, options.rooms[0], options.rooms[1]),
  kind,
  rooms: options.rooms,
  direction: options.direction,
  destinationKind: options.destinationKind ?? "room",
  actuator: options.actuator,
  actuatorHead: options.actuatorHead,
  maxFlow: options.maxFlow,
  volumePerCell: options.volumePerCell,
  buildCost: options.buildCost,
  route: options.route,
});

const gasLine = (options: LineOptions): ProcessLineConnection => line("gas_line", options);
const liquidLine = (options: LineOptions): ProcessLineConnection => line("liquid_line", options);

const coreCellRoute = orthogonalGridPath(cell(54, 8), cell(50, 8), cell(50, 16), cell(48, 16));
const cellAbsorberRoute = orthogonalGridPath(
  cell(42, 22),
  cell(52, 22),
  cell(52, 28),
  cell(48, 28)
);
const coreFinalRoute = orthogonalGridPath(cell(54, 6), cell(50, 6), cell(48, 6));

/**
 * Iteration order is behavior: gas/liquid flow resolves lines in insertion order and
 * architectural flow resolves openings in insertion order, so this list is authored in
 * the same order the legacy structures declared.
 */
export const WORLD_MAP_CONNECTIONS: readonly MapConnection[] = [
  portal({
    id: "entry_to_switchyard",
    kind: "passage",
    rooms: ["west_intake", "switchyard"],
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
    kind: "ladder_shaft",
    rooms: ["switchyard", "furnace"],
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
    kind: "passage",
    rooms: ["furnace", "reservoir"],
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
    kind: "trapdoor",
    rooms: ["reservoir", "gallery"],
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
    kind: "passage",
    rooms: ["gallery", "lower_intake"],
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
    kind: "floor_hole",
    rooms: ["lower_intake", "washlock"],
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
    kind: "core_door",
    rooms: ["washlock", "core"],
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
  gasLine({
    rooms: ["core", "furnace"],
    direction: ["core", "furnace"],
    actuator: "fan",
    actuatorHead: 2.2,
    maxFlow: 2.2,
    volumePerCell: 0.22,
    buildCost: 10,
    route: orthogonalGridPath(cell(54, 16), cell(54, 36), cell(18, 36), cell(18, 32)),
  }),
  gasLine({
    rooms: ["core", "switchyard"],
    direction: ["core", "switchyard"],
    actuator: "fan",
    actuatorHead: 2.2,
    maxFlow: 2.2,
    volumePerCell: 0.2,
    buildCost: 10,
    route: orthogonalGridPath(
      cell(54, 16),
      cell(58, 16),
      cell(58, 39),
      cell(4, 39),
      cell(4, 11),
      cell(7, 11)
    ),
  }),
  gasLine({
    rooms: ["core", "reservoir"],
    direction: ["core", "reservoir"],
    actuator: "fan",
    actuatorHead: 2.2,
    maxFlow: 2.2,
    volumePerCell: 0.2,
    buildCost: 9,
    route: orthogonalGridPath(
      cell(54, 16),
      cell(54, 18),
      cell(57, 18),
      cell(57, 34),
      cell(40, 34),
      cell(40, 32)
    ),
  }),
  gasLine({
    rooms: ["core", "gallery"],
    direction: ["core", "gallery"],
    actuator: "fan",
    actuatorHead: 2.2,
    maxFlow: 2.2,
    volumePerCell: 0.2,
    buildCost: 9,
    route: orthogonalGridPath(cell(54, 16), cell(56, 16), cell(56, 38), cell(28, 38), cell(28, 22)),
  }),
  gasLine({
    rooms: ["lower_intake", "furnace"],
    direction: ["lower_intake", "furnace"],
    actuator: "fan",
    actuatorHead: 1.8,
    maxFlow: 1.15,
    volumePerCell: 0.24,
    buildCost: 8,
    route: orthogonalGridPath(cell(46, 18), cell(52, 18), cell(52, 35), cell(18, 35), cell(18, 32)),
  }),
  gasLine({
    rooms: ["core", "lower_intake"],
    direction: ["lower_intake", "core"],
    destinationKind: "gas_vent",
    actuator: "fan",
    actuatorHead: 1.45,
    maxFlow: 0.8,
    volumePerCell: 0.2,
    buildCost: 7,
    route: [...coreCellRoute].reverse(),
  }),
  liquidLine({
    rooms: ["core", "lower_intake"],
    direction: ["core", "lower_intake"],
    actuator: "pump",
    actuatorHead: 34,
    maxFlow: 1.55,
    volumePerCell: 0.26,
    buildCost: 10,
    route: coreCellRoute,
  }),
  gasLine({
    rooms: ["lower_intake", "reservoir"],
    direction: ["lower_intake", "reservoir"],
    actuator: "fan",
    actuatorHead: 1.55,
    maxFlow: 1.05,
    volumePerCell: 0.22,
    buildCost: 7,
    route: cellAbsorberRoute,
  }),
  liquidLine({
    rooms: ["lower_intake", "reservoir"],
    direction: ["lower_intake", "reservoir"],
    actuator: "pump",
    actuatorHead: 24,
    maxFlow: 0.85,
    volumePerCell: 0.25,
    buildCost: 8,
    route: cellAbsorberRoute,
  }),
  gasLine({
    rooms: ["reservoir", "gallery"],
    direction: ["reservoir", "gallery"],
    actuator: "fan",
    actuatorHead: 1.5,
    maxFlow: 1.2,
    volumePerCell: 0.24,
    buildCost: 7,
    route: orthogonalGridPath(cell(32, 24), cell(32, 22), cell(31, 22)),
  }),
  gasLine({
    rooms: ["furnace", "gallery"],
    direction: ["furnace", "gallery"],
    actuator: "fan",
    actuatorHead: 1.5,
    maxFlow: 1.2,
    volumePerCell: 0.24,
    buildCost: 7,
    route: orthogonalGridPath(cell(18, 24), cell(18, 12), cell(26, 12), cell(26, 14)),
  }),
  gasLine({
    rooms: ["gallery", "washlock"],
    direction: ["gallery", "washlock"],
    actuator: "fan",
    actuatorHead: 1.35,
    maxFlow: 1.15,
    volumePerCell: 0.23,
    buildCost: 6,
    route: orthogonalGridPath(cell(32, 14), cell(32, 12), cell(40, 12), cell(40, 11)),
  }),
  gasLine({
    rooms: ["gallery", "switchyard"],
    direction: ["gallery", "switchyard"],
    actuator: "fan",
    actuatorHead: 1.5,
    maxFlow: 0.9,
    volumePerCell: 0.2,
    buildCost: 8,
    route: orthogonalGridPath(cell(22, 18), cell(2, 18), cell(2, 2), cell(15, 2), cell(15, 4)),
  }),
  gasLine({
    rooms: ["core", "washlock"],
    direction: ["washlock", "core"],
    destinationKind: "gas_vent",
    actuator: "fan",
    actuatorHead: 1.4,
    maxFlow: 0.95,
    volumePerCell: 0.21,
    buildCost: 9,
    route: [...coreFinalRoute].reverse(),
  }),
  liquidLine({
    rooms: ["core", "washlock"],
    direction: ["core", "washlock"],
    actuator: "pump",
    actuatorHead: 24,
    maxFlow: 0.75,
    volumePerCell: 0.24,
    buildCost: 10,
    route: coreFinalRoute,
  }),
  liquidLine({
    rooms: ["reservoir", "washlock"],
    direction: ["reservoir", "washlock"],
    actuator: "pump",
    actuatorHead: 24,
    maxFlow: 1.05,
    volumePerCell: 0.23,
    buildCost: 6,
    route: orthogonalGridPath(cell(44, 24), cell(44, 12), cell(44, 11)),
  }),
  liquidLine({
    rooms: ["core", "reservoir"],
    direction: ["reservoir", "core"],
    destinationKind: "liquid_recovery",
    actuator: "pump",
    actuatorHead: 22,
    maxFlow: 0.7,
    volumePerCell: 0.22,
    buildCost: 9,
    route: orthogonalGridPath(cell(44, 24), cell(70, 24), cell(70, 8), cell(68, 8)),
  }),
];
