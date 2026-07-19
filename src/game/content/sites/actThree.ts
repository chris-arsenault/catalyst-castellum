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
  hullColumns: number
): GeneratedSiteSpec => ({
  id,
  width: 176,
  height: 68,
  cellSize: WORLD_MAP.cellSize,
  ringRadii: { inner: 30, middle: 58 },
  hullAnchor: { columns: hullColumns, elevations: 0 },
  coreAnchor: { ...WORLD_MAP.coreAnchor },
  coreBreachCell: { ...WORLD_MAP.coreBreachCell },
  chunks,
  chunkOrders,
  patterns,
  processLines: [],
  utilityNodes: {
    [SPECIALTY_GAS_RESERVOIR_ID]: {
      cell: cell(2, 2),
      hostRoomId: "reservoir",
    },
  },
});

const ORDERS = {
  observation: ["west_intake", "gallery", "switchyard", "reservoir", "furnace", "lower_intake"],
  store: ["west_intake", "reservoir", "switchyard", "gallery", "furnace", "lower_intake"],
  lane: ["west_intake", "switchyard", "furnace", "gallery", "reservoir", "lower_intake"],
  closure: ["west_intake", "furnace", "switchyard", "reservoir", "gallery", "lower_intake"],
} as const;

const PATTERNS = {
  doubleReading: {
    id: "double_reading",
    directions: ["right", "up", "right", "down", "right", "right"],
  },
  overlap: {
    id: "overlapping_stores",
    directions: ["right", "right", "up", "right", "down", "right"],
  },
  longLane: {
    id: "long_lane",
    directions: ["right", "right", "right", "right", "right", "right"],
  },
  closureSteps: {
    id: "closure_steps",
    directions: ["right", "up", "right", "down", "right", "right"],
  },
} as const satisfies Record<string, GeneratedSiteSpec["patterns"][number]>;

export const STATION_14_SITE = site(
  "station_14_monitoring_post",
  [
    siteRoomChunk("west_intake", "S14-0", "entry", 4, 9),
    siteRoomChunk("switchyard", "S14-1", "room", 14, 15),
    siteRoomChunk("furnace", "S14-2", "room", 16, 12),
    siteRoomChunk("reservoir", "S14-3", "room", 15, 14, {
      taps: {
        gas: siteGasTap({ sourceIds: [SPECIALTY_GAS_RESERVOIR_ID] }),
        liquid: siteLiquidTap(),
      },
    }),
    siteRoomChunk("gallery", "S14-4", "room", 13, 16),
    siteRoomChunk("lower_intake", "S14-5", "room", 16, 11, {
      taps: { gas: siteGasTap({ capacity: 32 }), liquid: siteLiquidTap({ capacity: 26 }) },
    }),
  ],
  [ORDERS.observation, ORDERS.lane],
  [PATTERNS.doubleReading, PATTERNS.overlap],
  76
);

export const VASKER_STORE_SITE = site(
  "vasker_ringglass_store",
  [
    siteRoomChunk("west_intake", "VS-00", "entry", 5, 9),
    siteRoomChunk("switchyard", "VS-01", "room", 19, 10),
    siteRoomChunk("furnace", "VS-02", "room", 14, 16),
    siteRoomChunk("reservoir", "VS-03", "room", 22, 11, {
      taps: {
        gas: siteGasTap({ sourceIds: [SPECIALTY_GAS_RESERVOIR_ID] }),
        liquid: siteLiquidTap(),
      },
    }),
    siteRoomChunk("gallery", "VS-04", "room", 15, 15),
    siteRoomChunk("lower_intake", "VS-05", "room", 18, 12, {
      taps: { gas: siteGasTap({ capacity: 34 }), liquid: siteLiquidTap({ capacity: 28 }) },
    }),
  ],
  [ORDERS.store, ORDERS.observation],
  [PATTERNS.overlap, PATTERNS.doubleReading],
  80
);

export const LANE_SIX_SITE = site(
  "lane_six_inner_approach",
  [
    siteRoomChunk("west_intake", "L6C-0", "entry", 5, 10),
    siteRoomChunk("switchyard", "L6C-1", "room", 23, 10),
    siteRoomChunk("furnace", "L6C-2", "room", 22, 11),
    siteRoomChunk("reservoir", "L6C-3", "room", 24, 10, {
      taps: {
        gas: siteGasTap({ sourceIds: [SPECIALTY_GAS_RESERVOIR_ID] }),
        liquid: siteLiquidTap(),
      },
    }),
    siteRoomChunk("gallery", "L6C-4", "room", 22, 11),
    siteRoomChunk("lower_intake", "L6C-5", "room", 21, 10, {
      taps: { gas: siteGasTap({ capacity: 36 }), liquid: siteLiquidTap({ capacity: 30 }) },
    }),
  ],
  [ORDERS.lane, ORDERS.store],
  [PATTERNS.longLane, PATTERNS.overlap],
  84
);

export const PELL_CORDON_SITE = site(
  "pell_emergence_cordon",
  [
    siteRoomChunk("west_intake", "PEL-0", "entry", 5, 10),
    siteRoomChunk("switchyard", "PEL-1", "room", 19, 14),
    siteRoomChunk("furnace", "PEL-2", "room", 20, 14),
    siteRoomChunk("reservoir", "PEL-3", "room", 21, 14, {
      taps: {
        gas: siteGasTap({ sourceIds: [SPECIALTY_GAS_RESERVOIR_ID] }),
        liquid: siteLiquidTap(),
      },
    }),
    siteRoomChunk("gallery", "PEL-4", "room", 19, 14),
    siteRoomChunk("lower_intake", "PEL-5", "room", 20, 13, {
      taps: { gas: siteGasTap({ capacity: 38 }), liquid: siteLiquidTap({ capacity: 32 }) },
    }),
  ],
  [ORDERS.closure, ORDERS.lane, ORDERS.observation],
  [PATTERNS.closureSteps, PATTERNS.longLane, PATTERNS.doubleReading],
  82
);

export const ACT_THREE_SITE_SEEDS = {
  station_14: 20_260_809,
  vasker_store: 20_260_810,
  lane_six: 20_260_811,
  pell_cordon: 20_260_812,
} as const;
