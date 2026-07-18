import { describe, expect, it } from "vitest";
import { REACTION_DEFINITIONS } from "../game/config";
import { ENEMY_TYPES, EQUIPMENT_IDS, REACTION_IDS } from "../game/types";
import {
  ENEMY_BESTIARY,
  EQUIPMENT_MANUAL,
  REACTION_MANUAL,
  equipmentForReaction,
  reactionMechanics,
} from "./manualContent";

describe("facility manual content", () => {
  it("covers every shipped enemy form with a field taxonomy and bestiary record", () => {
    expect(Object.keys(ENEMY_BESTIARY)).toEqual([...ENEMY_TYPES]);
    for (const enemyType of ENEMY_TYPES) {
      const entry = ENEMY_BESTIARY[enemyType];
      expect(entry.classification.length).toBeGreaterThan(10);
      expect(entry.habitat.length).toBeGreaterThan(15);
      expect(entry.blurb.length).toBeGreaterThan(180);
      expect(entry.fieldNote.length).toBeGreaterThan(40);
    }
  });

  it("covers every buildable machine with a field record and reaction links", () => {
    expect(Object.keys(EQUIPMENT_MANUAL)).toEqual([...EQUIPMENT_IDS]);
    for (const equipmentId of EQUIPMENT_IDS) {
      const entry = EQUIPMENT_MANUAL[equipmentId];
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
