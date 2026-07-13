import type { GameState } from "../types";
import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import { simulateArchitecturalFlow } from "./architecturalFlow";
import { simulateGasConduits } from "./gasFlow";
import { refillLocalJunctions } from "./junctions";
import { simulateLiquidConduits } from "./liquidFlow";

export { gasConduitPressure } from "./gasFlow";
export { liquidConduitCrestElevation, liquidConduitFillRatio } from "./liquidFlow";

export const simulateNetworks = (
  state: GameState,
  dt: number,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
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
