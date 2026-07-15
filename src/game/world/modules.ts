import type { EquipmentSocketId, GridCell, RoomId } from "../types";
import { cell } from "../spatial";
import type {
  ArchitecturalConnection,
  GasTapDefinition,
  Hardpoint,
  LiquidTapDefinition,
  MapRoom,
  WorldMap,
} from "./map";

/**
 * Room modules are an open data catalog (M5 decision: launch with the archetype trio,
 * support arbitrary types). A template is everything a grafted room is born with;
 * grafting instantiates it at a hardpoint as a validated map edit.
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type ModuleId = string;

export interface JointSpec {
  kind: ArchitecturalConnection["kind"];
  aperture: number;
  gasConductance: number;
  liquidConductance: number;
  liquidMode: ArchitecturalConnection["liquidMode"];
}

export interface ModuleTemplate {
  id: ModuleId;
  codePrefix: string;
  ambientTemperature: number;
  socketCount: 0 | 2;
  footprint: { width: number; height: number };
  /** Relative to the module's bottom-left origin. */
  socketCells: Partial<Record<EquipmentSocketId, GridCell>>;
  taps: { gas: GasTapDefinition; liquid: LiquidTapDefinition };
  /** Hardpoints the grafted room itself offers, relative to its origin. */
  hardpoints: readonly { id: string; cell: GridCell; facing: Hardpoint["facing"] }[];
  joint: JointSpec;
  graftCost: number;
}

const FACING_DELTAS: Record<Hardpoint["facing"], GridCell> = {
  left: cell(-1, 0),
  right: cell(1, 0),
  up: cell(0, 1),
  down: cell(0, -1),
};

export interface GraftPlacement {
  origin: GridCell;
  connectorCell: GridCell;
  moduleAttachCell: GridCell;
  orientation: ArchitecturalConnection["orientation"];
}

/**
 * Deterministic placement: the joint connector sits one cell beyond the hardpoint in
 * its facing; the module's near edge sits one cell beyond that, centered on the
 * hardpoint's row or column.
 */
export const graftPlacement = (hardpoint: Hardpoint, template: ModuleTemplate): GraftPlacement => {
  const delta = FACING_DELTAS[hardpoint.facing];
  const connectorCell = cell(
    hardpoint.cell.column + delta.column,
    hardpoint.cell.elevation + delta.elevation
  );
  const moduleAttachCell = cell(
    connectorCell.column + delta.column,
    connectorCell.elevation + delta.elevation
  );
  const { width, height } = template.footprint;
  let origin: GridCell;
  switch (hardpoint.facing) {
    case "right":
      origin = cell(moduleAttachCell.column, moduleAttachCell.elevation - Math.floor(height / 2));
      break;
    case "left":
      origin = cell(
        moduleAttachCell.column - (width - 1),
        moduleAttachCell.elevation - Math.floor(height / 2)
      );
      break;
    case "up":
      origin = cell(moduleAttachCell.column - Math.floor(width / 2), moduleAttachCell.elevation);
      break;
    default:
      origin = cell(
        moduleAttachCell.column - Math.floor(width / 2),
        moduleAttachCell.elevation - (height - 1)
      );
      break;
  }
  const orientation =
    hardpoint.facing === "left" || hardpoint.facing === "right" ? "horizontal" : "vertical";
  return { origin, connectorCell, moduleAttachCell, orientation };
};

export const graftedRoomId = (hostRoomId: RoomId, hardpointId: string): RoomId =>
  `graft:${hostRoomId}:${hardpointId}`;

export const graftedJointId = (hostRoomId: RoomId, hardpointId: string): string =>
  `joint:${hostRoomId}:${hardpointId}`;

const shift = (relative: GridCell, origin: GridCell): GridCell =>
  cell(relative.column + origin.column, relative.elevation + origin.elevation);

/** The room a graft creates, positioned on the map grid. Hull provenance by definition. */
export const instantiateModuleRoom = (
  template: ModuleTemplate,
  hostRoomId: RoomId,
  hardpoint: Hardpoint,
  code: string
): MapRoom => {
  const { origin } = graftPlacement(hardpoint, template);
  return {
    id: graftedRoomId(hostRoomId, hardpoint.id),
    code,
    structure: "room",
    ambientTemperature: template.ambientTemperature,
    socketCount: template.socketCount,
    bounds: {
      column: origin.column,
      elevation: origin.elevation,
      width: template.footprint.width,
      height: template.footprint.height,
    },
    socketCells: Object.fromEntries(
      Object.entries(template.socketCells).flatMap(([socketId, relative]) =>
        relative ? [[socketId, shift(relative, origin)]] : []
      )
    ),
    platformCells: [],
    ladderCells: [],
    taps: structuredClone(template.taps),
    hardpoints: template.hardpoints.map((hardpointSpec) => ({
      id: hardpointSpec.id,
      cell: shift(hardpointSpec.cell, origin),
      facing: hardpointSpec.facing,
    })),
    provenance: "hull",
  };
};

/** The architectural joint a graft creates between host and module. */
export const instantiateJoint = (
  template: ModuleTemplate,
  hostRoomId: RoomId,
  hardpoint: Hardpoint,
  moduleRoomId: RoomId
): ArchitecturalConnection => {
  const placement = graftPlacement(hardpoint, template);
  return {
    id: graftedJointId(hostRoomId, hardpoint.id),
    kind: template.joint.kind,
    rooms: [hostRoomId, moduleRoomId],
    connectorCells: [placement.connectorCell],
    endpoints: [hardpoint.cell, placement.moduleAttachCell],
    orientation: placement.orientation,
    sillElevation: Math.min(hardpoint.cell.elevation, placement.moduleAttachCell.elevation),
    aperture: template.joint.aperture,
    gasConductance: template.joint.gasConductance,
    liquidConductance: template.joint.liquidConductance,
    liquidMode: template.joint.liquidMode,
    defaultOpen: true,
    defaultSealed: false,
    sealGroupId: null,
    hostRoomId,
  };
};

/** A hardpoint is occupied when its joint exists on the map. */
export const hardpointOccupied = (
  map: WorldMap,
  hostRoomId: RoomId,
  hardpointId: string
): boolean => graftedJointId(hostRoomId, hardpointId) in map.connections;
