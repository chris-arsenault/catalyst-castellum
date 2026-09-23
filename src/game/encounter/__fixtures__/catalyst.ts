import { corridorCombat, corridorEncounter } from "./corridor";
import { createEncounter } from "../create";
import { createEncounterRuntime } from "../runtime";
import { spawnEnemies } from "../../engine/combat";
import type { CombatDefinition, EncounterDefinition } from "../types";
import type { TowerChassisId } from "../../types";

const chassis = corridorCombat.towers.flash_chamber!;

export const catalystCombat: CombatDefinition = {
  ...corridorCombat,
  id: "catalyst-conservation",
  enemies: { deckmouth: { ...corridorCombat.enemies.deckmouth!, health: 200 } },
  towers: {
    flash_chamber: chassis,
    quench_coil: { ...chassis, id: "quench_coil", upgrades: [] },
    carbonyl_marker: { ...chassis, id: "carbonyl_marker", upgrades: [] },
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
    susceptibility: { deckmouth: 1 },
    devices: {
      flash_chamber: { kind: "weapon", chargePerHit: 20 },
      quench_coil: {
        kind: "field",
        radius: 4,
        targetCap: 6,
        strength: 0.5,
        eligibleLayers: ["ground"],
        activationSeconds: 1,
        defaultMode: "attract",
      },
      carbonyl_marker: {
        kind: "discharge",
        radius: 5,
        seedThreshold: 60,
        secondaryThreshold: 20,
        linkDistance: 2.5,
        targetCap: 4,
        consumeCap: 60,
        damagePerCharge: 0.75,
        cooldownSeconds: 1.5,
        channel: "heat",
        sourceId: "tower_discharge",
        eligibleLayers: ["ground"],
      },
    },
  },
};

export const catalystFixture = (roles: TowerChassisId[] = ["flash_chamber", "carbonyl_marker"]) => {
  const definition: EncounterDefinition = {
    ...corridorEncounter,
    startingMatter: 100,
    availability: {
      ...corridorEncounter.availability,
      towers: ["flash_chamber", "quench_coil", "carbonyl_marker"],
    },
    wave: Array.from({ length: 4 }, () => ({
      tick: 0,
      type: "deckmouth",
      level: 20,
      routeId: "lane",
    })),
  };
  const context = { combat: catalystCombat, definition, process: null };
  const runtime = createEncounterRuntime(context);
  let state = createEncounter(catalystCombat, definition);
  for (const [index, chassisId] of roles.entries()) {
    const result = runtime.execute(state, {
      tick: 0,
      sequence: index,
      command: {
        type: "place_tower",
        chassisId,
        anchor: { column: 1, elevation: index + 1 },
        mountFace: "left_wall",
        orientation: "right",
      },
    });
    if (!result.decision.allowed) throw new Error(JSON.stringify(result.decision));
    state = result.state;
  }
  state.phase = "assault";
  state.tick = 1;
  state.elapsed = 0.1;
  state.phaseTime = 0.1;
  spawnEnemies(state, context);
  state.enemies.forEach((enemy, index) => {
    enemy.pathIndex = index;
  });
  return { state, context, runtime, towers: Object.values(state.towers) };
};
