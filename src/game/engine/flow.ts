import type { GameState } from "../types";
import { simulateArchitecturalFlow } from "./architecturalFlow";
import { simulateGasConduits } from "./gasFlow";
import { refillLocalJunctions } from "./junctions";
import { simulateLiquidConduits } from "./liquidFlow";

export { gasConduitPressure } from "./gasFlow";
export { liquidConduitCrestElevation, liquidConduitFillRatio } from "./liquidFlow";

export const simulateNetworks = (state: GameState, dt: number): void => {
  simulateArchitecturalFlow(state, dt);
  refillLocalJunctions(state, dt);
  simulateGasConduits(state, dt);
  simulateLiquidConduits(state, dt);
};

export {
  simulateArchitecturalFlow,
  simulateArchitecturalGas,
  simulateArchitecturalLiquid,
} from "./architecturalFlow";
