import type { LineSpecs } from "../world/map";

/**
 * Parameters for player-built process lines. Authored connections keep their authored
 * numbers; anything the auto-router mints uses these. Cost scales with routed length.
 */
export const LINE_SPECS: LineSpecs = {
  gas_line: {
    actuator: "fan",
    actuatorHead: 1.5,
    maxFlow: 1.1,
    volumePerCell: 0.22,
    baseCost: 4,
    costPerCell: 0.08,
  },
  liquid_line: {
    actuator: "pump",
    actuatorHead: 24,
    maxFlow: 0.9,
    volumePerCell: 0.24,
    baseCost: 4,
    costPerCell: 0.08,
  },
};
