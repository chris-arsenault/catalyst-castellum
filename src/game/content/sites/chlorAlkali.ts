import type { GeneratedSiteSpec } from "../../world/siteGeneratorTypes";
import { WORLD_MAP } from "../worldMap";
import { siteGasTap, siteLiquidTap, siteRoomChunk } from "./siteAuthoring";

/**
 * The chlor-alkali site's chunk vocabulary carries one continuous process train from
 * membrane electrolysis through heated HCl production and the final hull return.
 */
export const CHLOR_ALKALI_SITE: GeneratedSiteSpec = {
  id: "chlor_alkali_exterior",
  width: 148,
  height: 40,
  cellSize: WORLD_MAP.cellSize,
  ringRadii: { inner: 24, middle: 46 },
  hullAnchor: { columns: 60, elevations: 0 },
  coreAnchor: { ...WORLD_MAP.coreAnchor },
  coreBreachCell: { ...WORLD_MAP.coreBreachCell },
  chunks: [
    siteRoomChunk("west_intake", "ENTRY", "entry", 4, 8),
    siteRoomChunk("switchyard", "CL-01", "room", 14, 8),
    siteRoomChunk("lower_intake", "CL-02", "room", 15, 10, {
      taps: { gas: siteGasTap({ capacity: 22 }), liquid: siteLiquidTap({ capacity: 24 }) },
    }),
    siteRoomChunk("reservoir", "CL-03", "room", 18, 12),
    siteRoomChunk("furnace", "CL-04", "room", 15, 12),
    siteRoomChunk("gallery", "CL-05", "room", 12, 9),
  ],
  chunkOrders: [
    ["west_intake", "switchyard", "reservoir", "lower_intake", "furnace", "gallery"],
    ["west_intake", "switchyard", "lower_intake", "reservoir", "furnace", "gallery"],
  ],
  patterns: [
    {
      id: "process_train",
      directions: ["right", "right", "right", "right", "right", "right"],
    },
    {
      id: "raised_reactor",
      directions: ["right", "right", "right", "right", "up", "down"],
    },
    {
      id: "raised_reservoir",
      directions: ["right", "right", "right", "up", "right", "down"],
    },
    {
      id: "suspended_cell",
      directions: ["right", "right", "up", "right", "right", "down"],
    },
  ],
  processLines: [
    {
      kind: "gas_line",
      rooms: ["core", "lower_intake"],
      direction: ["lower_intake", "core"],
      destinationKind: "gas_vent",
      actuator: "fan",
      actuatorHead: 1.45,
      maxFlow: 0.8,
      volumePerCell: 0.2,
      buildCost: 7,
    },
    {
      kind: "gas_line",
      rooms: ["lower_intake", "reservoir"],
      direction: ["lower_intake", "reservoir"],
      destinationKind: "room",
      actuator: "fan",
      actuatorHead: 1.55,
      maxFlow: 1.05,
      volumePerCell: 0.22,
      buildCost: 7,
    },
    {
      kind: "liquid_line",
      rooms: ["core", "lower_intake"],
      direction: ["core", "lower_intake"],
      destinationKind: "room",
      actuator: "pump",
      actuatorHead: 34,
      maxFlow: 1.55,
      volumePerCell: 0.26,
      buildCost: 10,
    },
    {
      kind: "gas_line",
      rooms: ["furnace", "lower_intake"],
      direction: ["lower_intake", "furnace"],
      destinationKind: "room",
      actuator: "fan",
      actuatorHead: 1.55,
      maxFlow: 1.15,
      volumePerCell: 0.22,
      buildCost: 8,
    },
    {
      kind: "gas_line",
      rooms: ["furnace", "gallery"],
      direction: ["furnace", "gallery"],
      destinationKind: "room",
      actuator: "fan",
      actuatorHead: 1.5,
      maxFlow: 1.2,
      volumePerCell: 0.22,
      buildCost: 8,
    },
    {
      kind: "gas_line",
      rooms: ["gallery", "washlock"],
      direction: ["gallery", "washlock"],
      destinationKind: "room",
      actuator: "fan",
      actuatorHead: 1.45,
      maxFlow: 1.15,
      volumePerCell: 0.22,
      buildCost: 8,
    },
  ],
  utilityNodes: {},
};

/** Selected from the generated candidate sheet; stable so tutorial guidance is reproducible. */
export const CHLOR_ALKALI_TUTORIAL_SEED = 20_260_737;
