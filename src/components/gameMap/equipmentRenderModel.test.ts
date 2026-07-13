import { describe, expect, it } from "vitest";
import { FACILITY_MAP } from "../../game/config";
import { createScenarioGame } from "../../game/simulation";
import { gridCellMapRect } from "./mapGeometry";
import { equipmentRenderModels } from "./equipmentRenderModel";

describe("equipment map projection", () => {
  it("mounts installed equipment on the authored socket cell with state and grade", () => {
    const game = createScenarioGame("flash_point");
    game.rooms.furnace.equipment.socket_b = {
      equipmentId: "thermal_coil",
      enabled: false,
      level: 2,
    };
    const socket = FACILITY_MAP.rooms.furnace.socketCells.socket_b;
    if (!socket) throw new Error("R-02 socket B is absent from the facility map.");
    const rect = gridCellMapRect(socket);

    const marker = equipmentRenderModels(game).find(
      (entry) => entry.roomId === "furnace" && entry.socketId === "socket_b"
    );

    expect(marker).toMatchObject({
      code: "HEAT",
      enabled: false,
      equipmentId: "thermal_coil",
      level: 2,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  });
});
