import { describe, expect, it } from "vitest";
import {
  enemyAnimationSpeed,
  enemySpritePose,
  enemySpriteUrl,
  enemySpriteVariant,
} from "./enemySprites";

describe("enemy sprite presentation", () => {
  it("selects the exposed Splitback animation only after its molt", () => {
    expect(
      enemySpriteVariant("splitback", {
        kind: "armored_molt",
        phase: "armored",
        transitionHealth: 115,
      })
    ).toBe("splitback");
    expect(
      enemySpriteVariant("splitback", {
        kind: "armored_molt",
        phase: "exposed",
        transitionHealth: 115,
      })
    ).toBe("splitback_exposed");
    expect(enemySpriteUrl("splitback_exposed")).toBe(
      "/sprites/enemies/splitback_exposed.sheet.png"
    );
  });

  it("gives quick and specialized forms visibly quicker animation rhythms", () => {
    const standard = { kind: "standard" } as const;
    expect(enemyAnimationSpeed("flintjack", "walking", standard)).toBeGreaterThan(
      enemyAnimationSpeed("splitback", "walking", standard)
    );
    expect(enemyAnimationSpeed("clatter", "climbing", { kind: "ladder_runner" })).toBeCloseTo(0.2);
    expect(
      enemyAnimationSpeed("splitback", "walking", {
        kind: "armored_molt",
        phase: "exposed",
        transitionHealth: 115,
      })
    ).toBeCloseTo(0.18);
  });

  it("rotates climbing sprites and lifts airborne sprites", () => {
    expect(enemySpritePose("climbing").rotation).toBe(-Math.PI / 2);
    expect(enemySpritePose("flying").y).toBeLessThan(enemySpritePose("walking").y);
    expect(enemySpritePose("door").scaleX).toBeLessThan(1);
  });
});
