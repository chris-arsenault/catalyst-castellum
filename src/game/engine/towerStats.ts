import type { GameDefinition } from "../definitionTypes";
import type { GameState, TowerInstance } from "../types";
import {
  environmentalTowerCadenceMultiplier,
  environmentalTowerRangeMultiplier,
} from "./environmentalFields";

export interface EffectiveTowerStats {
  damageMultiplier: number;
  cadence: number;
  range: number;
  minimumRange: number;
  targetCap: number;
  firingArc: number;
}

export const effectiveTowerStats = (
  tower: TowerInstance,
  definition: GameDefinition,
  state?: GameState
): EffectiveTowerStats => {
  const chassis = definition.towers[tower.chassisId];
  const upgrades = tower.upgrades.flatMap((upgradeId) => {
    const upgrade = chassis.upgrades.find((candidate) => candidate.id === upgradeId);
    return upgrade ? [upgrade] : [];
  });
  const ceilingProjector =
    tower.chassisId === "line_projector" && tower.placement.mountFace === "ceiling";
  return {
    damageMultiplier: upgrades.reduce((value, upgrade) => value * upgrade.damageMultiplier, 1),
    cadence:
      chassis.cadence *
      upgrades.reduce((value, upgrade) => value * upgrade.cadenceMultiplier, 1) *
      (state ? environmentalTowerCadenceMultiplier(state, tower) : 1),
    range:
      (chassis.range + upgrades.reduce((value, upgrade) => value + upgrade.rangeDelta, 0)) *
      (ceilingProjector ? 0.72 : 1) *
      (state ? environmentalTowerRangeMultiplier(state, tower) : 1),
    minimumRange: chassis.minimumRange,
    targetCap:
      chassis.targetCap + upgrades.reduce((value, upgrade) => value + upgrade.targetCapDelta, 0),
    firingArc:
      chassis.firingArc +
      upgrades.reduce((value, upgrade) => value + upgrade.arcDelta, 0) +
      (ceilingProjector ? 42 : 0),
  };
};
