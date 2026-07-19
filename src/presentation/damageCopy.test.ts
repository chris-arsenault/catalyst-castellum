import { describe, expect, it } from "vitest";
import {
  damageChannelStyle,
  damageSourceDisplay,
  damageSourceLabel,
  dominantDamageChannel,
  formatDamageAmount,
} from "./damageCopy";

describe("damage presentation", () => {
  it("labels the dominant damage type independently from its source", () => {
    const channel = dominantDamageChannel({
      atmosphere: 2,
      corrosion: 4,
      heat: 19,
      pressure: 12,
      radiation: 0,
    });

    expect(channel).toBe("heat");
    expect(damageChannelStyle[channel]).toEqual({ color: "#ff755c", label: "THERMAL" });
    expect(damageSourceLabel.hydrogen_oxygen_combustion).toBe("OX-1 flash");
    expect(damageSourceLabel.thermal_exposure).toBe("hot gas exposure");
    expect(damageSourceLabel.hydrogen_fluoride).toBe("hydrogen fluoride");
    expect(damageSourceLabel.uranium_chemistry).toBe("uranium chemistry");
  });

  it("gives every damage channel a distinct color", () => {
    const colors = Object.values(damageChannelStyle).map(({ color }) => color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("keeps fractional damage exact and separates continuous exposure from impacts", () => {
    expect(formatDamageAmount(0.36)).toBe("0.36");
    expect(formatDamageAmount(1.04)).toBe("1");
    expect(formatDamageAmount(18.8)).toBe("19");
    expect(damageSourceDisplay.thermal_exposure).toBe("continuous");
    expect(damageSourceDisplay.fluorine).toBe("continuous");
    expect(damageSourceDisplay.hydrogen_oxygen_combustion).toBe("impact");
  });
});
