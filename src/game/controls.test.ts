import { describe, expect, it } from "vitest";
import { GAS_SOURCES, roomRing } from "./config";
import { createScenarioGame, executeCommand } from "./simulation";
import { EQUIPMENT_IDS } from "./types";
import { WORLD_MAP } from "./config";
const ROOM_ORDER = Object.keys(WORLD_MAP.rooms);
import { gasConduitState } from "./world/instances";

describe("simple conduit controls", () => {
  it("locks the one actuator during assault", () => {
    let state = executeCommand(createScenarioGame("flash_point"), { type: "begin_level" }).state;
    state = executeCommand(state, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    }).state;
    state = executeCommand(state, { type: "start_prime" }).state;
    state = executeCommand(state, { type: "start_assault" }).state;
    const result = executeCommand(state, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: false,
    });
    expect(result.accepted).toBe(false);
    expect(gasConduitState(result.state, "gas:core__furnace").enabled).toBe(true);
  });

  it("builds and dismantles only an empty physical conduit", () => {
    const state = executeCommand(createScenarioGame("flash_point"), {
      type: "begin_level",
    }).state;
    state.availability.gasLines.push("gas:core__gallery");
    const built = executeCommand(state, {
      type: "build_connection",
      kind: "gas_line",
      fromRoomId: "core",
      toRoomId: "gallery",
    });
    expect(built.accepted).toBe(true);
    expect(built.state.gasConduits["gas:core__gallery"]).toBeDefined();
    const dismantled = executeCommand(built.state, {
      type: "dismantle_connection",
      connectionId: "gas:core__gallery",
    });
    expect(dismantled.accepted).toBe(true);
    expect(dismantled.state.gasConduits["gas:core__gallery"]).toBeUndefined();
  });

  it("rejects dismantling conserved retained material", () => {
    const state = executeCommand(createScenarioGame("make_the_reagent"), {
      type: "begin_level",
    }).state;
    state.availability.gasLines.push("gas:furnace__lower_intake");
    gasConduitState(state, "gas:furnace__lower_intake").gas.hydrogen = 1;
    const result = executeCommand(state, {
      type: "dismantle_connection",
      connectionId: "gas:furnace__lower_intake",
    });
    expect(result.accepted).toBe(false);
    expect(result.code).toBe("capacity");
  });
});

describe("derived rings and mixed exotic stock", () => {
  it("derives placement rings from central Core distance", () => {
    expect(roomRing("core")).toBe("core");
    expect(roomRing("lower_intake")).toBe("inner");
    expect(roomRing("gallery")).toBe("middle");
    expect(roomRing("furnace")).toBe("outer");
  });

  it("charges the authoritative starter mixture in its fixed ratio", () => {
    const state = executeCommand(createScenarioGame("flash_point"), { type: "begin_level" }).state;
    state.gasSources.starter_gas_header.gas.hydrogen = 0;
    state.gasSources.starter_gas_header.gas.oxygen = 0;
    const result = executeCommand(state, {
      type: "charge_gas_source",
      sourceId: "starter_gas_header",
    });
    expect(result.accepted).toBe(true);
    const gas = result.state.gasSources.starter_gas_header.gas;
    expect(gas.hydrogen / gas.oxygen).toBeCloseTo(2, 5);
    expect(gas.hydrogen + gas.oxygen).toBeCloseTo(
      Object.values(GAS_SOURCES.starter_gas_header.chargeGas).reduce(
        (total, value) => total + (value ?? 0),
        0
      ),
      5
    );
  });
});

describe("universal equipment sockets", () => {
  it("accepts every equipment type in every standard room", () => {
    for (const roomId of ROOM_ORDER.filter(
      (candidate) => !["west_intake", "core"].includes(candidate)
    )) {
      for (const equipmentId of EQUIPMENT_IDS) {
        const entered = executeCommand(createScenarioGame("commissioning_exam"), {
          type: "begin_level",
        }).state;
        for (const room of Object.values(entered.rooms)) {
          room.equipment.socket_a = null;
          room.equipment.socket_b = null;
        }
        entered.matter = 999;
        const result = executeCommand(entered, {
          type: "install_equipment",
          roomId,
          socketId: "socket_a",
          equipmentId,
        });

        expect(result.accepted, `${equipmentId} in ${roomId}: ${result.code}`).toBe(true);
      }
    }
  });
});
