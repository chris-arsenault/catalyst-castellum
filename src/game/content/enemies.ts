import type { EnemyDefinition, EnemyType, WaveEntry } from "../types";

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  crawler: {
    type: "crawler",
    name: "Crawler",
    description: "Baseline oxygen-breathing organic with little environmental protection.",
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
    color: "#d4be86",
    residueOnDeath: 3,
    matterYield: 5,
  },
  skimmer: {
    type: "skimmer",
    name: "Skimmer",
    description:
      "Fast organic that can outrun a chlorine front still propagating through long lines.",
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
    color: "#ec936c",
    residueOnDeath: 2,
    matterYield: 5,
  },
  floater: {
    type: "floater",
    name: "Floater",
    description:
      "Airborne organism that avoids liquid contact but remains vulnerable to room gases.",
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
    color: "#a58bd4",
    residueOnDeath: 2,
    matterYield: 6,
  },
  shell: {
    type: "shell",
    name: "Shell",
    description: "Mineral armor resists atmospheric exposure but fails under corrosive liquids.",
    health: 132,
    speed: 0.078,
    coreDamage: 16,
    needsOxygen: true,
    flying: false,
    hazardMultipliers: {
      atmosphere: 0.42,
      corrosion: 1.55,
      heat: 1.45,
      pressure: 0.85,
      radiation: 1,
    },
    color: "#88a0a2",
    residueOnDeath: 5,
    matterYield: 9,
  },
  bellows: {
    type: "bellows",
    name: "Bellows",
    description:
      "Large respiratory volume resists atmosphere hazards but is vulnerable to corrosion and shock.",
    health: 112,
    speed: 0.09,
    coreDamage: 14,
    needsOxygen: true,
    flying: false,
    hazardMultipliers: {
      atmosphere: 0.65,
      corrosion: 1.2,
      heat: 1.1,
      pressure: 1.25,
      radiation: 1,
    },
    color: "#d16c78",
    residueOnDeath: 7,
    matterYield: 10,
  },
};

export const enemySequence = (
  count: number,
  type: EnemyType,
  start: number,
  interval: number
): WaveEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    at: start + index * interval,
    type,
    routeId: "entry_to_core",
  }));

export const COMMISSIONING_WAVES: WaveEntry[][] = [
  enemySequence(8, "crawler", 0.5, 1.7),
  [...enemySequence(8, "skimmer", 0.5, 1.15), ...enemySequence(4, "floater", 3, 2)].sort(
    (left, right) => left.at - right.at
  ),
  [...enemySequence(4, "bellows", 0.5, 2.5), ...enemySequence(5, "shell", 2, 2.3)].sort(
    (left, right) => left.at - right.at
  ),
];

export const COMMISSIONING_WAVE_BRIEFS = [
  {
    title: "Chlorine contact trial",
    detail:
      "Eight crawlers test whether acid and hypochlorite reach R-06 early enough to establish chlorine evolution.",
  },
  {
    title: "Residence-time trial",
    detail:
      "Skimmers and floaters punish long, under-filled headers and a contact room that acidifies too late.",
  },
  {
    title: "Corrosion balance trial",
    detail:
      "Gas-resistant bellows and armored shells require useful HCl, NaOH, and NaOCl exposure as well as Cl₂.",
  },
];
