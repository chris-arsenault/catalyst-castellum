import { describe, expect, it } from "vitest";
import { REACTION_DEFINITIONS } from "../game/config";
import { EQUIPMENT_IDS, REACTION_IDS } from "../game/types";
import {
  EQUIPMENT_MANUAL,
  REACTION_MANUAL,
  equipmentForReaction,
  reactionMechanics,
} from "./manualContent";

describe("facility manual content", () => {
  it("covers every buildable machine with an image, field record, and reaction links", () => {
    expect(Object.keys(EQUIPMENT_MANUAL)).toEqual([...EQUIPMENT_IDS]);
    for (const equipmentId of EQUIPMENT_IDS) {
      const entry = EQUIPMENT_MANUAL[equipmentId];
      expect(entry.image).toMatch(/^\/manual\/equipment\/.+\.webp$/);
      expect(entry.flavor.length).toBeGreaterThan(40);
      expect(entry.operationalNotes.length).toBeGreaterThanOrEqual(3);
      expect(entry.reactionIds.length).toBeGreaterThan(0);
    }
  });

  it("covers every simulated reaction with derived mechanics and linked equipment", () => {
    expect(Object.keys(REACTION_MANUAL)).toEqual([...REACTION_IDS]);
    for (const reactionId of REACTION_IDS) {
      const entry = REACTION_MANUAL[reactionId];
      expect(entry.doctrine.length).toBeGreaterThan(30);
      expect(entry.flavor.length).toBeGreaterThan(40);
      expect(reactionMechanics(REACTION_DEFINITIONS[reactionId]).length).toBeGreaterThanOrEqual(3);
      expect(equipmentForReaction(reactionId).length).toBeGreaterThan(0);
    }
  });
});
