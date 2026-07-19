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
  "carbon_monoxide",
  "nitrogen_chemistry",
  "nickel_carbonyl",
  "hydrogen_fluoride",
  "fluorine",
  "uranium_chemistry",
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
  carbon_monoxide: ["carbon_monoxide"],
  nitrogen_chemistry: ["ammonia", "nitric_oxide", "nitrogen_dioxide", "nitric_acid"],
  nickel_carbonyl: ["nickel_carbonyl"],
  hydrogen_fluoride: ["hydrogen_fluoride"],
  fluorine: ["fluorine"],
  uranium_chemistry: ["uranium_hexafluoride", "uranyl_fluoride"],
  asphyxiation: ["oxygen", "carbon_dioxide"],
  thermal: ["steam"],
};

interface FamilyReferenceExposure {
  gasPartialRatioExcess: number;
  liquidStrengthExcess: number;
  stationaryInventoryExcess: number;
}

/** Physically representative, family-specific chamber samples used by the static solve. */
export const FAMILY_REFERENCE_EXPOSURES: Record<DamageFamily, FamilyReferenceExposure> = {
  ox1_flash: { gasPartialRatioExcess: 0, liquidStrengthExcess: 0, stationaryInventoryExcess: 0 },
  chlorine_gas: {
    gasPartialRatioExcess: 0.008,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  hydrogen_chloride_gas: {
    gasPartialRatioExcess: 0.04,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  liquid_corrosion: {
    gasPartialRatioExcess: 0,
    liquidStrengthExcess: 2,
    stationaryInventoryExcess: 0,
  },
  carbon_monoxide: {
    gasPartialRatioExcess: 0.25,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  nitrogen_chemistry: {
    gasPartialRatioExcess: 0.08,
    liquidStrengthExcess: 2,
    stationaryInventoryExcess: 0,
  },
  nickel_carbonyl: {
    gasPartialRatioExcess: 0.006,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  hydrogen_fluoride: {
    gasPartialRatioExcess: 0.04,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  fluorine: {
    gasPartialRatioExcess: 0.035,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  uranium_chemistry: {
    gasPartialRatioExcess: 0.04,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 10,
  },
  asphyxiation: {
    gasPartialRatioExcess: 0.04,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  thermal: {
    gasPartialRatioExcess: 0.04,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
  overpressure: {
    gasPartialRatioExcess: 0,
    liquidStrengthExcess: 0,
    stationaryInventoryExcess: 0,
  },
};
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
  const exposure = FAMILY_REFERENCE_EXPOSURES[family];
  for (const speciesId of speciesIds) {
    for (const hazard of definition.species[speciesId].hazards) {
      const excess = {
        gas_partial_ratio: exposure.gasPartialRatioExcess,
        liquid_strength: exposure.liquidStrengthExcess,
        stationary_inventory: exposure.stationaryInventoryExcess,
      }[hazard.basis];
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
      routeProfile("morrow_pocket", enemyType, definition),
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
  ox1_flash: 1.4,
  chlorine_gas: 1.18,
  hydrogen_chloride_gas: 1.04,
  liquid_corrosion: 1.4,
  carbon_monoxide: 1.3,
  nitrogen_chemistry: 3.15,
  nickel_carbonyl: 1.3,
  hydrogen_fluoride: 1.25,
  fluorine: 1.4,
  uranium_chemistry: 1.4,
};
const REFERENCE_DECKMOUTH_HEALTH = 85;

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
    minimum: 0.05,
    maximum: 20,
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
    ox1_flash: 0.75,
    chlorine_gas: 0.8,
    hydrogen_chloride_gas: 0.83,
    liquid_corrosion: 0.83,
  },
  flintjack: {
    ox1_flash: 0.75,
    chlorine_gas: 0.84,
    hydrogen_chloride_gas: 0.84,
    liquid_corrosion: 0.84,
  },
  shear_jelly: { ox1_flash: 0.79, chlorine_gas: 0.87, hydrogen_chloride_gas: 0.87 },
  splitback: {
    ox1_flash: 1.29,
    chlorine_gas: 1.21,
    hydrogen_chloride_gas: 1.36,
    liquid_corrosion: 0.87,
  },
  redlung: {
    ox1_flash: 1.09,
    chlorine_gas: 1.05,
    hydrogen_chloride_gas: 1.16,
    liquid_corrosion: 0.97,
  },
  clatter: {
    ox1_flash: 0.71,
    chlorine_gas: 0.75,
    hydrogen_chloride_gas: 0.79,
    liquid_corrosion: 0.79,
  },
  anchor: {
    ox1_flash: 0.64,
    chlorine_gas: 0.68,
    hydrogen_chloride_gas: 0.68,
    liquid_corrosion: 0.64,
  },
  glowbag: { ox1_flash: 0.76, chlorine_gas: 0.8, hydrogen_chloride_gas: 0.8 },
};

/** Absolute identity anchors remove scale drift when the workbook is rerun after applying a solve. */
const ENEMY_HEALTH_PRIOR: Record<EnemyType, number> = {
  deckmouth: 85,
  flintjack: 55,
  shear_jelly: 85,
  splitback: 175,
  redlung: 130,
  clatter: 75,
  anchor: 75,
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
    const route = routeProfile("morrow_pocket", enemyType, definition);
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
