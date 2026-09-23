import type { GameRuntime } from "../game/runtime";
import type { TowerChassisId, TowerMountFace } from "../game/types";
import { preferredOrientationForMount } from "./towerCopy";

/** All definition-sensitive tower displays share the runtime that evaluates their commands. */
export const createTowerPresentation = (runtime: GameRuntime) => {
  const definition = (chassisId: TowerChassisId) => runtime.definition.towers[chassisId];
  const defaultOrientationForMount = (chassisId: TowerChassisId, mountFace: TowerMountFace) =>
    preferredOrientationForMount(definition(chassisId).orientations, mountFace);
  return Object.freeze({
    definition,
    stats: runtime.queries.effectiveTowerStats,
    coversPoint: runtime.queries.towerCoversPoint,
    defaultOrientationForMount,
    defaultPlacement: (chassisId: TowerChassisId) => {
      const mountFace = definition(chassisId).mountFaces[0]!;
      return {
        chassisId,
        mountFace,
        orientation: defaultOrientationForMount(chassisId, mountFace),
      };
    },
    packetDamage: (chassisId: TowerChassisId): number =>
      definition(chassisId).attack.packets.reduce(
        (total, packet) =>
          total + Object.values(packet.channels).reduce((sum, amount) => sum + amount, 0),
        0
      ),
  });
};

export type TowerPresentation = ReturnType<typeof createTowerPresentation>;
