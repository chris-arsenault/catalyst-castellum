import { WORLD_MAP } from "../../game/content/worldMap";
import { describe, expect, it } from "vitest";
const ROOM_ORDER = Object.keys(WORLD_MAP.rooms);
import { labelsOverlap, layoutMapLabels } from "./labelLayout";

describe("map label layout", () => {
  it("places room labels without collisions and preserves the selected label", () => {
    const labels = layoutMapLabels(WORLD_MAP, "furnace");
    expect(labelsOverlap(labels)).toBe(false);
    expect(labels.find(({ roomId }) => roomId === "furnace")).toMatchObject({ selected: true });
    expect(labels).toHaveLength(ROOM_ORDER.length);
  });

  it("uses only the compact room code", () => {
    const labels = layoutMapLabels(WORLD_MAP, "west_intake");
    const narrow = labels.find(({ roomId }) => roomId === "west_intake");
    expect(narrow).toBeDefined();
    expect(narrow?.text).toBe(WORLD_MAP.rooms.west_intake?.code);
  });
});
