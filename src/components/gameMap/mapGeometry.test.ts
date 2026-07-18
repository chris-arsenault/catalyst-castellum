import { describe, expect, it } from "vitest";
import { mapRenderResolution, MAX_RENDER_RESOLUTION } from "./mapGeometry";

describe("map render resolution", () => {
  it("honors high-density displays up to the map performance ceiling", () => {
    expect(mapRenderResolution(undefined)).toBe(1);
    expect(mapRenderResolution(1.5)).toBe(1.5);
    expect(mapRenderResolution(3)).toBe(MAX_RENDER_RESOLUTION);
  });
});
