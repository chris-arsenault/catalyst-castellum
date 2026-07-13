import { describe, expect, it } from "vitest";
import { ROOM_ORDER } from "../../game/config";
import { labelsOverlap, layoutMapLabels } from "./labelLayout";

describe("map label layout", () => {
  it("places room labels without collisions and preserves the selected label", () => {
    const labels = layoutMapLabels("furnace");
    expect(labelsOverlap(labels)).toBe(false);
    expect(labels.find(({ roomId }) => roomId === "furnace")).toMatchObject({ selected: true });
    expect(labels).toHaveLength(ROOM_ORDER.length);
  });

  it("adapts text or size when a full label cannot fit", () => {
    const labels = layoutMapLabels("west_intake");
    const narrow = labels.find(({ roomId }) => roomId === "west_intake");
    expect(narrow).toBeDefined();
    expect((narrow?.fontSize ?? 99) <= 17).toBe(true);
  });
});
