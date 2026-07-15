import type { EnemyDefinition, EnemyType, WaveEntry } from "../types";

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  crawler: {
    type: "crawler",
    health: 74,
    speed: 0.105,
    coreDamage: 10,
    needsOxygen: true,
    flying: false,
    hazardMultipliers: {
      atmosphere: 1.25,
      corrosion: 1,
      heat: 1,
      pressure: 1,
      radiation: 1,
    },
    color: "#e5c675",
    residueOnDeath: 3,
    matterYield: 5,
    presentation: { appearance: "crawler", manualIcon: "bug" },
  },
  skimmer: {
    type: "skimmer",
    health: 58,
    speed: 0.19,
    coreDamage: 8,
    needsOxygen: true,
    flying: false,
    hazardMultipliers: {
      atmosphere: 1,
      corrosion: 1,
      heat: 1.1,
      pressure: 0.9,
      radiation: 1,
    },
    color: "#f78f61",
    residueOnDeath: 2,
    matterYield: 5,
    presentation: { appearance: "skimmer", manualIcon: "wind" },
  },
  floater: {
    type: "floater",
    health: 72,
    speed: 0.145,
    coreDamage: 9,
    needsOxygen: true,
    flying: true,
    hazardMultipliers: {
      atmosphere: 1.15,
      corrosion: 1.05,
      heat: 1.2,
      pressure: 1.5,
      radiation: 1,
    },
    color: "#a07be4",
    residueOnDeath: 2,
    matterYield: 6,
    presentation: { appearance: "floater", manualIcon: "bird" },
  },
  shell: {
    type: "shell",
    health: 132,
    speed: 0.078,
    coreDamage: 16,
    needsOxygen: true,
    flying: false,
    hazardMultipliers: {
      atmosphere: 0.42,
      corrosion: 1.55,
      heat: 0.35,
      pressure: 1.15,
      radiation: 1,
    },
    color: "#8dafb2",
    residueOnDeath: 5,
    matterYield: 9,
    presentation: { appearance: "shell", manualIcon: "shield" },
  },
  bellows: {
    type: "bellows",
    health: 112,
    speed: 0.09,
    coreDamage: 14,
    needsOxygen: true,
    flying: false,
    hazardMultipliers: {
      atmosphere: 0.65,
      corrosion: 1.2,
      heat: 0.55,
      pressure: 1.25,
      radiation: 1,
    },
    color: "#e75667",
    residueOnDeath: 7,
    matterYield: 10,
    presentation: { appearance: "bellows", manualIcon: "snail" },
  },
};

export const enemySequence = (
  count: number,
  type: EnemyType,
  start: number,
  interval: number,
  healthScale = 1
): WaveEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    at: start + index * interval,
    type,
    routeId: "entry_to_core",
    healthScale,
  }));

export const COMMISSIONING_WAVES: WaveEntry[][] = [
  enemySequence(5, "crawler", 0.5, 2.6),
  [...enemySequence(5, "skimmer", 0.5, 2), ...enemySequence(2, "floater", 3, 3)].sort(
    (left, right) => left.at - right.at
  ),
  [...enemySequence(2, "bellows", 0.5, 4), ...enemySequence(3, "shell", 2, 3.2)].sort(
    (left, right) => left.at - right.at
  ),
];
