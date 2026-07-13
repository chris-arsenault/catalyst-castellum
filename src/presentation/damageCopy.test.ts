import { describe, expect, it } from "vitest";
import { damageChannelStyle, damageSourceLabel, dominantDamageChannel } from "./damageCopy";

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
    expect(damageChannelStyle[channel]).toEqual({ color: "#ff755c", label: "HEAT" });
    expect(damageSourceLabel.hydrogen_oxygen_combustion).toBe("OX-1 flash");
  });

  it("gives every damage channel a distinct color", () => {
    const colors = Object.values(damageChannelStyle).map(({ color }) => color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
