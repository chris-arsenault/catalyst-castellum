import { describe, expect, it } from "vitest";
import { enemyPoseModel } from "./enemyGraphics";

describe("enemy locomotion rendering model", () => {
  it("maps engine movement modes to visibly distinct grounded poses", () => {
    expect(enemyPoseModel("walking")).toEqual({ groundedShadow: true, stance: "walk" });
    expect(enemyPoseModel("climbing")).toEqual({ groundedShadow: true, stance: "climb" });
    expect(enemyPoseModel("door")).toEqual({ groundedShadow: true, stance: "brace" });
    expect(enemyPoseModel("falling")).toEqual({ groundedShadow: false, stance: "fall" });
    expect(enemyPoseModel("flying")).toEqual({ groundedShadow: false, stance: "fly" });
  });
});
