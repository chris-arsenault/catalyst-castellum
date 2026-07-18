import { describe, expect, it } from "vitest";
import type { CoreDamageState } from "./coreDamageModel";
import {
  CORE_SPRITE_DISPLAY_SIZE,
  CORE_SPRITE_FRAME_COUNT,
  CORE_SPRITE_SOURCE_SIZE,
  coreSpriteUrl,
} from "./coreSprites";

describe("Core sprite presentation", () => {
  it("maps every integrity state to its illustrated animation sheet", () => {
    const states: CoreDamageState[] = ["stable", "worn", "critical", "failing"];
    for (const state of states) {
      expect(coreSpriteUrl(state)).toBe(`/sprites/core/${state}.sheet.png`);
    }
  });

  it("uses eight high-resolution frames at the authored map footprint", () => {
    expect(CORE_SPRITE_FRAME_COUNT).toBe(8);
    expect(CORE_SPRITE_SOURCE_SIZE).toBe(CORE_SPRITE_DISPLAY_SIZE * 2);
    expect(CORE_SPRITE_DISPLAY_SIZE).toBeGreaterThan(320);
  });
});
