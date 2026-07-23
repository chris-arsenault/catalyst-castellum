import type { Texture } from "pixi.js";
import type { EquipmentId } from "../../game/types";
import { loadSpriteTextures } from "./spriteTextures";

export const MACHINE_SPRITE_FRAME_COUNT = 8;
export const MACHINE_SPRITE_SOURCE_SIZE = 256;
export const MACHINE_SPRITE_DISPLAY_SIZE = 108;

export const machineSpriteUrl = (equipmentId: EquipmentId): string =>
  `/sprites/machines/${equipmentId}.sheet.png`;

export const loadMachineSpriteTextures = (equipmentId: EquipmentId): Promise<Texture[]> =>
  loadSpriteTextures(
    machineSpriteUrl(equipmentId),
    MACHINE_SPRITE_FRAME_COUNT,
    MACHINE_SPRITE_SOURCE_SIZE
  );

export const machineAnimationSpeed = (equipmentId: EquipmentId): number => {
  const speeds: Record<EquipmentId, number> = {
    gas_agitator: 0.1,
    membrane_cell: 0.065,
    thermal_coil: 0.06,
    wet_contactor: 0.055,
    fluorine_cell: 0.07,
    catalytic_reactor: 0.06,
    packed_bed: 0.05,
    catalytic_burner: 0.09,
    absorber_column: 0.055,
  };
  return speeds[equipmentId];
};
