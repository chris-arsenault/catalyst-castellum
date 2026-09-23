import type { ProcessSimulationDefinition, ProcessEncounterState } from "../encounter/processTypes";
import { simulateArchitecturalFlow } from "./architecturalFlow";
import { simulateGasConduits } from "./gasFlow";
import { refillLocalJunctions } from "./junctions";
import { simulateLiquidConduits } from "./liquidFlow";

export { gasConduitPressure } from "./gasFlow";
export { liquidConduitCrestElevation, liquidConduitFillRatio } from "./liquidFlow";

export const simulateNetworks = (
  state: ProcessEncounterState,
  dt: number,
  definition: ProcessSimulationDefinition
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
