import { GAS_TYPES, LIQUID_TYPES } from "../identifiers";
import type { EncounterState, EncounterTower } from "../encounter/types";
import { towerRoomId } from "./towerPlacement";

/** Dismantling transfers every stored species into the installation's current room. */
export const returnTowerInventory = (state: EncounterState, tower: EncounterTower): void => {
  const process = state.process;
  const inventory = process?.towerResources[tower.id];
  if (!process || !inventory) return;
  const roomId = towerRoomId(state, tower);
  const room = roomId ? process.rooms[roomId] : null;
  if (!room) throw new Error(`Tower ${tower.id} inventory requires its owning room`);
  for (const species of GAS_TYPES) room.gas.lower[species] += inventory.gas[species] ?? 0;
  for (const species of LIQUID_TYPES) room.liquid[species] += inventory.liquid[species] ?? 0;
};
