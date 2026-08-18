import type { EquipmentSocketId, GridCell, RoomId } from "../types";
import { cell } from "../spatial";
import type {
  ArchitecturalConnection,
  GasTapDefinition,
  GraftSlot,
  LiquidTapDefinition,
  MapRoom,
  WorldMap,
} from "./map";

/**
 * Room modules are an open data catalog (M5 decision: launch with the archetype trio,
 * support arbitrary types). A template is everything a grafted room is born with;
 * grafting instantiates it at a graft slot as a validated map edit.
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
  /** Graft slots the new room itself offers, relative to its origin. */
  graftSlots: readonly { id: string; cell: GridCell; facing: GraftSlot["facing"] }[];
  joint: JointSpec;
  graftCost: number;
}

const FACING_DELTAS: Record<GraftSlot["facing"], GridCell> = {
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
 * Deterministic placement: the joint connector sits one cell beyond the graft slot in
 * its facing; the module's near edge sits one cell beyond that, centered on the
 * graft slot's row or column.
 */
export const graftPlacement = (graftSlot: GraftSlot, template: ModuleTemplate): GraftPlacement => {
  const delta = FACING_DELTAS[graftSlot.facing];
  const connectorCell = cell(
    graftSlot.cell.column + delta.column,
    graftSlot.cell.elevation + delta.elevation
  );
  const moduleAttachCell = cell(
    connectorCell.column + delta.column,
    connectorCell.elevation + delta.elevation
  );
  const { width, height } = template.footprint;
  let origin: GridCell;
  switch (graftSlot.facing) {
    case "right":
      origin = cell(moduleAttachCell.column, moduleAttachCell.elevation);
      break;
    case "left":
      origin = cell(moduleAttachCell.column - (width - 1), moduleAttachCell.elevation);
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
    graftSlot.facing === "left" || graftSlot.facing === "right" ? "horizontal" : "vertical";
  return { origin, connectorCell, moduleAttachCell, orientation };
};

export const graftedRoomId = (hostRoomId: RoomId, graftSlotId: string): RoomId =>
  `graft:${hostRoomId}:${graftSlotId}`;

export const graftedJointId = (hostRoomId: RoomId, graftSlotId: string): string =>
  `joint:${hostRoomId}:${graftSlotId}`;

const shift = (relative: GridCell, origin: GridCell): GridCell =>
  cell(relative.column + origin.column, relative.elevation + origin.elevation);

/** The room a graft creates, positioned on the map grid. Hull provenance by definition. */
export const instantiateModuleRoom = (
  template: ModuleTemplate,
  hostRoomId: RoomId,
  graftSlot: GraftSlot,
  code: string
): MapRoom => {
  const { origin } = graftPlacement(graftSlot, template);
  const ladderColumn = origin.column + Math.floor(template.footprint.width / 2);
  return {
    id: graftedRoomId(hostRoomId, graftSlot.id),
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
    ladderCells: Array.from({ length: template.footprint.height }, (_, index) =>
      cell(ladderColumn, origin.elevation + index)
    ),
    taps: structuredClone(template.taps),
    graftSlots: template.graftSlots.map((graftSlotSpec) => ({
      id: graftSlotSpec.id,
      cell: shift(graftSlotSpec.cell, origin),
      facing: graftSlotSpec.facing,
    })),
    provenance: "hull",
  };
};

/** The architectural joint a graft creates between host and module. */
export const instantiateJoint = (
  template: ModuleTemplate,
  hostRoomId: RoomId,
  graftSlot: GraftSlot,
  moduleRoomId: RoomId
): ArchitecturalConnection => {
  const placement = graftPlacement(graftSlot, template);
  return {
    id: graftedJointId(hostRoomId, graftSlot.id),
    kind: placement.orientation === "vertical" ? "ladder_shaft" : template.joint.kind,
    rooms: [hostRoomId, moduleRoomId],
    connectorCells: [placement.connectorCell],
    endpoints: [graftSlot.cell, placement.moduleAttachCell],
    orientation: placement.orientation,
    sillElevation: Math.min(graftSlot.cell.elevation, placement.moduleAttachCell.elevation),
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

/** A graft slot is occupied when its joint exists on the map. */
export const graftSlotOccupied = (
  map: WorldMap,
  hostRoomId: RoomId,
  graftSlotId: string
): boolean => graftedJointId(hostRoomId, graftSlotId) in map.connections;
