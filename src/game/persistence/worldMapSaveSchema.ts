import { z } from "zod";

const roomIdSchema = z.string().min(1);
const gridCellSchema = z.object({ column: z.number().int(), elevation: z.number().int() });
const cellRectSchema = z.object({
  column: z.number().int(),
  elevation: z.number().int(),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
});
const tapSchema = z.object({
  capacity: z.number(),
  includeRoomInventory: z.boolean(),
  roomPortHeight: z.number(),
  sourceIds: z.array(z.string().min(1)),
});
const roomSchema = z.object({
  id: roomIdSchema,
  code: z.string().min(1),
  structure: z.enum(["entry", "room", "core"]),
  ambientTemperature: z.number(),
  socketCount: z.union([z.literal(0), z.literal(2)]),
  bounds: cellRectSchema,
  socketCells: z.record(z.string(), gridCellSchema),
  platformCells: z.array(gridCellSchema),
  ladderCells: z.array(gridCellSchema),
  taps: z.object({ gas: tapSchema, liquid: tapSchema }),
  hardpoints: z.array(
    z.object({
      id: z.string().min(1),
      cell: gridCellSchema,
      facing: z.enum(["left", "right", "up", "down"]),
    })
  ),
  provenance: z.enum(["site", "hull"]),
});
const processLineSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["gas_line", "liquid_line"]),
  rooms: z.tuple([roomIdSchema, roomIdSchema]),
  direction: z.tuple([roomIdSchema, roomIdSchema]),
  destinationKind: z.enum(["room", "gas_vent", "liquid_recovery"]),
  actuator: z.enum(["fan", "pump", "passive"]),
  actuatorHead: z.number(),
  maxFlow: z.number(),
  volumePerCell: z.number(),
  buildCost: z.number(),
  route: z.array(gridCellSchema).min(2),
});
const architecturalConnectionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["passage", "ladder_shaft", "floor_hole", "door", "trapdoor", "core_door"]),
  rooms: z.tuple([roomIdSchema, roomIdSchema]),
  connectorCells: z.array(gridCellSchema).min(1),
  endpoints: z.tuple([gridCellSchema, gridCellSchema]),
  orientation: z.enum(["horizontal", "vertical"]),
  sillElevation: z.number(),
  aperture: z.number(),
  gasConductance: z.number(),
  liquidConductance: z.number(),
  liquidMode: z.enum(["spill", "drain", "blocked"]),
  defaultOpen: z.boolean(),
  defaultSealed: z.boolean(),
  sealGroupId: z.string().nullable(),
  hostRoomId: roomIdSchema,
});

export const worldMapSaveSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  cellSize: z.number().min(1),
  coreAnchor: gridCellSchema,
  ringRadii: z.object({ inner: z.number(), middle: z.number() }),
  entryCell: gridCellSchema,
  coreBreachCell: gridCellSchema,
  rooms: z.record(roomIdSchema, roomSchema),
  connections: z.record(z.string(), z.union([processLineSchema, architecturalConnectionSchema])),
  utilityNodes: z.record(z.string(), z.object({ cell: gridCellSchema, hostRoomId: roomIdSchema })),
});
