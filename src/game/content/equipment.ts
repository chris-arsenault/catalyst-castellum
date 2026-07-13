import type { EquipmentDefinition, EquipmentId } from "../types";

export const EQUIPMENT_DEFINITIONS: Record<EquipmentId, EquipmentDefinition> = {
  gas_agitator: {
    id: "gas_agitator",
    name: "Gas agitator",
    description:
      "Recirculates both gas layers. It speeds every eligible gas reaction, including unwanted combustible mixtures.",
    accent: "#65cfc4",
    buildCost: 12,
    upgradeCosts: [10, 17],
    allowedRings: ["outer", "middle", "inner"],
    requiredFeature: null,
    unique: false,
    grades: [
      { level: 1, effect: "1.50 layer exchange · 1.5× gas kinetics", occupiedVolume: 3 },
      { level: 2, effect: "1.85 layer exchange · 2.15× gas kinetics", occupiedVolume: 4 },
      { level: 3, effect: "2.20 layer exchange · 3.0× gas kinetics", occupiedVolume: 5 },
    ],
  },
  wet_contactor: {
    id: "wet_contactor",
    name: "Wet contactor",
    description:
      "Increases gas–liquid contact and liquid mixing for every eligible reaction. It does not select a product.",
    accent: "#5e92e3",
    buildCost: 14,
    upgradeCosts: [12, 20],
    allowedRings: ["middle", "inner"],
    requiredFeature: null,
    unique: false,
    grades: [
      { level: 1, effect: "1.0× contact kinetics", occupiedVolume: 4 },
      { level: 2, effect: "1.45× contact kinetics", occupiedVolume: 5 },
      { level: 3, effect: "2.0× contact kinetics", occupiedVolume: 7 },
    ],
  },
  thermal_coil: {
    id: "thermal_coil",
    name: "Thermal coil",
    description:
      "Heats the room and both gas layers toward a fixed equipment rating. Chemistry still determines what reacts.",
    accent: "#f58844",
    buildCost: 10,
    upgradeCosts: [9, 16],
    allowedRings: ["outer", "middle", "inner"],
    requiredFeature: null,
    unique: false,
    grades: [
      { level: 1, effect: "68°C rated temperature", occupiedVolume: 3 },
      { level: 2, effect: "92°C rated temperature", occupiedVolume: 4 },
      { level: 3, effect: "120°C rated temperature", occupiedVolume: 5 },
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
    allowedRings: ["inner"],
    requiredFeature: "separated_cell_manifold",
    unique: true,
    grades: [
      { level: 1, effect: "0.56 mol-eq/s · 67 kW-eq", occupiedVolume: 5 },
      { level: 2, effect: "0.82 mol-eq/s · 98 kW-eq", occupiedVolume: 6 },
      { level: 3, effect: "1.12 mol-eq/s · 134 kW-eq", occupiedVolume: 8 },
    ],
  },
};

export const equipmentGrade = (equipmentId: EquipmentId, level: 1 | 2 | 3) =>
  EQUIPMENT_DEFINITIONS[equipmentId].grades[level - 1] as EquipmentDefinition["grades"][number];
