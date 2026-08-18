import { describe, expect, it } from "vitest";
import { encodeGame, decodeGame } from "./save";
import { createScenarioGame, executeCommand, validateGameState } from "./simulation";
import { DEFAULT_GAME_RUNTIME } from "./runtime";
import { gasConduitState, roomState } from "./world/instances";
import { LEVEL_IDS } from "./types";

const conduitScenario = () => {
  const state = createScenarioGame("cordon_41");
  state.phase = "build";
  state.matter = 999;
  const round = DEFAULT_GAME_RUNTIME.definition.levels.cordon_41.rounds.at(-1);
  if (!round) throw new Error("Cordon 41 has no rounds.");
  state.campaign.roundIndex = DEFAULT_GAME_RUNTIME.definition.levels.cordon_41.rounds.length - 1;
  state.availability = {
    towers: [...round.availability.towers],
    equipment: [...round.availability.equipment],
    gasLines: [...round.availability.gasLines],
    liquidLines: [...round.availability.liquidLines],
  };
  const built = executeCommand(state, {
    type: "build_connection",
    kind: "gas_line",
    fromRoomId: "core",
    toRoomId: "furnace",
  });
  if (!built.accepted) throw new Error(`Could not build validation conduit: ${built.code}`);
  return built.state;
};

describe("semantic game-state validation", () => {
  it("accepts every authored scenario", () => {
    for (const levelId of LEVEL_IDS) {
      expect(validateGameState(createScenarioGame(levelId))).toEqual([]);
    }
  });

  it("rejects empty, disconnected, and out-of-bounds conduit routes", () => {
    const empty = conduitScenario();
    gasConduitState(empty, "gas:core__furnace").route = [];
    expect(decodeGame(encodeGame(empty))).toBeNull();

    const disconnected = conduitScenario();
    gasConduitState(disconnected, "gas:core__furnace").route.splice(1, 0, {
      column: 0,
      elevation: 0,
    });
    expect(decodeGame(encodeGame(disconnected))).toBeNull();

    const outOfBounds = conduitScenario();
    gasConduitState(outOfBounds, "gas:core__furnace").route[0] = { column: -1, elevation: 0 };
    expect(decodeGame(encodeGame(outOfBounds))).toBeNull();
  });

  it("rejects cross-field campaign and room identity mismatches", () => {
    const campaign = createScenarioGame("claim_8_delta");
    campaign.campaign.levelIndex = 3;
    expect(decodeGame(encodeGame(campaign))).toBeNull();

    const room = createScenarioGame("claim_8_delta");
    roomState(room, "furnace").id = "washlock";
    expect(decodeGame(encodeGame(room))).toBeNull();
  });

  it("rejects conduit records outside topology and invalid next identities", () => {
    const conduit = conduitScenario();
    const connections = { ...conduit.map.connections };
    delete connections["gas:core__furnace"];
    conduit.map = { ...conduit.map, connections };
    expect(decodeGame(encodeGame(conduit))).toBeNull();

    const identity = createScenarioGame("claim_8_delta");
    identity.nextEventId = 1;
    expect(decodeGame(encodeGame(identity))).toBeNull();
  });

  it("rejects reservoir records outside site authoring and inventory above capacity", () => {
    const extra = createScenarioGame("cordon_41");
    extra.gasSources.detached = { gas: { ...extra.gasSources.gas_reservoir!.gas } };
    expect(validateGameState(extra)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "supply_state_invalid" })])
    );

    const overloaded = createScenarioGame("cordon_41");
    overloaded.liquidSources.liquid_reservoir_a!.liquid.water = 221;
    expect(validateGameState(overloaded)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "supply_state_invalid" })])
    );
  });
});

describe("phase state validation", () => {
  it("rejects wave state in phases that cannot own spawned enemies", () => {
    let assault = DEFAULT_GAME_RUNTIME.execute(createScenarioGame("claim_8_delta"), {
      type: "begin_level",
    }).state;
    assault = DEFAULT_GAME_RUNTIME.execute(assault, { type: "start_assault" }).state;
    assault = DEFAULT_GAME_RUNTIME.step(assault, 1);
    expect(assault.enemies.length).toBeGreaterThan(0);
    assault.phase = "build";
    expect(validateGameState(assault)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "phase_invariant_invalid", path: "enemies" }),
      ])
    );
  });
});
