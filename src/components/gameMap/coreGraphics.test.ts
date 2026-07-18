import { Graphics } from "pixi.js";
import { describe, expect, it } from "vitest";
import { coreDamageProfile, coreIntegrityColor } from "./coreDamageModel";
import { drawCoreOverlay, type CoreDrawModel } from "./coreGraphics";

const coreModel = (coreIntegrity: number): CoreDrawModel => ({
  coreIntegrity,
  coreReservoirs: [
    { available: true, color: 0xed9a48, fill: 1, id: "gas_header" },
    { available: true, color: 0x41baf5, fill: 0.6, id: "water" },
    { available: true, color: 0x60cce4, fill: 0.4, id: "brine" },
  ],
  elapsed: 3,
  height: 256,
  selected: false,
  width: 288,
});

describe("mobile Core illustration state", () => {
  it("moves through distinct, increasingly damaged hull states", () => {
    expect(coreDamageProfile(100)).toMatchObject({ state: "stable", damageMarks: 0 });
    expect(coreDamageProfile(74)).toMatchObject({ state: "worn", damageMarks: 1 });
    expect(coreDamageProfile(49)).toMatchObject({ state: "critical", damageMarks: 3 });
    expect(coreDamageProfile(24)).toMatchObject({ state: "failing", damageMarks: 5 });
  });

  it("clamps integrity and uses the state color for the instrument readout", () => {
    expect(coreDamageProfile(120).integrity).toBe(1);
    expect(coreDamageProfile(-10).integrity).toBe(0);
    expect(coreIntegrityColor(20)).toBe(coreDamageProfile(20).alarmColor);
  });

  it("keeps live reservoir and integrity overlays inside the pre-rendered hull", () => {
    const graphics = new Graphics();
    const model = coreModel(42);
    drawCoreOverlay(graphics, model);
    const bounds = graphics.getLocalBounds();

    expect(bounds.width).toBeLessThan(model.width);
    expect(bounds.height).toBeLessThan(model.height);
  });
});
