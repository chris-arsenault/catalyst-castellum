import type { EquipmentDefinition, EquipmentId } from "../types";

export const EQUIPMENT_DEFINITIONS: Record<EquipmentId, EquipmentDefinition> = {
  gas_agitator: {
    id: "gas_agitator",
    accent: "#65cfc4",
    buildCost: 12,
    upgradeCosts: [10, 17],
    unique: false,
    operation: null,
    grades: [
      {
        level: 1,
        occupiedVolume: 3,
        behavior: { kind: "gas_agitator", layerExchangeRate: 1.5, reactionMultiplier: 1.5 },
      },
      {
        level: 2,
        occupiedVolume: 4,
        behavior: { kind: "gas_agitator", layerExchangeRate: 1.85, reactionMultiplier: 2.15 },
      },
      {
        level: 3,
        occupiedVolume: 5,
        behavior: { kind: "gas_agitator", layerExchangeRate: 2.2, reactionMultiplier: 3 },
      },
    ],
  },
  wet_contactor: {
    id: "wet_contactor",
    accent: "#5e92e3",
    buildCost: 14,
    upgradeCosts: [12, 20],
    unique: false,
    operation: null,
    grades: [
      {
        level: 1,
        occupiedVolume: 4,
        behavior: { kind: "wet_contactor", reactionMultiplier: 1 },
      },
      {
        level: 2,
        occupiedVolume: 5,
        behavior: { kind: "wet_contactor", reactionMultiplier: 1.45 },
      },
      {
        level: 3,
        occupiedVolume: 7,
        behavior: { kind: "wet_contactor", reactionMultiplier: 2 },
      },
    ],
  },
  thermal_coil: {
    id: "thermal_coil",
    accent: "#f58844",
    buildCost: 10,
    upgradeCosts: [9, 16],
    unique: false,
    operation: null,
    grades: [
      {
        level: 1,
        occupiedVolume: 3,
        behavior: { kind: "thermal_coil", targetTemperature: 68 },
      },
      {
        level: 2,
        occupiedVolume: 4,
        behavior: { kind: "thermal_coil", targetTemperature: 92 },
      },
      {
        level: 3,
        occupiedVolume: 5,
        behavior: { kind: "thermal_coil", targetTemperature: 120 },
      },
    ],
  },
  membrane_cell: {
    id: "membrane_cell",
    accent: "#c5f540",
    buildCost: 20,
    upgradeCosts: [17, 28],
    unique: true,
    operation: {
      kind: "reaction",
      duties: [{ medium: null, reactionIds: ["chlor_alkali_electrolysis"] }],
      outputs: [
        {
          id: "anode_header",
          phase: "gas",
          speciesId: "chlorine",
          capacity: 18,
          accent: "#c5f540",
          limitCode: "anode_headroom",
        },
        {
          id: "cathode_header",
          phase: "gas",
          speciesId: "hydrogen",
          capacity: 18,
          accent: "#f5a249",
          limitCode: "cathode_headroom",
        },
        {
          id: "cell_liquor",
          phase: "liquid",
          speciesId: "sodium_hydroxide",
          capacity: 30,
          accent: "#b555f5",
          limitCode: "outlet_headroom",
        },
      ],
      separatorBackflow: {
        leftOutputId: "anode_header",
        rightOutputId: "cathode_header",
        leftSpeciesId: "chlorine",
        rightSpeciesId: "hydrogen",
        activationDifference: 0.48,
        flowOffset: 0.42,
        rate: 0.16,
      },
    },
    grades: [
      {
        level: 1,
        occupiedVolume: 5,
        behavior: { kind: "electrolyzer", processRate: 0.56, powerDraw: 67 },
      },
      {
        level: 2,
        occupiedVolume: 6,
        behavior: { kind: "electrolyzer", processRate: 0.82, powerDraw: 98 },
      },
      {
        level: 3,
        occupiedVolume: 8,
        behavior: { kind: "electrolyzer", processRate: 1.12, powerDraw: 134 },
      },
    ],
  },
  fluorine_cell: {
    id: "fluorine_cell",
    accent: "#e5ef62",
    buildCost: 34,
    upgradeCosts: [27, 43],
    unique: true,
    operation: {
      kind: "reaction",
      duties: [{ medium: null, reactionIds: ["hydrogen_fluoride_electrolysis"] }],
      outputs: [],
      separatorBackflow: null,
    },
    grades: [
      {
        level: 1,
        occupiedVolume: 6,
        behavior: { kind: "electrolyzer", processRate: 0.3, powerDraw: 118 },
      },
      {
        level: 2,
        occupiedVolume: 8,
        behavior: { kind: "electrolyzer", processRate: 0.46, powerDraw: 172 },
      },
      {
        level: 3,
        occupiedVolume: 10,
        behavior: { kind: "electrolyzer", processRate: 0.66, powerDraw: 241 },
      },
    ],
  },
  catalytic_reactor: {
    id: "catalytic_reactor",
    accent: "#e0824f",
    buildCost: 18,
    upgradeCosts: [15, 24],
    unique: false,
    operation: {
      kind: "reaction",
      duties: [
        { medium: "iron_catalyst", reactionIds: ["ammonia_synthesis", "water_gas_shift"] },
        {
          medium: "surface_nickel",
          reactionIds: ["nickel_catalyzed_methanation", "methane_steam_reforming"],
        },
      ],
      outputs: [],
      separatorBackflow: null,
    },
    grades: [
      {
        level: 1,
        occupiedVolume: 5,
        behavior: { kind: "vessel", processRate: 0.35, powerDraw: 42 },
      },
      {
        level: 2,
        occupiedVolume: 6,
        behavior: { kind: "vessel", processRate: 0.55, powerDraw: 68 },
      },
      {
        level: 3,
        occupiedVolume: 8,
        behavior: { kind: "vessel", processRate: 0.8, powerDraw: 104 },
      },
    ],
  },
  packed_bed: {
    id: "packed_bed",
    accent: "#b0854a",
    buildCost: 14,
    upgradeCosts: [12, 20],
    unique: false,
    operation: {
      kind: "reaction",
      duties: [
        {
          medium: "solid_carbon",
          reactionIds: ["water_gas_reaction", "boudouard_reaction", "carbon_methanation"],
        },
        {
          medium: "hematite",
          reactionIds: [
            "hematite_carbon_monoxide_reduction",
            "hematite_hydrogen_reduction",
            "magnetite_reoxidation",
          ],
        },
        {
          medium: "nickel_oxide",
          reactionIds: [
            "nickel_oxide_reduction",
            "nickel_carbonyl_formation",
            "nickel_carbonyl_deposition",
            "nickel_deposit_oxidation",
          ],
        },
        { medium: "uranyl_fluoride", reactionIds: ["uranyl_fluoride_recovery"] },
      ],
      outputs: [],
      separatorBackflow: null,
    },
    grades: [
      {
        level: 1,
        occupiedVolume: 5,
        behavior: { kind: "vessel", processRate: 0.5, powerDraw: 22 },
      },
      {
        level: 2,
        occupiedVolume: 7,
        behavior: { kind: "vessel", processRate: 0.8, powerDraw: 36 },
      },
      {
        level: 3,
        occupiedVolume: 9,
        behavior: { kind: "vessel", processRate: 1.2, powerDraw: 56 },
      },
    ],
  },
  catalytic_burner: {
    id: "catalytic_burner",
    accent: "#f56262",
    buildCost: 16,
    upgradeCosts: [14, 22],
    unique: false,
    operation: {
      kind: "reaction",
      duties: [
        {
          medium: "platinum_catalyst",
          reactionIds: ["ammonia_oxidation", "nox_ammonia_reduction", "nitrous_oxide_side_path"],
        },
      ],
      outputs: [],
      separatorBackflow: null,
    },
    grades: [
      {
        level: 1,
        occupiedVolume: 4,
        behavior: { kind: "vessel", processRate: 0.4, powerDraw: 34 },
      },
      {
        level: 2,
        occupiedVolume: 5,
        behavior: { kind: "vessel", processRate: 0.6, powerDraw: 52 },
      },
      {
        level: 3,
        occupiedVolume: 7,
        behavior: { kind: "vessel", processRate: 0.9, powerDraw: 82 },
      },
    ],
  },
  absorber_column: {
    id: "absorber_column",
    accent: "#62aef5",
    buildCost: 12,
    upgradeCosts: [10, 16],
    unique: false,
    operation: {
      kind: "reaction",
      duties: [{ medium: null, reactionIds: ["nitrogen_dioxide_absorption"] }],
      outputs: [],
      separatorBackflow: null,
    },
    grades: [
      {
        level: 1,
        occupiedVolume: 4,
        behavior: { kind: "vessel", processRate: 0.5, powerDraw: 16 },
      },
      {
        level: 2,
        occupiedVolume: 5,
        behavior: { kind: "vessel", processRate: 0.75, powerDraw: 26 },
      },
      {
        level: 3,
        occupiedVolume: 6,
        behavior: { kind: "vessel", processRate: 1.1, powerDraw: 40 },
      },
    ],
  },
};

export const equipmentGrade = (equipmentId: EquipmentId, level: 1 | 2 | 3) =>
  EQUIPMENT_DEFINITIONS[equipmentId].grades[level - 1] as EquipmentDefinition["grades"][number];
