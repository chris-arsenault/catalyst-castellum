import type { GraftPreview, GraftPreviewOption } from "../application/storeTypes";
import type { EnemyPathStep, FacilityPortalState, GameState, RoomId } from "../game/types";
import { evaluateCommand, findEnemyPathOnMap } from "../game/simulation";
import type { WorldMap } from "../game/world/map";
import { DEFAULT_GAME_DEFINITION as PACK } from "./defaultGame";

/**
 * The graft proposal a hardpoint opens (M5 decision: preview then confirm, like pipes).
 * Nothing is grafted here — Build dispatches `graft_module`, which re-derives the same
 * deterministic placement from the same frozen map.
 */
const graftOption = (
  game: GameState,
  hostRoomId: RoomId,
  hardpointId: string,
  moduleId: string
): GraftPreviewOption => {
  const template = PACK.modules[moduleId]!;
  const decision = evaluateCommand(game, {
    type: "graft_module",
    hostRoomId,
    hardpointId,
    moduleId,
  });
  return {
    moduleId,
    label: template.codePrefix,
    footprint: template.footprint,
    cost: template.graftCost,
    buildable: decision.allowed,
    reason: decision.allowed ? null : (decision.code ?? null),
  };
};

export const planGraftPreview = (
  game: GameState,
  hostRoomId: RoomId,
  hardpointId: string
): GraftPreview => ({
  hostRoomId,
  hardpointId,
  options: Object.keys(PACK.modules).map((moduleId) =>
    graftOption(game, hostRoomId, hardpointId, moduleId)
  ),
});

/** Every hardpoint on a hull room, with whether a graft already occupies it. */
export interface HardpointRef {
  hostRoomId: RoomId;
  hardpointId: string;
  hostCode: string;
  occupiedByRoomId: RoomId | null;
}

export const hullHardpoints = (game: GameState): HardpointRef[] => {
  const refs: HardpointRef[] = [];
  for (const room of Object.values(game.map.rooms)) {
    if (room.provenance !== "hull") continue;
    for (const hardpoint of room.hardpoints) {
      const jointId = `joint:${room.id}:${hardpoint.id}`;
      const joint = game.map.connections[jointId];
      const occupied = joint?.rooms.find((roomId) => roomId !== room.id) ?? null;
      refs.push({
        hostRoomId: room.id,
        hardpointId: hardpoint.id,
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
