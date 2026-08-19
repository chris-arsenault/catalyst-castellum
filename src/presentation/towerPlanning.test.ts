import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { defaultPlacement } from "./towerCopy";
import { createTowerPlanning, towerMountWorldPoint } from "./towerPlanning";

const enteredScenario = (scenarioId: Parameters<typeof DEFAULT_GAME_RUNTIME.createScenario>[0]) =>
  DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario(scenarioId), {
    type: "begin_level",
  }).state;

describe("tower surface planning", () => {
  it("defaults wall-mounted defenses toward the room", () => {
    expect(defaultPlacement("carbon_burner")).toEqual({
      chassisId: "carbon_burner",
      mountFace: "left_wall",
      orientation: "right",
    });
  });
  it("infers the physical wall and inward aim from wall placement mode", () => {
    const entered = enteredScenario("harkers_brace");
    const room = entered.map.rooms.switchyard;
    if (!room) throw new Error("Harker's Brace has no switchyard.");
    const preview = createTowerPlanning(DEFAULT_GAME_RUNTIME).planPlacement(
      entered,
      {
        x: room.bounds.column + room.bounds.width,
        elevation: room.bounds.elevation + 3.5,
      },
      "carbon_burner",
      "right"
    );
    if (!preview) throw new Error("The right wall did not produce a placement preview.");

    expect(preview.anchor).toEqual({
      column: room.bounds.column + room.bounds.width - 1,
      elevation: room.bounds.elevation + 3,
    });
    expect(preview.mountFace).toBe("right_wall");
    expect(preview.orientation).toBe("left");
    expect(preview.allowed).toBe(true);
  });
  it("infers a wall for a chassis whose default mount is the floor", () => {
    const entered = enteredScenario("claim_8_delta");
    const room = entered.map.rooms.switchyard;
    if (!room) throw new Error("Claim 8-Delta has no switchyard.");
    const preview = createTowerPlanning(DEFAULT_GAME_RUNTIME).planPlacement(
      entered,
      {
        x: room.bounds.column,
        elevation: room.bounds.elevation + 3.5,
      },
      "flash_chamber",
      "right"
    );

    expect(preview?.mountFace).toBe("left_wall");
    expect(preview?.orientation).toBe("right");
    expect(preview?.allowed).toBe(true);
  });
  it("does not draw a fallback floor mount in open room space", () => {
    const entered = enteredScenario("harkers_brace");
    const room = entered.map.rooms.switchyard;
    if (!room) throw new Error("Harker's Brace has no switchyard.");
    const preview = createTowerPlanning(DEFAULT_GAME_RUNTIME).planPlacement(
      entered,
      {
        x: room.bounds.column + room.bounds.width / 2,
        elevation: room.bounds.elevation + room.bounds.height / 2,
      },
      "carbon_burner",
      "right"
    );

    expect(preview).toBeNull();
  });
});

describe("tower mount geometry", () => {
  it("locates tower chassis mounts on their selected surfaces", () => {
    expect(
      towerMountWorldPoint({
        anchor: { column: 6, elevation: 8 },
        mountFace: "left_wall",
      })
    ).toEqual({ x: 6, elevation: 8.5 });
    expect(
      towerMountWorldPoint({
        anchor: { column: 15, elevation: 11 },
        mountFace: "ceiling",
      })
    ).toEqual({ x: 15.5, elevation: 12 });
  });
});
