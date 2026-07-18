import { describe, expect, it } from "vitest";
import { EQUIPMENT_IDS } from "../../game/types";
import {
  MACHINE_SPRITE_DISPLAY_SIZE,
  machineAnimationSpeed,
  machineSpriteUrl,
} from "./machineSprites";

describe("machine sprite presentation", () => {
  it("maps every machine id directly to its illustrated sheet", () => {
    for (const equipmentId of EQUIPMENT_IDS) {
      expect(machineSpriteUrl(equipmentId)).toBe(`/sprites/machines/${equipmentId}.sheet.png`);
      expect(machineAnimationSpeed(equipmentId)).toBeGreaterThan(0);
      expect(machineAnimationSpeed(equipmentId)).toBeLessThan(0.12);
    }
  });

  it("uses a room-scale footprint instead of the former marker scale", () => {
    expect(MACHINE_SPRITE_DISPLAY_SIZE).toBeGreaterThan(96);
  });
});
