import type { EquipmentDefinition, EquipmentId } from "../types";

export const EQUIPMENT_DEFINITIONS: Record<EquipmentId, EquipmentDefinition> = {
  gas_agitator: {
    id: "gas_agitator",
    name: "Gas agitator",
    description:
      "Recirculates the upper and lower gas layers, accelerating eligible gas reactions and combustible mixtures.",
    accent: "#65cfc4",
    buildCost: 12,
    upgradeCosts: [10, 17],
    unique: false,
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
    name: "Wet contactor",
    description:
      "Drives gas–liquid contact and liquid mixing, accelerating every eligible contact reaction.",
    accent: "#5e92e3",
    buildCost: 14,
    upgradeCosts: [12, 20],
    unique: false,
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
    name: "Thermal coil",
    description:
      "Heats the room and both gas layers toward a fixed equipment rating, accelerating temperature-dependent chemistry.",
    accent: "#f58844",
    buildCost: 10,
    upgradeCosts: [9, 16],
    unique: false,
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
    name: "Membrane cell",
    description:
      "Electrolyzes NaCl and water into separated Cl₂, H₂, and NaOH outlets at its installed grade.",
    accent: "#c5f540",
    buildCost: 20,
    upgradeCosts: [17, 28],
    unique: true,
    grades: [
      {
        level: 1,
        occupiedVolume: 5,
        behavior: { kind: "membrane_cell", processRate: 0.56, powerDraw: 67 },
      },
      {
        level: 2,
        occupiedVolume: 6,
        behavior: { kind: "membrane_cell", processRate: 0.82, powerDraw: 98 },
      },
      {
        level: 3,
        occupiedVolume: 8,
        behavior: { kind: "membrane_cell", processRate: 1.12, powerDraw: 134 },
      },
    ],
  },
};

export const equipmentGrade = (equipmentId: EquipmentId, level: 1 | 2 | 3) =>
  EQUIPMENT_DEFINITIONS[equipmentId].grades[level - 1] as EquipmentDefinition["grades"][number];
