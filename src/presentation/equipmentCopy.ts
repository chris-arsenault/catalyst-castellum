import type { EquipmentGradeDefinition } from "../game/types";

const decimal = (value: number): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 1 });

export const equipmentGradeEffect = (grade: EquipmentGradeDefinition): string => {
  const behavior = grade.behavior;
  switch (behavior.kind) {
    case "gas_agitator":
      return `${decimal(behavior.layerExchangeRate)} layer exchange · ${decimal(
        behavior.reactionMultiplier
      )}× gas kinetics`;
    case "wet_contactor":
      return `${decimal(behavior.reactionMultiplier)}× contact kinetics`;
    case "thermal_coil":
      return `${behavior.targetTemperature}°C rated temperature`;
    case "membrane_cell":
      return `${behavior.processRate.toFixed(2)} mol-eq/s · ${behavior.powerDraw} kW-eq`;
  }
};
