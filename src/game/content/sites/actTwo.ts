import type { GeneratedSiteSpec } from "../../world/siteGeneratorTypes";
import { cell } from "../../spatial";
import { SPECIALTY_GAS_RESERVOIR_ID } from "../supplies";
import { WORLD_MAP } from "../worldMap";
import { siteGasTap, siteLiquidTap, siteRoomChunk } from "./siteAuthoring";

const site = (
  id: string,
  chunks: GeneratedSiteSpec["chunks"],
  chunkOrders: GeneratedSiteSpec["chunkOrders"],
  patterns: GeneratedSiteSpec["patterns"],
  hullColumns: number,
  specialtyGas = false
): GeneratedSiteSpec => ({
  id,
  width: 166,
  height: 64,
  cellSize: WORLD_MAP.cellSize,
  ringRadii: { inner: 28, middle: 54 },
  hullAnchor: { columns: hullColumns, elevations: 0 },
  coreAnchor: { ...WORLD_MAP.coreAnchor },
  coreBreachCell: { ...WORLD_MAP.coreBreachCell },
  chunks,
  chunkOrders,
  patterns,
  processLines: [],
  utilityNodes: specialtyGas
    ? {
        [SPECIALTY_GAS_RESERVOIR_ID]: {
          cell: cell(2, 2),
          hostRoomId: "reservoir",
        },
      }
    : {},
});

const ORDERS = {
  standard: ["west_intake", "switchyard", "furnace", "reservoir", "gallery", "lower_intake"],
  exchange: ["west_intake", "switchyard", "reservoir", "furnace", "lower_intake", "gallery"],
  freight: ["west_intake", "reservoir", "switchyard", "lower_intake", "furnace", "gallery"],
} as const;

const PATTERNS = {
  deck: { id: "long_deck", directions: ["right", "right", "right", "right", "right", "right"] },
  split: {
    id: "split_levels",
    directions: ["right", "right", "up", "right", "down", "right"],
  },
  tiers: {
    id: "counter_tiers",
    directions: ["right", "up", "right", "down", "right", "right"],
  },
} as const satisfies Record<string, GeneratedSiteSpec["patterns"][number]>;

export const KETTLEBLACK_SITE = site(
  "kettleblack_wreck",
  [
    siteRoomChunk("west_intake", "KB-00", "entry", 4, 8),
    siteRoomChunk("switchyard", "KB-01", "room", 16, 9),
    siteRoomChunk("furnace", "KB-02", "room", 18, 12),
    siteRoomChunk("reservoir", "KB-03", "room", 20, 10),
    siteRoomChunk("gallery", "KB-04", "room", 14, 11),
    siteRoomChunk("lower_intake", "KB-05", "room", 17, 9, {
      taps: { gas: siteGasTap({ capacity: 24 }), liquid: siteLiquidTap({ capacity: 20 }) },
    }),
  ],
  [ORDERS.standard, ORDERS.exchange],
  [PATTERNS.split, PATTERNS.deck],
  72
);

export const CORDON_41_SITE = site(
  "cordon_41_sensor_wall",
  [
    siteRoomChunk("west_intake", "C41-0", "entry", 4, 8),
    siteRoomChunk("switchyard", "C41-1", "room", 12, 12),
    siteRoomChunk("furnace", "C41-2", "room", 14, 15),
    siteRoomChunk("reservoir", "C41-3", "room", 13, 13),
    siteRoomChunk("gallery", "C41-4", "room", 11, 15),
    siteRoomChunk("lower_intake", "C41-5", "room", 15, 11, {
      taps: { gas: siteGasTap({ capacity: 26 }), liquid: siteLiquidTap({ capacity: 22 }) },
    }),
  ],
  [ORDERS.exchange, ORDERS.standard],
  [PATTERNS.tiers, PATTERNS.split],
  70
);

export const JUNCTION_L6_SITE = site(
  "junction_l6_freight_deck",
  [
    siteRoomChunk("west_intake", "L6-00", "entry", 5, 9),
    siteRoomChunk("switchyard", "L6-01", "room", 20, 9),
    siteRoomChunk("furnace", "L6-02", "room", 18, 10),
    siteRoomChunk("reservoir", "L6-03", "room", 22, 10),
    siteRoomChunk("gallery", "L6-04", "room", 18, 9),
    siteRoomChunk("lower_intake", "L6-05", "room", 19, 10, {
      taps: { gas: siteGasTap({ capacity: 28 }), liquid: siteLiquidTap({ capacity: 24 }) },
    }),
  ],
  [ORDERS.freight, ORDERS.standard],
  [PATTERNS.deck, PATTERNS.split],
  78
);

export const PELL_CUT_SITE = site(
  "pell_cut_parallel_arrays",
  [
    siteRoomChunk("west_intake", "PC-00", "entry", 4, 9),
    siteRoomChunk("switchyard", "PC-01", "room", 17, 12),
    siteRoomChunk("furnace", "PC-02", "room", 17, 12),
    siteRoomChunk("reservoir", "PC-03", "room", 17, 12, {
      taps: {
        gas: siteGasTap({ sourceIds: [SPECIALTY_GAS_RESERVOIR_ID] }),
        liquid: siteLiquidTap(),
      },
    }),
    siteRoomChunk("gallery", "PC-04", "room", 17, 12),
    siteRoomChunk("lower_intake", "PC-05", "room", 17, 12, {
      taps: { gas: siteGasTap({ capacity: 30 }), liquid: siteLiquidTap({ capacity: 26 }) },
    }),
  ],
  [ORDERS.standard, ORDERS.freight],
  [PATTERNS.tiers, PATTERNS.split, PATTERNS.deck],
  74,
  true
);

export const ACT_TWO_SITE_SEEDS = {
  kettleblack: 20_260_805,
  cordon_41: 20_260_806,
  junction_l6: 20_260_807,
  pell_cut: 20_260_808,
} as const;
