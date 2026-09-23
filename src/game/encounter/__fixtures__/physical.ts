import { corridorCombat } from "./corridor";
import type { CombatDefinition } from "../types";

export const physicalCombat = (strategy: "projectile" | "lob", armor: number): CombatDefinition => {
  const combat: CombatDefinition = {
    ...corridorCombat,
    enemies: {
      deckmouth: {
        ...corridorCombat.enemies.deckmouth!,
        hazardMultipliers: {
          atmosphere: armor,
          corrosion: armor,
          heat: armor,
          pressure: armor,
          radiation: armor,
        },
      },
    },
    mechanics: {
      kind: "catalyst",
      rules: {
        chargeCapacity: 100,
        chargeDecayPerSecond: 5,
        chargeDecayDelaySeconds: 1,
        movementFloor: 0.35,
        movementCeiling: 1.5,
      },
      devices: {
        flash_chamber: { kind: "weapon", chargePerHit: 20, lobHeight: 1, projectileRadius: 0.2 },
      },
      susceptibility: { deckmouth: 1 },
    },
    towers: {
      flash_chamber: {
        ...corridorCombat.towers.flash_chamber!,
        attack: {
          ...corridorCombat.towers.flash_chamber!.attack,
          strategy,
          projectileSpeed: 10,
          radius: strategy === "lob" ? 1.5 : 0,
        },
      },
    },
  };
  return combat;
};
