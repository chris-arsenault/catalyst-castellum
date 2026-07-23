import { EQUIPMENT_IDS } from "../identifiers";
import type { EquipmentId, ProcessFamilyId } from "../types";
import { REACTION_DEFINITIONS } from "./chemistry";
import { EQUIPMENT_DEFINITIONS } from "./equipment";

/** Process-general accelerators stay available under every palette. */
export const ACCELERATOR_EQUIPMENT: readonly EquipmentId[] = [
  "gas_agitator",
  "wet_contactor",
  "thermal_coil",
];

/** The vessels a palette opens: every operation whose duties serve a palette family. */
export const paletteEquipment = (palette: readonly ProcessFamilyId[]): EquipmentId[] =>
  EQUIPMENT_IDS.filter((equipmentId) => {
    const operation = EQUIPMENT_DEFINITIONS[equipmentId].operation;
    if (!operation) return ACCELERATOR_EQUIPMENT.includes(equipmentId);
    return operation.duties.some((duty) =>
      duty.reactionIds.some((reactionId) =>
        palette.includes(REACTION_DEFINITIONS[reactionId].family)
      )
    );
  });
