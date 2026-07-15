import { architecturalConnections } from "../game/world/map";
import { GAS_TYPES, type GameState, type GasAmounts, type RoomId } from "../game/types";
import { gasConduitState, liquidConduitState } from "../game/world/instances";
import { lineDefinition } from "./defaultGame";

const emptyGasRates = (): GasAmounts =>
  Object.fromEntries(GAS_TYPES.map((species) => [species, 0])) as GasAmounts;

export interface RoomGasInflow {
  rate: number;
  species: GasAmounts;
}

export const roomGasInflow = (game: GameState, roomId: RoomId): RoomGasInflow => {
  const species = emptyGasRates();
  let rate = 0;
  for (const runId of game.world.connections) {
    const definition = lineDefinition(runId, "gas");
    if (!definition || definition.direction[1] !== roomId) continue;
    const conduit = gasConduitState(game, runId);
    if (conduit.flowCause !== "fan") continue;
    rate += Math.abs(conduit.lastFlow);
    for (const gas of GAS_TYPES) species[gas] += Math.abs(conduit.lastSpeciesFlow[gas]);
  }
  return { rate, species };
};

export const roomLiquidInflowRate = (game: GameState, roomId: RoomId): number =>
  game.world.connections.reduce((total: number, runId: string) => {
    const definition = lineDefinition(runId, "liquid");
    if (!definition || definition.direction[1] !== roomId) return total;
    const conduit = liquidConduitState(game, runId);
    return conduit.flowCause === "pump" ? total + Math.abs(conduit.lastFlow) : total;
  }, 0);

export const activeRoomGasPortals = (game: GameState, roomId: RoomId) =>
  architecturalConnections(game.map).filter((portal) => {
    const state = game.portalStates[portal.id];
    return (
      portal.rooms.includes(roomId) &&
      portal.gasConductance > 0 &&
      Boolean(state?.open && !state.sealed)
    );
  });
