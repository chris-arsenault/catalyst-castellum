import type { GraftPreview, GraftPreviewOption } from "../application/storeTypes";
import type { EnemyPathStep, FacilityPortalState, GameState, RoomId } from "../game/types";
import { evaluateCommand, findEnemyPathOnMap } from "../game/simulation";
import type { WorldMap } from "../game/world/map";
import { DEFAULT_GAME_DEFINITION as PACK } from "./defaultGame";

/**
 * The graft proposal a graft slot opens; preview and execution share one plan.
 * Nothing is grafted here — Build dispatches `graft_module`, which re-derives the same
 * deterministic placement from the same frozen map.
 */
const graftOption = (
  game: GameState,
  hostRoomId: RoomId,
  graftSlotId: string,
  moduleId: string
): GraftPreviewOption => {
  const template = PACK.modules[moduleId]!;
  const decision = evaluateCommand(game, {
    type: "graft_module",
    hostRoomId,
    graftSlotId,
    moduleId,
  });
  return {
    moduleId,
    label: template.codePrefix,
    footprint: template.footprint,
    equipmentSlots: template.socketCount,
    cost: template.graftCost,
    buildable: decision.allowed,
    reason: decision.allowed ? null : (decision.code ?? null),
  };
};

export const planGraftPreview = (
  game: GameState,
  hostRoomId: RoomId,
  graftSlotId: string
): GraftPreview => ({
  hostRoomId,
  graftSlotId,
  options: Object.keys(PACK.modules).map((moduleId) =>
    graftOption(game, hostRoomId, graftSlotId, moduleId)
  ),
});

/** Every graft slot on a hull room, with whether a graft already occupies it. */
export interface GraftSlotRef {
  hostRoomId: RoomId;
  graftSlotId: string;
  hostCode: string;
  occupiedByRoomId: RoomId | null;
}

export const hullGraftSlots = (game: GameState): GraftSlotRef[] => {
  const refs: GraftSlotRef[] = [];
  for (const room of Object.values(game.map.rooms)) {
    if (room.provenance !== "hull") continue;
    for (const graftSlot of room.graftSlots) {
      const jointId = `joint:${room.id}:${graftSlot.id}`;
      const joint = game.map.connections[jointId];
      const occupied = joint?.rooms.find((roomId) => roomId !== room.id) ?? null;
      refs.push({
        hostRoomId: room.id,
        graftSlotId: graftSlot.id,
        hostCode: room.code,
        occupiedByRoomId: occupied,
      });
    }
  }
  return refs;
};

export const hullEnemyRoute = (
  map: WorldMap,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): EnemyPathStep[] => findEnemyPathOnMap({ flying: false, portalStates }, map);
