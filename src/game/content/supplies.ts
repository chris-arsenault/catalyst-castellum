import type {
  GasBufferDefinition,
  GasBufferId,
  GasSourceDefinition,
  GasSourceId,
  LiquidBufferDefinition,
  LiquidBufferId,
  LiquidSourceDefinition,
  LiquidSourceId,
} from "../types";

export const GAS_SOURCES: Record<GasSourceId, GasSourceDefinition> = {
  starter_gas_header: {
    id: "starter_gas_header",
    formula: "2 H₂(g) + O₂(g)",
    capacity: 150,
    infinite: true,
    initialGas: { hydrogen: 100, oxygen: 50 },
    chargeGas: { hydrogen: 20, oxygen: 10 },
    chargeCost: 8,
    hostRoomId: "core",
    accent: "#ed9a48",
  },
};

export const LIQUID_SOURCES: Record<LiquidSourceId, LiquidSourceDefinition> = {
  water_tank: {
    id: "water_tank",
    formula: "H₂O(l)",
    substance: "water",
    capacity: 180,
    initialAmount: 112,
    chargeAmount: 28,
    chargeCost: 7,
    hostRoomId: "core",
    accent: "#41baf5",
  },
  sodium_chloride_tank: {
    id: "sodium_chloride_tank",
    formula: "NaCl(aq)",
    substance: "sodium_chloride",
    capacity: 180,
    initialAmount: 112,
    chargeAmount: 28,
    chargeCost: 10,
    hostRoomId: "core",
    accent: "#60cce4",
  },
};

export const GAS_BUFFERS: Record<GasBufferId, GasBufferDefinition> = {
  anode_header: {
    id: "anode_header",
    capacity: 18,
    accent: "#c5f540",
  },
  cathode_header: {
    id: "cathode_header",
    capacity: 18,
    accent: "#f5a249",
  },
};

export const LIQUID_BUFFERS: Record<LiquidBufferId, LiquidBufferDefinition> = {
  cell_liquor: {
    id: "cell_liquor",
    capacity: 30,
    accent: "#b555f5",
  },
};
