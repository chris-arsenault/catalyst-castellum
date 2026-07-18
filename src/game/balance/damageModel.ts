import type { GameDefinition } from "../definitionTypes";
import { HAZARD_CHANNELS } from "../engine/damage";
import { ENEMY_TYPES, type EnemyType, type HazardChannels, type SpeciesId } from "../types";
import { solveLeastSquares, type LeastSquaresResult, type Matrix } from "./linearAlgebra";
import { routeProfile, type EnemyRouteProfile } from "./routeModel";

export const PRIMARY_DAMAGE_FAMILIES = [
  "ox1_flash",
  "chlorine_gas",
  "hydrogen_chloride_gas",
  "liquid_corrosion",
] as const;
export type PrimaryDamageFamily = (typeof PRIMARY_DAMAGE_FAMILIES)[number];
export const SECONDARY_DAMAGE_FAMILIES = ["asphyxiation", "thermal", "overpressure"] as const;
export const DAMAGE_FAMILIES = [...PRIMARY_DAMAGE_FAMILIES, ...SECONDARY_DAMAGE_FAMILIES] as const;
export type SecondaryDamageFamily = (typeof SECONDARY_DAMAGE_FAMILIES)[number];
export type DamageFamily = (typeof DAMAGE_FAMILIES)[number];

const FAMILY_SPECIES: Record<Exclude<DamageFamily, "ox1_flash" | "overpressure">, SpeciesId[]> = {
  chlorine_gas: ["chlorine"],
  hydrogen_chloride_gas: ["hydrogen_chloride"],
  liquid_corrosion: ["sodium_hydroxide", "sodium_hypochlorite", "hydrochloric_acid"],
  asphyxiation: ["oxygen", "carbon_dioxide"],
  thermal: ["steam"],
};
const REFERENCE_GAS_EXCESS = 0.04;
const REFERENCE_LIQUID_STRENGTH_EXCESS = 8;
const REFERENCE_TEMPERATURE_EXCESS = 40;
const REFERENCE_PRESSURE_RATIO_EXCESS = 0.3;

const emptyChannels = (): HazardChannels => ({
  atmosphere: 0,
  corrosion: 0,
  heat: 0,
  pressure: 0,
  radiation: 0,
});

const channelTotal = (channels: HazardChannels): number =>
  HAZARD_CHANNELS.reduce((total, channel) => total + channels[channel], 0);

const effectiveChannels = (channels: HazardChannels, multipliers: HazardChannels): HazardChannels =>
  Object.fromEntries(
    HAZARD_CHANNELS.map((channel) => [channel, channels[channel] * multipliers[channel]])
  ) as unknown as HazardChannels;

export const damageFamilyIncludesSpecies = (
  family: DamageFamily,
  speciesId: SpeciesId
): boolean => {
  if (family === "ox1_flash" || family === "overpressure") return false;
  return FAMILY_SPECIES[family].includes(speciesId);
};

const familyChannels = (family: DamageFamily, definition: GameDefinition): HazardChannels => {
  const channels = emptyChannels();
  if (family === "ox1_flash") {
    const behavior = definition.reactions.hydrogen_oxygen_combustion.behavior;
    if (behavior.kind !== "flash") throw new Error("OX-1 behavior is not a flash.");
    channels.pressure =
      behavior.pressureDamageBase + behavior.maximumExtent * behavior.pressureDamagePerExtent;
    channels.heat = behavior.maximumExtent * behavior.heatDamagePerExtent;
    return channels;
  }
  const speciesIds = family === "overpressure" ? [] : FAMILY_SPECIES[family];
  for (const speciesId of speciesIds) {
    for (const hazard of definition.species[speciesId].hazards) {
      const excess =
        hazard.basis === "gas_partial_ratio"
          ? REFERENCE_GAS_EXCESS
          : REFERENCE_LIQUID_STRENGTH_EXCESS;
      channels[hazard.channel] += hazard.rate * excess;
    }
  }
  if (family === "thermal") {
    channels.heat +=
      definition.environmentHazards.gasTemperature.rate * REFERENCE_TEMPERATURE_EXCESS;
  }
  if (family === "overpressure") {
    channels.pressure +=
      definition.environmentHazards.staticPressure.rate * REFERENCE_PRESSURE_RATIO_EXCESS;
  }
  return channels;
};

export interface ReferenceDamageProfile {
  family: DamageFamily;
  enemyType: EnemyType;
  rawChannels: HazardChannels;
  effectiveChannels: HazardChannels;
  referenceSeconds: number;
  damage: number;
}

const ordinaryRoomDwell = (route: EnemyRouteProfile): number => {
  const rooms = route.rooms.filter(({ roomId }) => roomId !== "west_intake" && roomId !== "core");
  const total = rooms.reduce((sum, room) => sum + room.drySeconds, 0);
  return total / Math.max(1, rooms.length);
};

const familyDamage = (
  family: DamageFamily,
  enemyType: EnemyType,
  effective: HazardChannels,
  seconds: number,
  definition: GameDefinition
): number => {
  const missesFloor = family === "liquid_corrosion" && definition.enemies[enemyType].flying;
  return missesFloor ? 0 : channelTotal(effective) * seconds;
};

export const referenceDamageProfiles = (definition: GameDefinition): ReferenceDamageProfile[] => {
  const routes = Object.fromEntries(
    ENEMY_TYPES.map((enemyType) => [
      enemyType,
      routeProfile("commissioning_exam", enemyType, definition),
    ])
  ) as Record<EnemyType, EnemyRouteProfile>;
  return DAMAGE_FAMILIES.flatMap((family) =>
    ENEMY_TYPES.map((enemyType) => {
      const rawChannels = familyChannels(family, definition);
      const effective = effectiveChannels(
        rawChannels,
        definition.enemies[enemyType].hazardMultipliers
      );
      const referenceSeconds = family === "ox1_flash" ? 1 : ordinaryRoomDwell(routes[enemyType]);
      return {
        family,
        enemyType,
        rawChannels,
        effectiveChannels: effective,
        referenceSeconds,
        damage: familyDamage(family, enemyType, effective, referenceSeconds, definition),
      };
    })
  );
};

const FIRST_ORDER_DECKMOUTH_TARGETS: Record<PrimaryDamageFamily, number> = {
  ox1_flash: 1.15,
  chlorine_gas: 1.25,
  hydrogen_chloride_gas: 1.1,
  liquid_corrosion: 1.2,
};
const REFERENCE_DECKMOUTH_HEALTH = 80;

export interface FirstOrderDamageSolve {
  families: PrimaryDamageFamily[];
  coefficients: Matrix;
  targets: number[];
  result: LeastSquaresResult;
  scales: Record<PrimaryDamageFamily, number>;
}

export const solveFirstOrderDamage = (definition: GameDefinition): FirstOrderDamageSolve => {
  const profiles = referenceDamageProfiles(definition);
  const coefficients = PRIMARY_DAMAGE_FAMILIES.map((family, row) =>
    PRIMARY_DAMAGE_FAMILIES.map((columnFamily, column) => {
      if (row !== column) return 0;
      return (
        profiles.find(
          (profile) => profile.family === columnFamily && profile.enemyType === "deckmouth"
        )?.damage ?? 0
      );
    })
  );
  const targets = PRIMARY_DAMAGE_FAMILIES.map(
    (family) => REFERENCE_DECKMOUTH_HEALTH * FIRST_ORDER_DECKMOUTH_TARGETS[family]
  );
  const result = solveLeastSquares(coefficients, targets, {
    ridge: 0.02,
    prior: PRIMARY_DAMAGE_FAMILIES.map(() => 1),
    minimum: 0.2,
    maximum: 5,
  });
  return {
    families: [...PRIMARY_DAMAGE_FAMILIES],
    coefficients,
    targets,
    result,
    scales: Object.fromEntries(
      PRIMARY_DAMAGE_FAMILIES.map((family, index) => [family, result.solution[index] ?? 1])
    ) as Record<PrimaryDamageFamily, number>,
  };
};

const ENCOUNTERS_TO_NEUTRALIZE: Record<EnemyType, Partial<Record<PrimaryDamageFamily, number>>> = {
  deckmouth: {
    ox1_flash: 0.95,
    chlorine_gas: 1,
    hydrogen_chloride_gas: 1.05,
    liquid_corrosion: 1.05,
  },
  flintjack: {
    ox1_flash: 0.8,
    chlorine_gas: 0.9,
    hydrogen_chloride_gas: 0.9,
    liquid_corrosion: 0.9,
  },
  shear_jelly: { ox1_flash: 1, chlorine_gas: 1.1, hydrogen_chloride_gas: 1.1 },
  splitback: {
    ox1_flash: 1.7,
    chlorine_gas: 1.6,
    hydrogen_chloride_gas: 1.8,
    liquid_corrosion: 1.15,
  },
  redlung: {
    ox1_flash: 1.4,
    chlorine_gas: 1.35,
    hydrogen_chloride_gas: 1.5,
    liquid_corrosion: 1.25,
  },
  clatter: {
    ox1_flash: 0.9,
    chlorine_gas: 0.95,
    hydrogen_chloride_gas: 1,
    liquid_corrosion: 1,
  },
  anchor: {
    ox1_flash: 0.85,
    chlorine_gas: 0.9,
    hydrogen_chloride_gas: 0.9,
    liquid_corrosion: 0.85,
  },
  glowbag: { ox1_flash: 0.95, chlorine_gas: 1, hydrogen_chloride_gas: 1 },
};

/** Absolute identity anchors remove scale drift when the workbook is rerun after applying a solve. */
const ENEMY_HEALTH_PRIOR: Record<EnemyType, number> = {
  deckmouth: 80,
  flintjack: 55,
  shear_jelly: 80,
  splitback: 155,
  redlung: 120,
  clatter: 70,
  anchor: 65,
  glowbag: 75,
};

export interface EnemyHealthSolve {
  enemyType: EnemyType;
  samples: Array<{ family: PrimaryDamageFamily; encounters: number; damage: number }>;
  result: LeastSquaresResult;
  solvedHealth: number;
}

export const solveEnemyHealth = (
  definition: GameDefinition,
  familyScales: Record<PrimaryDamageFamily, number>
): EnemyHealthSolve[] => {
  const profiles = referenceDamageProfiles(definition);
  return ENEMY_TYPES.map((enemyType) => {
    const samples = Object.entries(ENCOUNTERS_TO_NEUTRALIZE[enemyType]).map(
      ([family, encounters]) => {
        const typedFamily = family as PrimaryDamageFamily;
        const profile = profiles.find(
          (candidate) => candidate.family === typedFamily && candidate.enemyType === enemyType
        );
        return {
          family: typedFamily,
          encounters: encounters ?? 1,
          damage: (profile?.damage ?? 0) * familyScales[typedFamily] * (encounters ?? 1),
        };
      }
    );
    const result = solveLeastSquares(
      samples.map(() => [1]),
      samples.map(({ damage }) => damage),
      {
        ridge: 5,
        prior: [ENEMY_HEALTH_PRIOR[enemyType]],
        minimum: 30,
        maximum: 300,
      }
    );
    return {
      enemyType,
      samples,
      result,
      solvedHealth:
        Math.round((result.solution[0] ?? definition.enemies[enemyType].health) / 5) * 5,
    };
  });
};

export const TARGET_ROUTE_SECONDS: Record<EnemyType, number> = {
  deckmouth: 26,
  flintjack: 15,
  shear_jelly: 19,
  splitback: 36,
  redlung: 31,
  clatter: 25,
  anchor: 28,
  glowbag: 20,
};

export interface EnemySpeedSolve {
  enemyType: EnemyType;
  currentSpeed: number;
  currentRouteSeconds: number;
  targetRouteSeconds: number;
  solvedSpeed: number;
}

export const solveEnemySpeeds = (definition: GameDefinition): EnemySpeedSolve[] =>
  ENEMY_TYPES.map((enemyType) => {
    const route = routeProfile("commissioning_exam", enemyType, definition);
    const currentSpeed = definition.enemies[enemyType].speed;
    const targetRouteSeconds = TARGET_ROUTE_SECONDS[enemyType];
    const exact = (currentSpeed * route.drySeconds) / targetRouteSeconds;
    return {
      enemyType,
      currentSpeed,
      currentRouteSeconds: route.drySeconds,
      targetRouteSeconds,
      solvedSpeed: Math.round(exact / 0.005) * 0.005,
    };
  });
