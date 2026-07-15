import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "./config";
import { createScenarioGame, executeCommand } from "./simulation";
import { decodeGame, encodeGame } from "./persistence/saveCodec";
import { processLineId } from "./world/map";
import { plannedLineConnection } from "./world/mapEdits";
import { gasConduitState } from "./world/instances";
import type { GameState } from "./types";

const PAIR_ID = processLineId("gas_line", "reservoir", "washlock");

const buildableState = (): GameState => {
  const state = createScenarioGame("flash_point");
  const exam = DEFAULT_GAME_DEFINITION.levels.flash_point.rounds.at(-1);
  if (!exam) throw new Error("flash_point has no rounds");
  state.phase = "build";
  state.matter = 200;
  state.campaign.roundIndex = DEFAULT_GAME_DEFINITION.levels.flash_point.rounds.length - 1;
  state.availability = {
    equipment: [...exam.availability.equipment],
    gasLines: [...exam.availability.gasLines],
    liquidLines: [...exam.availability.liquidLines],
    gasSources: [...exam.availability.gasSources],
    liquidSources: [...exam.availability.liquidSources],
  };
  return state;
};

const build = (state: GameState) =>
  executeCommand(state, {
    type: "build_connection",
    kind: "gas_line",
    fromRoomId: "reservoir",
    toRoomId: "washlock",
  });

describe("player-built connections are map edits", () => {
  it("mints, routes, and installs an unauthored available pair", () => {
    const state = buildableState();
    const planned = plannedLineConnection(
      DEFAULT_GAME_DEFINITION,
      state.map,
      "gas_line",
      "reservoir",
      "washlock"
    );
    expect(planned).not.toBeNull();
    const result = build(state);
    expect(result.accepted).toBe(true);
    const next = result.state;
    expect(next.map).not.toBe(state.map);
    expect(next.mapRevision).toBe(state.mapRevision + 1);
    expect(next.map.connections[PAIR_ID]).toBeDefined();
    expect(next.world.connections).toContain(PAIR_ID);
    expect(gasConduitState(next, PAIR_ID).installed).toBe(true);
    expect(gasConduitState(next, PAIR_ID).enabled).toBe(false);
    expect(gasConduitState(next, PAIR_ID).route).toEqual(planned?.route);
    expect(next.matter).toBe(state.matter - (planned?.buildCost ?? 0));
  });

  it("is deterministic: the same build on the same state yields identical maps", () => {
    const first = build(buildableState()).state;
    const second = build(buildableState()).state;
    expect(second.map.connections[PAIR_ID]).toEqual(first.map.connections[PAIR_ID]);
  });

  it("rejects an unavailable pair and a duplicate build", () => {
    const state = buildableState();
    const unavailable = executeCommand(state, {
      type: "build_connection",
      kind: "gas_line",
      fromRoomId: "west_intake",
      toRoomId: "reservoir",
    });
    expect(unavailable.accepted).toBe(false);
    expect(unavailable.code).toBe("unavailable");
    const built = build(state).state;
    const duplicate = build(built);
    expect(duplicate.accepted).toBe(false);
    expect(duplicate.code).toBe("already_installed");
  });

  it("keeps a dismantled line's routed map data for a cheaper identical rebuild", () => {
    const built = build(buildableState()).state;
    const dismantled = executeCommand(built, {
      type: "dismantle_connection",
      connectionId: PAIR_ID,
    });
    expect(dismantled.accepted).toBe(true);
    expect(dismantled.state.map.connections[PAIR_ID]).toBeDefined();
    expect(gasConduitState(dismantled.state, PAIR_ID).installed).toBe(false);
    const rebuilt = build(dismantled.state);
    expect(rebuilt.accepted).toBe(true);
    expect(gasConduitState(rebuilt.state, PAIR_ID).route).toEqual(
      gasConduitState(built, PAIR_ID).route
    );
    expect(rebuilt.state.mapRevision).toBe(dismantled.state.mapRevision);
  });

  it("round-trips a player-built line through the v13 save", () => {
    const built = build(buildableState()).state;
    const decoded = decodeGame(encodeGame(built, DEFAULT_GAME_DEFINITION), DEFAULT_GAME_DEFINITION);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.map.connections[PAIR_ID]).toEqual(built.map.connections[PAIR_ID]);
    expect(decoded.mapRevision).toBe(built.mapRevision);
    expect(gasConduitState(decoded, PAIR_ID).installed).toBe(true);
  });
});
