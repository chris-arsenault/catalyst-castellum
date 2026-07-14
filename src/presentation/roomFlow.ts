import { FACILITY_MAP, TRANSPORT_RUNS } from "./defaultGame";
import {
  GAS_TYPES,
  TRANSPORT_RUN_IDS,
  type GameState,
  type GasAmounts,
  type RoomId,
} from "../game/types";

const emptyGasRates = (): GasAmounts =>
  Object.fromEntries(GAS_TYPES.map((species) => [species, 0])) as GasAmounts;

export interface RoomGasInflow {
  rate: number;
  species: GasAmounts;
}

export const roomGasInflow = (game: GameState, roomId: RoomId): RoomGasInflow => {
  const species = emptyGasRates();
  let rate = 0;
  for (const runId of TRANSPORT_RUN_IDS) {
    const definition = TRANSPORT_RUNS[runId].gas;
    if (!definition || definition.direction[1] !== roomId) continue;
    const conduit = game.gasConduits[runId];
    if (conduit.flowCause !== "fan") continue;
    rate += Math.abs(conduit.lastFlow);
    for (const gas of GAS_TYPES) species[gas] += Math.abs(conduit.lastSpeciesFlow[gas]);
  }
  return { rate, species };
};

export const roomLiquidInflowRate = (game: GameState, roomId: RoomId): number =>
  TRANSPORT_RUN_IDS.reduce((total, runId) => {
    const definition = TRANSPORT_RUNS[runId].liquid;
    if (!definition || definition.direction[1] !== roomId) return total;
    const conduit = game.liquidConduits[runId];
    return conduit.flowCause === "pump" ? total + Math.abs(conduit.lastFlow) : total;
  }, 0);

export const activeRoomGasPortals = (game: GameState, roomId: RoomId) =>
  FACILITY_MAP.portals.filter((portal) => {
    const state = game.portalStates[portal.id];
    return (
      portal.rooms.includes(roomId) &&
      portal.gasConductance > 0 &&
      Boolean(state?.open && !state.sealed)
    );
  });
