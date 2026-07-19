import { WORLD_MAP } from "../../game/content/worldMap";
import { describe, expect, it } from "vitest";
import { FACILITY_MAP } from "../../game/config";
import { createScenarioGame } from "../../game/simulation";
import { mapViewFor } from "./mapGeometry";
import { equipmentRenderModels } from "./equipmentRenderModel";
import { roomState } from "../../game/world/instances";
import { instance } from "../../game/world/instances";

describe("equipment map projection", () => {
  it("mounts installed equipment on the authored socket cell with state and grade", () => {
    const game = createScenarioGame("flash_point");
    roomState(game, "furnace").equipment.socket_b = {
      equipmentId: "thermal_coil",
      enabled: false,
      level: 2,
      operation: null,
    };
    const socket = instance(FACILITY_MAP.rooms, "furnace", "map room").socketCells.socket_b;
    if (!socket) throw new Error("R-02 socket B is absent from the facility map.");
    const rect = mapViewFor(WORLD_MAP).gridCellMapRect(socket);

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
