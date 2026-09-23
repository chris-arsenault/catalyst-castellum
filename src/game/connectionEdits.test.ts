import { campaignEncounterContext } from "./engine/campaignEncounter";
import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "./config";
import { createScenarioGame, executeCommand } from "./simulation";
import { decodeGame, encodeGame } from "./persistence/saveCodec";
import { isProcessLine, processLineId } from "./world/map";
import { plannedLineConnection } from "./world/processLineEdits";
import { gasConduitState } from "./world/instances";
import type { GameState } from "./types";

const PAIR_ID = processLineId("gas_line", "gallery", "switchyard");

const buildableState = (): GameState => {
  const state = createScenarioGame("cordon_41");
  const exam = DEFAULT_GAME_DEFINITION.levels.cordon_41.rounds.at(-1);
  if (!exam) throw new Error("cordon_41 has no rounds");
  state.phase = "build";
  state.encounter.matter = 200;
  state.campaign.roundIndex = DEFAULT_GAME_DEFINITION.levels.cordon_41.rounds.length - 1;
  state.encounter.availability = {
    towers: [...exam.availability.towers],
    equipment: [...exam.availability.equipment],
    gasLines: [...exam.availability.gasLines],
    liquidLines: [...exam.availability.liquidLines],
  };
  state.encounter.definition.id = campaignEncounterContext(
    state,
    DEFAULT_GAME_DEFINITION
  ).definition.id;
  return state;
};

const build = (state: GameState) =>
  executeCommand(state, {
    type: "build_connection",
    kind: "gas_line",
    fromRoomId: "gallery",
    toRoomId: "switchyard",
  });

describe("player-built connections are map edits", () => {
  it("keeps construction blueprints out of live topology", () => {
    const state = createScenarioGame("cordon_41");
    const liveLines = Object.values(state.encounter.map.connections).filter(isProcessLine);
    expect(liveLines.map(({ id }) => id)).toEqual([]);
    expect(state.encounter.process.gasConduits).not.toHaveProperty("gas:core__furnace");
    expect(state.encounter.process.gasConduits).not.toHaveProperty("gas:core__washlock");
  });

  it("authors a new Core-to-R-06 feed in the direction the player draws it", () => {
    const state = buildableState();
    const result = executeCommand(state, {
      type: "build_connection",
      kind: "gas_line",
      fromRoomId: "core",
      toRoomId: "washlock",
    });
    expect(result.accepted, result.code ?? undefined).toBe(true);
    expect(result.state.encounter.map.connections["gas:core__washlock"]).toMatchObject({
      direction: ["core", "washlock"],
      destinationKind: "room",
    });
  });
});

describe("definition-bound line planning", () => {
  it("binds cached construction costs to the injected line definition", () => {
    const state = buildableState();
    const original = { lineBlueprints: {}, lineSpecs: DEFAULT_GAME_DEFINITION.lineSpecs };
    const changed = {
      ...original,
      lineSpecs: {
        ...original.lineSpecs,
        gas_line: {
          ...original.lineSpecs.gas_line,
          baseCost: original.lineSpecs.gas_line.baseCost + 100,
        },
      },
    };
    const first = plannedLineConnection(
      original,
      state.encounter.map,
      "gas_line",
      "gallery",
      "switchyard"
    );
    const second = plannedLineConnection(
      changed,
      state.encounter.map,
      "gas_line",
      "gallery",
      "switchyard"
    );
    expect(first).not.toBeNull();
    expect(second?.route).toEqual(first?.route);
    expect(second?.buildCost).toBe((first?.buildCost ?? 0) + 100);
  });
});

describe("process connection lifecycle", () => {
  it("mints, routes, and installs an unauthored available pair", () => {
    const state = buildableState();
    const planned = plannedLineConnection(
      DEFAULT_GAME_DEFINITION,
      state.encounter.map,
      "gas_line",
      "gallery",
      "switchyard"
    );
    expect(planned).not.toBeNull();
    const result = build(state);
    expect(result.accepted).toBe(true);
    const next = result.state;
    expect(next.encounter.map).not.toBe(state.encounter.map);
    expect(next.encounter.mapRevision).toBe(state.encounter.mapRevision + 1);
    expect(next.encounter.map.connections[PAIR_ID]).toBeDefined();
    expect(next.encounter.world.connections).toContain(PAIR_ID);
    expect(next.encounter.process.gasConduits[PAIR_ID]).toBeDefined();
    expect(gasConduitState(next.encounter, PAIR_ID).enabled).toBe(false);
    expect(gasConduitState(next.encounter, PAIR_ID).route).toEqual(planned?.route);
    expect(next.encounter.matter).toBe(state.encounter.matter - (planned?.buildCost ?? 0));
  });

  it("is deterministic: the same build on the same state yields identical maps", () => {
    const first = build(buildableState()).state;
    const second = build(buildableState()).state;
    expect(second.encounter.map.connections[PAIR_ID]).toEqual(
      first.encounter.map.connections[PAIR_ID]
    );
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

  it("removes a dismantled line and deterministically routes a fresh rebuild", () => {
    const built = build(buildableState()).state;
    const builtRoute = gasConduitState(built.encounter, PAIR_ID).route;
    const dismantled = executeCommand(built, {
      type: "dismantle_connection",
      connectionId: PAIR_ID,
    });
    expect(dismantled.accepted).toBe(true);
    expect(dismantled.state.encounter.map.connections[PAIR_ID]).toBeUndefined();
    expect(dismantled.state.encounter.process.gasConduits[PAIR_ID]).toBeUndefined();
    const rebuilt = build(dismantled.state);
    expect(rebuilt.accepted).toBe(true);
    expect(gasConduitState(rebuilt.state.encounter, PAIR_ID).route).toEqual(builtRoute);
    expect(rebuilt.state.encounter.mapRevision).toBe(dismantled.state.encounter.mapRevision + 1);
  });

  it("round-trips a player-built line through the current save", () => {
    const built = build(buildableState()).state;
    const decoded = decodeGame(encodeGame(built, DEFAULT_GAME_DEFINITION), DEFAULT_GAME_DEFINITION);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.encounter.map.connections[PAIR_ID]).toEqual(
      built.encounter.map.connections[PAIR_ID]
    );
    expect(decoded.encounter.mapRevision).toBe(built.encounter.mapRevision);
    expect(decoded.encounter.process.gasConduits[PAIR_ID]).toBeDefined();
  });
});
