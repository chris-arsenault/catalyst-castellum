import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "./definition";
import {
  environmentalFieldIntensity,
  tickEnvironmentalFields,
  upsertEnvironmentalField,
} from "./engine/environmentalFields";
import { cloneGame } from "./engine/roomState";
import { towerRoomId } from "./engine/towerPlacement";
import {
  consumeTowerSupplyForShot,
  releaseTowerByproducts,
  serviceTowerSupplies,
  towerSupplyQuery,
} from "./engine/towerSupply";
import { createGameRuntime } from "./runtime";
import type { GameCommand, GameState } from "./types";
import { processLineId } from "./world/map";

const runtime = createGameRuntime(DEFAULT_GAME_DEFINITION);

const burnerPlacementIn = (state: GameState, roomId: string): GameCommand => {
  const room = state.map.rooms[roomId]!;
  const candidates: Extract<GameCommand, { type: "place_tower" }>[] = [];
  for (
    let elevation = room.bounds.elevation;
    elevation < room.bounds.elevation + room.bounds.height;
    elevation += 1
  ) {
    candidates.push({
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column: room.bounds.column, elevation },
      mountFace: "left_wall",
      orientation: "right",
    });
    candidates.push({
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column: room.bounds.column + room.bounds.width - 1, elevation },
      mountFace: "right_wall",
      orientation: "left",
    });
  }
  for (
    let column = room.bounds.column;
    column < room.bounds.column + room.bounds.width;
    column += 1
  ) {
    candidates.push({
      type: "place_tower",
      chassisId: "carbon_burner",
      anchor: { column, elevation: room.bounds.elevation + room.bounds.height - 1 },
      mountFace: "ceiling",
      orientation: "down",
    });
  }
  const command = candidates.find((candidate) => runtime.evaluate(state, candidate).allowed);
  if (!command) throw new Error(`No legal Carbon Burner placement exists in ${roomId}.`);
  return command;
};

const suppliedBurnerState = (): { state: GameState; towerId: string; connectionId: string } => {
  let state = runtime.execute(runtime.createScenario("cordon_41"), { type: "begin_level" }).state;
  state.matter = 1_000;
  const blueprint = Object.values(runtime.definition.lineBlueprints).find(
    (line) =>
      line.kind === "gas_line" &&
      state.availability.gasLines.includes(line.id) &&
      runtime.evaluate(state, {
        type: "build_connection",
        kind: "gas_line",
        fromRoomId: line.direction[0],
        toRoomId: line.direction[1],
      }).allowed
  );
  if (!blueprint) throw new Error("No available gas line can be built at Cordon 41.");
  const sourceRoomId = blueprint.direction[0];
  const destinationRoomId = blueprint.direction[1];
  const built = runtime.execute(state, {
    type: "build_connection",
    kind: "gas_line",
    fromRoomId: sourceRoomId,
    toRoomId: destinationRoomId,
  });
  expect(built.accepted, built.code ?? undefined).toBe(true);
  state = built.state;
  const placed = runtime.execute(state, burnerPlacementIn(state, destinationRoomId));
  expect(placed.accepted, placed.code ?? undefined).toBe(true);
  state = placed.state;
  const towerId = Object.keys(state.towers)[0]!;
  const connectionId = processLineId("gas_line", blueprint.rooms[0], blueprint.rooms[1]);
  const enabled = runtime.execute(state, { type: "set_conduit", connectionId, enabled: true });
  expect(enabled.accepted, enabled.code ?? undefined).toBe(true);
  state = enabled.state;
  const conduit = state.gasConduits[connectionId]!;
  conduit.flowCause = "priming";
  conduit.lastFlow = 0.8;
  conduit.lastSpeciesFlow.hydrogen = 0.8;
  const room = state.rooms[destinationRoomId]!;
  room.gas.lower.hydrogen = 4;
  room.gas.lower.oxygen = 4;
  return { state, towerId, connectionId };
};

const roomElements = (state: GameState, roomId: string, towerId: string) => {
  const room = state.rooms[roomId]!;
  const towerHydrogen = state.towers[towerId]!.localResources.gas.hydrogen ?? 0;
  const hydrogen =
    2 *
    (room.gas.lower.hydrogen +
      room.gas.upper.hydrogen +
      room.gas.lower.steam +
      room.gas.upper.steam +
      towerHydrogen);
  const oxygen =
    2 * (room.gas.lower.oxygen + room.gas.upper.oxygen) +
    room.gas.lower.steam +
    room.gas.upper.steam;
  return { hydrogen, oxygen };
};

describe("pipe-assisted towers", () => {
  it("uses delivered flow after conduit latency and reports the same supply contract", () => {
    const { state, towerId, connectionId } = suppliedBurnerState();
    const tower = state.towers[towerId]!;
    serviceTowerSupplies(state, 1, runtime.definition);
    expect(tower.localResources.gas.hydrogen ?? 0).toBe(0);
    expect(towerSupplyQuery(state, tower, runtime.definition)).toMatchObject({
      mode: "direct",
      availableRate: 0,
      demandedRate: 0.35,
    });

    state.gasConduits[connectionId]!.flowCause = "fan";
    serviceTowerSupplies(state, 2, runtime.definition);
    expect(tower.localResources.gas.hydrogen).toBeCloseTo(0.7, 6);
    expect(state.towerSupply[towerId]).toMatchObject({
      mode: "assisted",
      connectionIds: [connectionId],
      destinationRoomId: towerRoomId(state, tower),
      availableRate: 0.8,
    });
  });

  it("conserves hydrogen and oxygen through local storage and steam exhaust", () => {
    const { state, towerId, connectionId } = suppliedBurnerState();
    const tower = state.towers[towerId]!;
    const roomId = towerRoomId(state, tower)!;
    state.gasConduits[connectionId]!.flowCause = "fan";
    const before = roomElements(state, roomId, towerId);
    serviceTowerSupplies(state, 2, runtime.definition);
    const use = consumeTowerSupplyForShot(state, tower, runtime.definition);
    const reacted = releaseTowerByproducts(state, tower, use.consumed, runtime.definition);
    const after = roomElements(state, roomId, towerId);
    expect(use.mode).toBe("assisted");
    expect(reacted).toBeGreaterThan(0);
    expect(after.hydrogen).toBeCloseTo(before.hydrogen, 6);
    expect(after.oxygen).toBeCloseTo(before.oxygen, 6);
  });

  it("allocates shared line flow independently of tower record insertion order", () => {
    const fixture = suppliedBurnerState();
    fixture.state.gasConduits[fixture.connectionId]!.flowCause = "fan";
    const first = fixture.state.towers[fixture.towerId]!;
    const second = {
      ...structuredClone(first),
      id: "tower:kettleblack:0",
      localResources: { gas: {}, liquid: {} },
    };
    fixture.state.towers[second.id] = second;
    const left = cloneGame(fixture.state);
    const right = cloneGame(fixture.state);
    right.towers = Object.fromEntries(Object.entries(right.towers).reverse());
    serviceTowerSupplies(left, 1, runtime.definition);
    serviceTowerSupplies(right, 1, runtime.definition);
    expect(left.towers[second.id]!.localResources).toEqual(right.towers[second.id]!.localResources);
    expect(left.towers[fixture.towerId]!.localResources).toEqual(
      right.towers[fixture.towerId]!.localResources
    );
  });
});

describe("environmental fields", () => {
  it("applies explicit strongest and additive stacking, then decays deterministically", () => {
    const state = suppliedBurnerState().state;
    const base = {
      sourceId: "test",
      effect: "movement" as const,
      roomId: "core",
      zone: "both" as const,
      duration: 4,
      decayPerSecond: 0.05,
      species: "steam" as const,
    };
    upsertEnvironmentalField(state, {
      ...base,
      id: "strong-a",
      intensity: 0.2,
      stacking: "strongest",
    });
    upsertEnvironmentalField(state, {
      ...base,
      id: "strong-b",
      intensity: 0.3,
      stacking: "strongest",
    });
    upsertEnvironmentalField(state, {
      ...base,
      id: "additive",
      intensity: 0.1,
      stacking: "additive",
    });
    expect(environmentalFieldIntensity(state, "core", "lower", "movement")).toBeCloseTo(0.4);
    tickEnvironmentalFields(state, 1);
    expect(environmentalFieldIntensity(state, "core", "lower", "movement")).toBeCloseTo(0.3);

    const restored = runtime.save.decode(runtime.save.encode(state));
    expect(restored?.environmentalFields).toEqual(state.environmentalFields);
    expect(restored?.towerSupply).toEqual(state.towerSupply);
  });
});
