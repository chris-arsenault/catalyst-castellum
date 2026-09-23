import { ENEMY_DEFINITIONS } from "../enemies";
import { TOWER_DEFINITIONS } from "../towers";
import type { CombatDefinition, EncounterDefinition, EncounterSpawn } from "../../encounter/types";
import type { EnemyType, TowerChassisId, TowerDefinition } from "../../types";
import { facilityModelForMap } from "../../world/derivedModel";
import { createHarkerExerciseMap } from "./harkerMap";

const harkerExerciseMap = createHarkerExerciseMap();

const deviceTower = (id: TowerChassisId, values: Partial<TowerDefinition>): TowerDefinition => ({
  ...structuredClone(TOWER_DEFINITIONS[id]),
  supply: null,
  upgrades: [],
  ...values,
});
const pressurePacket = (sourceId: "tower_flash" | "tower_caustic", pressure: number) => ({
  sourceId,
  channels: { atmosphere: 0, corrosion: 0, heat: 0, pressure, radiation: 0 },
});

/** Provisional proof coefficients; campaign authoring retains its existing mechanics. */
export const harkerCatalystCombat: CombatDefinition = {
  id: "harker-catalyst-combat",
  contentVersion: 1,
  tickSeconds: 0.1,
  towers: {
    flash_chamber: deviceTower("flash_chamber", {
      buildCost: 20,
      cadence: 0.8,
      attack: {
        strategy: "hitscan",
        projectileSpeed: 0,
        radius: 0,
        packets: [pressurePacket("tower_flash", 24)],
        controlEffects: [],
      },
    }),
    caustic_jet: deviceTower("caustic_jet", {
      buildCost: 20,
      cadence: 2,
      attack: {
        strategy: "projectile",
        projectileSpeed: 18,
        radius: 0,
        packets: [pressurePacket("tower_caustic", 6)],
        controlEffects: [],
      },
    }),
    carbon_burner: deviceTower("carbon_burner", { buildCost: 25 }),
    quench_coil: deviceTower("quench_coil", {
      buildCost: 20,
      range: 4,
      targetCap: 6,
      firingArc: 360,
      eligibleLayers: ["ground", "flying"],
      attack: { strategy: "area", projectileSpeed: 0, radius: 4, packets: [], controlEffects: [] },
    }),
    carbonyl_marker: deviceTower("carbonyl_marker", {
      buildCost: 25,
      range: 5,
      targetCap: 4,
      cadence: 1 / 1.5,
      targetPolicies: ["first", "strongest"],
      attack: {
        strategy: "hitscan",
        projectileSpeed: 0,
        radius: 0,
        packets: [],
        controlEffects: [],
      },
    }),
  },
  enemies: Object.fromEntries(
    (["deckmouth", "flintjack", "clatter", "splitback", "shear_jelly"] as const).map((id) => [
      id,
      { ...structuredClone(ENEMY_DEFINITIONS[id]), needsOxygen: false },
    ])
  ),
  mechanics: {
    kind: "catalyst",
    rules: {
      chargeCapacity: 100,
      chargeDecayPerSecond: 5,
      chargeDecayDelaySeconds: 1,
      movementFloor: 0.35,
      movementCeiling: 1.5,
    },
    susceptibility: { deckmouth: 1, flintjack: 1, clatter: 1, splitback: 1, shear_jelly: 0.5 },
    devices: {
      flash_chamber: { kind: "weapon", chargePerHit: 0 },
      caustic_jet: { kind: "weapon", chargePerHit: 20, projectileRadius: 0.3 },
      carbon_burner: { kind: "weapon", chargePerHit: 0 },
      quench_coil: {
        kind: "field",
        radius: 4,
        targetCap: 6,
        strength: 0.5,
        eligibleLayers: ["ground", "flying"],
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
        channel: "pressure",
        sourceId: "tower_discharge",
        eligibleLayers: ["ground", "flying"],
      },
    },
  },
};

const group = (
  type: EnemyType,
  count: number,
  interval: number,
  start = 5,
  routeId = "lower"
): EncounterSpawn[] =>
  Array.from({ length: count }, (_, index) => ({
    type,
    tick: start + index * interval,
    level: 20,
    routeId,
  }));
const waves: EncounterSpawn[][] = [
  group("deckmouth", 4, 35),
  group("deckmouth", 6, 25),
  [...group("deckmouth", 6, 8), ...group("splitback", 1, 35, 85)],
  [
    ...group("flintjack", 4, 40),
    ...group("clatter", 3, 35, 20, "upper"),
    ...group("shear_jelly", 2, 55, 60, "upper"),
  ],
  [
    ...group("deckmouth", 6, 8),
    ...group("splitback", 2, 22, 65),
    ...group("flintjack", 3, 22, 90, "upper"),
    ...group("shear_jelly", 3, 30, 110, "upper"),
  ],
];
const unlocked: TowerChassisId[][] = [
  ["flash_chamber", "carbon_burner"],
  ["flash_chamber", "carbon_burner", "caustic_jet", "carbonyl_marker"],
  ["flash_chamber", "carbon_burner", "caustic_jet", "carbonyl_marker", "quench_coil"],
];

export const harkerCatalystExercise = {
  id: "harker-catalyst",
  contentVersion: 1,
  waves: waves.map((wave, index): EncounterDefinition => ({
    id: `harker-catalyst:wave-${index + 1}`,
    contentVersion: 1,
    instanceNamespace: "harker-catalyst",
    map: harkerExerciseMap,
    wave: wave.sort((left, right) => left.tick - right.tick),
    availability: {
      towers: unlocked[Math.min(index, 2)]!,
      equipment: [],
      gasLines: [],
      liquidLines: [],
    },
    maximumTicks: 1800,
    startingMatter: 85,
    startingCoreIntegrity: 100,
    initialTowers: {},
    initialPortalStates: facilityModelForMap(harkerExerciseMap).initialPortalStates(),
    process: null,
  })),
};
