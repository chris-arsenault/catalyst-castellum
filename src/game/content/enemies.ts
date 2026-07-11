import type { EnemyDefinition, EnemyType, RoomId, WaveEntry } from "../types";

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  crawler: {
    type: "crawler",
    name: "Crawler",
    description: "Baseline organic. Vulnerable to toxic gas and suffocation.",
    health: 82,
    speed: 0.115,
    coreDamage: 9,
    needsOxygen: true,
    flying: false,
    toxicMultiplier: 1.25,
    acidMultiplier: 1,
    causticMultiplier: 1.15,
    heatMultiplier: 1,
    color: "#d4be86",
    residueOnDeath: 3,
  },
  skimmer: {
    type: "skimmer",
    name: "Skimmer",
    description: "Fast organic. Punishes hazards that need time to become lethal.",
    health: 60,
    speed: 0.225,
    coreDamage: 7,
    needsOxygen: true,
    flying: false,
    toxicMultiplier: 1,
    acidMultiplier: 0.9,
    causticMultiplier: 1,
    heatMultiplier: 1.1,
    color: "#ec936c",
    residueOnDeath: 2,
  },
  floater: {
    type: "floater",
    name: "Floater",
    description: "Airborne enemy that ignores floor liquids and sludge.",
    health: 74,
    speed: 0.16,
    coreDamage: 8,
    needsOxygen: true,
    flying: true,
    toxicMultiplier: 1.2,
    acidMultiplier: 0,
    causticMultiplier: 0,
    heatMultiplier: 1.25,
    color: "#a58bd4",
    residueOnDeath: 2,
  },
  shell: {
    type: "shell",
    name: "Shell",
    description: "Armored mineral mass. Resists toxins; weak to acid and heat.",
    health: 170,
    speed: 0.085,
    coreDamage: 16,
    needsOxygen: true,
    flying: false,
    toxicMultiplier: 0.2,
    acidMultiplier: 1.8,
    causticMultiplier: 0.45,
    heatMultiplier: 1.45,
    color: "#88a0a2",
    residueOnDeath: 5,
  },
  bellows: {
    type: "bellows",
    name: "Bellows",
    description: "Consumes toxic gas and exhales CO₂, sabotaging prepared chambers.",
    health: 128,
    speed: 0.095,
    coreDamage: 14,
    needsOxygen: true,
    flying: false,
    toxicMultiplier: 0.6,
    acidMultiplier: 1,
    causticMultiplier: 1.2,
    heatMultiplier: 1.1,
    color: "#d16c78",
    residueOnDeath: 8,
  },
};

const upperRoute: RoomId[] = [
  "west_intake",
  "switchyard",
  "furnace",
  "gallery",
  "washlock",
  "core",
];

const crossRoute: RoomId[] = [
  "west_intake",
  "switchyard",
  "reservoir",
  "gallery",
  "washlock",
  "core",
];

const lowerRoute: RoomId[] = ["lower_intake", "reservoir", "gallery", "washlock", "core"];

const sequence = (
  count: number,
  type: EnemyType,
  start: number,
  interval: number,
  route: RoomId[]
): WaveEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    at: start + index * interval,
    type,
    route,
  }));

export const WAVES: Record<number, WaveEntry[]> = {
  1: [...sequence(9, "crawler", 0.5, 1.55, upperRoute)],
  2: [
    ...sequence(10, "skimmer", 0.5, 1.05, upperRoute),
    ...sequence(5, "crawler", 3, 2, lowerRoute),
  ].sort((a, b) => a.at - b.at),
  3: [
    ...sequence(8, "floater", 0.5, 1.35, upperRoute),
    ...sequence(8, "crawler", 2, 1.5, lowerRoute),
  ].sort((a, b) => a.at - b.at),
  4: [
    ...sequence(6, "shell", 0.5, 2.25, crossRoute),
    ...sequence(9, "skimmer", 2, 1.1, lowerRoute),
  ].sort((a, b) => a.at - b.at),
  5: [
    ...sequence(5, "bellows", 0.5, 2.2, upperRoute),
    ...sequence(6, "shell", 2, 2.1, lowerRoute),
    ...sequence(8, "skimmer", 5, 1, upperRoute),
  ].sort((a, b) => a.at - b.at),
};

export const WAVE_BRIEFS: Record<number, { title: string; detail: string }> = {
  1: {
    title: "Breath test",
    detail:
      "Nine crawlers enter through the west intake. Toxic gas and oxygen displacement are both effective.",
  },
  2: {
    title: "Split pressure",
    detail:
      "Fast skimmers arrive west while crawlers open the lower route. Prepare more than one room.",
  },
  3: {
    title: "Above the floodline",
    detail: "Floaters ignore floor liquids. Gas, steam, and heat must cover the upper route.",
  },
  4: {
    title: "Mineral shell",
    detail:
      "Armored shells cross toward the reservoir while skimmers pressure the lower intake. Acid and heat matter.",
  },
  5: {
    title: "System breakers",
    detail:
      "Bellows consume toxic gas and replace it with CO₂ ahead of shells and skimmers. Chain unlike hazards.",
  },
};
