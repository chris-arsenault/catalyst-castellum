import type {
  GasBufferDefinition,
  GasBufferId,
  GasJunctionDefinition,
  GasSourceDefinition,
  GasSourceId,
  LiquidBufferDefinition,
  LiquidBufferId,
  LiquidJunctionDefinition,
  LiquidSourceDefinition,
  LiquidSourceId,
  RoomId,
} from "../types";

export const GAS_SOURCES: Record<GasSourceId, GasSourceDefinition> = {
  starter_gas_header: {
    id: "starter_gas_header",
    name: "Starter gas header",
    formula: "2 H₂(g) + O₂(g)",
    capacity: 150,
    initialGas: { hydrogen: 80, oxygen: 40 },
    chargeGas: { hydrogen: 20, oxygen: 10 },
    chargeCost: 8,
    hostRoomId: "core",
    accent: "#d49a61",
  },
};

export const LIQUID_SOURCES: Record<LiquidSourceId, LiquidSourceDefinition> = {
  water_tank: {
    id: "water_tank",
    name: "Water reserve",
    formula: "H₂O(l)",
    substance: "water",
    capacity: 180,
    initialAmount: 112,
    chargeAmount: 28,
    chargeCost: 7,
    hostRoomId: "core",
    accent: "#4ca9d6",
  },
  sodium_chloride_tank: {
    id: "sodium_chloride_tank",
    name: "Sodium chloride reserve",
    formula: "NaCl(aq)",
    substance: "sodium_chloride",
    capacity: 180,
    initialAmount: 112,
    chargeAmount: 28,
    chargeCost: 10,
    hostRoomId: "core",
    accent: "#74bfd0",
  },
};

export const GAS_BUFFERS: Record<GasBufferId, GasBufferDefinition> = {
  anode_header: {
    id: "anode_header",
    name: "Cl₂ anode header",
    capacity: 18,
    hostRoomId: "lower_intake",
    accent: "#b4dc45",
  },
  cathode_header: {
    id: "cathode_header",
    name: "H₂ cathode header",
    capacity: 18,
    hostRoomId: "lower_intake",
    accent: "#efa24f",
  },
};

export const LIQUID_BUFFERS: Record<LiquidBufferId, LiquidBufferDefinition> = {
  cell_liquor: {
    id: "cell_liquor",
    name: "NaOH cell-liquor outlet",
    capacity: 30,
    hostRoomId: "lower_intake",
    accent: "#b06ddd",
  },
};

const roomGasJunction = (): GasJunctionDefinition => ({
  capacity: 18,
  includeRoomInventory: true,
  roomPortHeight: 0.72,
  sourceIds: [],
  bufferIds: [],
});

const roomLiquidJunction = (): LiquidJunctionDefinition => ({
  capacity: 18,
  includeRoomInventory: true,
  roomPortHeight: 0.12,
  sourceIds: [],
  bufferIds: [],
});

export const GAS_JUNCTIONS: Record<RoomId, GasJunctionDefinition> = {
  west_intake: roomGasJunction(),
  switchyard: roomGasJunction(),
  furnace: roomGasJunction(),
  reservoir: roomGasJunction(),
  gallery: roomGasJunction(),
  washlock: roomGasJunction(),
  lower_intake: {
    capacity: 22,
    includeRoomInventory: true,
    roomPortHeight: 0.72,
    sourceIds: [],
    bufferIds: ["anode_header", "cathode_header"],
  },
  core: {
    capacity: 24,
    includeRoomInventory: false,
    roomPortHeight: 0.72,
    sourceIds: ["starter_gas_header"],
    bufferIds: [],
  },
};

export const LIQUID_JUNCTIONS: Record<RoomId, LiquidJunctionDefinition> = {
  west_intake: roomLiquidJunction(),
  switchyard: roomLiquidJunction(),
  furnace: roomLiquidJunction(),
  reservoir: roomLiquidJunction(),
  gallery: roomLiquidJunction(),
  washlock: roomLiquidJunction(),
  lower_intake: {
    capacity: 24,
    includeRoomInventory: true,
    roomPortHeight: 0.12,
    sourceIds: [],
    bufferIds: ["cell_liquor"],
  },
  core: {
    capacity: 28,
    includeRoomInventory: false,
    roomPortHeight: 0.12,
    sourceIds: ["water_tank", "sodium_chloride_tank"],
    bufferIds: [],
  },
};
