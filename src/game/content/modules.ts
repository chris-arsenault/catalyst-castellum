import { cell } from "../spatial";
import type { ModuleTemplate } from "../world/modules";

const standardJoint = {
  kind: "door" as const,
  aperture: 1,
  gasConductance: 0.2,
  liquidConductance: 0.2,
  liquidMode: "spill" as const,
};

/**
 * The launch archetype trio (M5 decision). The catalog is open data — new module
 * types are entries here, never code.
 */
export const MODULE_TEMPLATES: Record<string, ModuleTemplate> = {
  utility_pod: {
    id: "utility_pod",
    codePrefix: "POD",
    ambientTemperature: 22,
    socketCount: 0,
    footprint: { width: 4, height: 6 },
    socketCells: {},
    taps: {
      gas: { capacity: 14, includeRoomInventory: true, roomPortHeight: 0.72, sourceIds: [] },
      liquid: { capacity: 14, includeRoomInventory: true, roomPortHeight: 0.12, sourceIds: [] },
    },
    hardpoints: [
      { id: "forward", cell: cell(0, 0), facing: "left" },
      { id: "upper", cell: cell(2, 5), facing: "up" },
    ],
    joint: standardJoint,
    graftCost: 14,
  },
  process_chamber: {
    id: "process_chamber",
    codePrefix: "LAB",
    ambientTemperature: 22,
    socketCount: 2,
    footprint: { width: 12, height: 8 },
    socketCells: { socket_a: cell(3, 0), socket_b: cell(8, 0) },
    taps: {
      gas: { capacity: 18, includeRoomInventory: true, roomPortHeight: 0.72, sourceIds: [] },
      liquid: { capacity: 18, includeRoomInventory: true, roomPortHeight: 0.12, sourceIds: [] },
    },
    hardpoints: [
      { id: "forward", cell: cell(0, 0), facing: "left" },
      { id: "upper", cell: cell(6, 7), facing: "up" },
    ],
    joint: standardJoint,
    graftCost: 26,
  },
  reservoir_stack: {
    id: "reservoir_stack",
    codePrefix: "TANK",
    ambientTemperature: 22,
    socketCount: 2,
    footprint: { width: 10, height: 12 },
    socketCells: { socket_a: cell(2, 0), socket_b: cell(7, 0) },
    taps: {
      gas: { capacity: 18, includeRoomInventory: true, roomPortHeight: 0.72, sourceIds: [] },
      liquid: { capacity: 26, includeRoomInventory: true, roomPortHeight: 0.12, sourceIds: [] },
    },
    hardpoints: [
      { id: "forward", cell: cell(0, 0), facing: "left" },
      { id: "upper", cell: cell(5, 11), facing: "up" },
    ],
    joint: { ...standardJoint, liquidMode: "drain", liquidConductance: 0.35 },
    graftCost: 30,
  },
};
