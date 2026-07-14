import type { GameState } from "../types";
import type { GameDefinition } from "../definitionTypes";
import { simulateArchitecturalFlow } from "./architecturalFlow";
import { simulateGasConduits } from "./gasFlow";
import { refillLocalJunctions } from "./junctions";
import { simulateLiquidConduits } from "./liquidFlow";

export { gasConduitPressure } from "./gasFlow";
export { liquidConduitCrestElevation, liquidConduitFillRatio } from "./liquidFlow";

export const simulateNetworks = (
  state: GameState,
  dt: number,
  definition: GameDefinition
): void => {
  simulateArchitecturalFlow(state, dt, definition);
  refillLocalJunctions(state, dt, definition);
  simulateGasConduits(state, dt, definition);
  simulateLiquidConduits(state, dt, definition);
};

export {
  simulateArchitecturalFlow,
  simulateArchitecturalGas,
  simulateArchitecturalLiquid,
} from "./architecturalFlow";
