import { describe, expect, it } from "vitest";
import { roomRing } from "./config";
import { DEFAULT_GAME_DEFINITION } from "./definition";
import { createScenarioGame, executeCommand } from "./simulation";
import { EQUIPMENT_IDS } from "./types";
import { WORLD_MAP } from "./config";
const ROOM_ORDER = Object.keys(WORLD_MAP.rooms);
import { gasConduitState, roomState } from "./world/instances";

const processState = () => {
  const state = executeCommand(createScenarioGame("cordon_41"), { type: "begin_level" }).state;
  const round = DEFAULT_GAME_DEFINITION.levels.cordon_41.rounds.at(-1);
  if (!round) throw new Error("Cordon 41 has no rounds.");
  state.campaign.roundIndex = DEFAULT_GAME_DEFINITION.levels.cordon_41.rounds.length - 1;
  state.availability = {
    towers: [...round.availability.towers],
    equipment: [...round.availability.equipment],
    gasLines: [...round.availability.gasLines],
    liquidLines: [...round.availability.liquidLines],
  };
  state.matter = 999;
  return state;
};

describe("simple conduit controls", () => {
  it("keeps the actuator adjustable during assault", () => {
    let state = processState();
    state = executeCommand(state, {
      type: "build_connection",
      kind: "gas_line",
      fromRoomId: "core",
      toRoomId: "furnace",
    }).state;
    state = executeCommand(state, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    }).state;
    state = executeCommand(state, { type: "start_assault" }).state;
    const result = executeCommand(state, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: false,
    });
    expect(result.accepted).toBe(true);
    expect(gasConduitState(result.state, "gas:core__furnace").enabled).toBe(false);
  });

  it("builds and dismantles only an empty physical conduit", () => {
    const state = executeCommand(createScenarioGame("claim_8_delta"), {
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
    let state = processState();
    state = executeCommand(state, {
      type: "build_connection",
      kind: "gas_line",
      fromRoomId: "furnace",
      toRoomId: "lower_intake",
    }).state;
    gasConduitState(state, "gas:furnace__lower_intake").gas.hydrogen = 1;
    const result = executeCommand(state, {
      type: "dismantle_connection",
      connectionId: "gas:furnace__lower_intake",
    });
    expect(result.accepted).toBe(false);
    expect(result.code).toBe("capacity");
  });
});

describe("equipment dismantling", () => {
  it("drains an installed machine's output ports before dismantling it", () => {
    let state = processState();
    state = executeCommand(state, {
      type: "install_equipment",
      roomId: "lower_intake",
      socketId: "socket_a",
      equipmentId: "membrane_cell",
    }).state;
    const anode = roomState(state, "lower_intake").equipment.socket_a?.operation?.outputs
      .anode_header;
    if (!anode || anode.phase !== "gas") throw new Error("Membrane cell anode is missing.");
    anode.gas.chlorine = 1;

    const loaded = executeCommand(state, {
      type: "dismantle_equipment",
      roomId: "lower_intake",
      socketId: "socket_a",
    });
    expect(loaded.accepted).toBe(false);
    expect(loaded.code).toBe("retained_inventory");

    anode.gas.chlorine = 0;
    const drained = executeCommand(state, {
      type: "dismantle_equipment",
      roomId: "lower_intake",
      socketId: "socket_a",
    });
    expect(drained.accepted).toBe(true);
    expect(roomState(drained.state, "lower_intake").equipment.socket_a).toBeNull();
  });
});

describe("derived rings and mixed exotic stock", () => {
  it("derives placement rings from central Core distance", () => {
    expect(roomRing("core")).toBe("core");
    expect(roomRing("lower_intake")).toBe("inner");
    expect(roomRing("gallery")).toBe("middle");
    expect(roomRing("furnace")).toBe("outer");
  });

  it("charges the site's conserved gas packet in its authored ratio", () => {
    const state = processState();
    const source = state.gasSources.gas_reservoir;
    if (!source) throw new Error("Morrow Pocket gas reservoir is missing.");
    source.gas.hydrogen = 0;
    source.gas.oxygen = 0;
    const result = executeCommand(state, {
      type: "charge_gas_source",
      sourceId: "gas_reservoir",
    });
    expect(result.accepted).toBe(true);
    const gas = result.state.gasSources.gas_reservoir!.gas;
    const supply = DEFAULT_GAME_DEFINITION.levels.cordon_41.supplies.find(
      (candidate) => candidate.id === "gas_reservoir"
    );
    if (!supply || supply.phase !== "gas") throw new Error("Gas supply definition is missing.");
    const replenishment = supply.replenishment.contents;
    expect(gas.hydrogen / gas.oxygen).toBeCloseTo(
      (replenishment.hydrogen ?? 0) / (replenishment.oxygen ?? 1),
      5
    );
    expect(Object.values(gas).reduce((total, amount) => total + amount, 0)).toBeCloseTo(
      supply.capacity,
      5
    );
  });

  it("prorates a conserved liquid charge and its Matter cost at reservoir capacity", () => {
    const state = processState();
    const source = state.liquidSources.liquid_reservoir_a;
    if (!source) throw new Error("Morrow Pocket liquid reservoir is missing.");
    for (const species of Object.keys(source.liquid)) {
      source.liquid[species as keyof typeof source.liquid] = 0;
    }
    source.liquid.water = 215;
    const matterBefore = state.matter;

    const result = executeCommand(state, {
      type: "charge_liquid_source",
      sourceId: "liquid_reservoir_a",
    });

    expect(result.accepted).toBe(true);
    expect(result.state.liquidSources.liquid_reservoir_a?.liquid.water).toBeCloseTo(220);
    expect(result.state.matter).toBe(matterBefore - 2);
    expect(result.state.events[0]).toMatchObject({
      code: "liquid_source_charged",
      parameters: { amount: 5, cost: 2 },
    });
  });
});

describe("universal equipment sockets", () => {
  it("accepts every equipment type in every standard room", () => {
    for (const roomId of ROOM_ORDER.filter(
      (candidate) => !["west_intake", "core"].includes(candidate)
    )) {
      for (const equipmentId of EQUIPMENT_IDS) {
        const entered = processState();
        for (const room of Object.values(entered.rooms)) {
          room.equipment.socket_a = null;
          room.equipment.socket_b = null;
        }
        entered.availability.equipment = [...EQUIPMENT_IDS];
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
