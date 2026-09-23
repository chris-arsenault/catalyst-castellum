import { describe, expect, it } from "vitest";
import { emptyDamageLedger, emptyHazardChannels } from "./engine/damage";
import { decodeGame, encodeGame } from "./save";
import { createScenarioGame, executeCommand, findEnemyPath } from "./simulation";
import { type EnemyState, type GameState } from "./types";
import { roomState } from "./world/instances";
import { DEFAULT_GAME_DEFINITION } from "./definition";
import { initialEnemyBehaviorState } from "./engine/enemyBehaviors";

const persistedEnemy = (game: GameState): EnemyState => {
  const path = findEnemyPath({ flying: false, portalStates: game.encounter.portalStates });
  return {
    id: 9,
    type: "deckmouth",
    level: 20,
    health: 21,
    maxHealth: 74,
    routeId: "entry_to_core",
    path,
    pathIndex: 12,
    progress: 0.2,
    mode: path[13]?.mode ?? "walking",
    facing: 1,
    spawnAge: 3,
    damageTaken: 53,
    damageBySource: emptyDamageLedger(),
    lastDamage: {
      sourceId: "tower_burner",
      channels: { ...emptyHazardChannels(), heat: 53 },
      amount: 53,
      elapsed: 11,
    },
    behavior: { kind: "standard" },
    effects: [],
  };
};

const membraneCellOperation = (game: GameState) => {
  const operation = roomState(game.encounter, "lower_intake").equipment.socket_a?.operation;
  const anode = operation?.outputs.anode_header;
  if (!operation || !anode || anode.phase !== "gas")
    throw new Error("Expected an installed membrane cell.");
  return { anode, operation };
};

const processSiteWithMembraneCell = (): GameState => {
  const entered = executeCommand(createScenarioGame("cordon_41"), { type: "begin_level" });
  const installed = executeCommand(entered.state, {
    type: "install_equipment",
    roomId: "lower_intake",
    socketId: "socket_a",
    equipmentId: "membrane_cell",
  });
  if (!entered.accepted || !installed.accepted) throw new Error("Could not install membrane cell.");
  return installed.state;
};

describe("current persistence", () => {
  it("round-trips route state, damage ledgers, and structured incidents", () => {
    const game = createScenarioGame("claim_8_delta");
    game.phase = "assault";
    game.encounter.phase = "assault";
    game.encounter.process.rooms.furnace!.stationary.surface_nickel = 2.5;
    game.encounter.enemies.push(persistedEnemy(game));
    game.encounter.nextEnemyId = 10;
    game.encounter.enemies[0]!.damageBySource.tower_burner.heat = 53;
    game.encounter.incidents.push({
      id: 3,
      elapsed: 11,
      encounterId: game.encounter.definition.id,
      phase: "assault",
      roomId: "furnace",
      zone: "lower",
      sourceId: "hydrogen_oxygen_combustion",
      reactionExtent: 3,
      pressureImpulse: 132,
      heatDelta: 33,
      damageByChannel: emptyHazardChannels(),
      targets: [],
    });
    game.encounter.nextIncidentId = 4;

    const decoded = decodeGame(encodeGame(game));
    expect(decoded).not.toBeNull();
    if (!decoded) throw new Error("Expected the current save to decode.");
    expect(decoded.version).toBe(30);
    expect(decoded.encounter.map.routeGraph).toEqual(game.encounter.map.routeGraph);
    expect(decoded.encounter.enemies[0]?.damageBySource.tower_burner.heat).toBe(53);
    expect(decoded.encounter.enemies[0]?.path).toEqual(game.encounter.enemies[0]?.path);
    expect(decoded.encounter.enemies[0]).toMatchObject({
      level: 20,
      pathIndex: 12,
      progress: 0.2,
      mode: game.encounter.enemies[0]?.mode,
      facing: 1,
    });
    expect(decoded.encounter.incidents[0]).toMatchObject({
      sourceId: "hydrogen_oxygen_combustion",
      reactionExtent: 3,
      pressureImpulse: 132,
      heatDelta: 33,
      targets: [],
    });
    expect(decoded.encounter.process.rooms.furnace?.stationary.surface_nickel).toBe(2.5);
    expect(decoded.encounter.portalStates).toEqual(game.encounter.portalStates);
  });

  it("round-trips each installed machine's operation telemetry and port inventory", () => {
    const game = processSiteWithMembraneCell();
    const { anode, operation } = membraneCellOperation(game);
    operation.totalProcessed = 12.5;
    operation.lastRate = 0.56;
    anode.gas.chlorine = 7.25;

    const decoded = decodeGame(encodeGame(game));
    if (!decoded) throw new Error("Expected operation state to decode.");
    const restored = membraneCellOperation(decoded);

    expect(restored.operation.totalProcessed).toBeCloseTo(12.5, 8);
    expect(restored.operation.lastRate).toBeCloseTo(0.56, 8);
    expect(restored.anode.gas.chlorine).toBeCloseTo(7.25, 8);
  });
});

describe("enemy behavior persistence", () => {
  it("round-trips special enemy resources", () => {
    const game = createScenarioGame("claim_8_delta");
    game.phase = "assault";
    game.encounter.phase = "assault";
    const anchor: EnemyState = {
      ...persistedEnemy(game),
      type: "anchor",
      health: 75,
      maxHealth: 75,
      damageTaken: 0,
      damageBySource: emptyDamageLedger(),
      lastDamage: null,
      behavior: initialEnemyBehaviorState(DEFAULT_GAME_DEFINITION.enemies.anchor, 20),
    };
    if (anchor.behavior.kind !== "shared_field") throw new Error("Expected Anchor field state.");
    anchor.behavior.charge = 42.5;
    anchor.behavior.active = false;
    game.encounter.enemies = [anchor];
    game.encounter.nextEnemyId = 10;

    const decoded = decodeGame(encodeGame(game));

    expect(decoded?.encounter.enemies[0]?.behavior).toEqual({
      kind: "shared_field",
      charge: 42.5,
      maximumCharge: 170,
      active: false,
    });
  });
});

describe("save decoding", () => {
  it("requires nested tactical/process ownership and rejects flat aliases", () => {
    const game = createScenarioGame("claim_8_delta");
    const encoded = encodeGame(game);
    const flat = JSON.parse(encoded) as { game: GameState & { matter: number } };
    flat.game.matter = 30;
    expect(decodeGame(JSON.stringify(flat))).toBeNull();
    const missingProcess = JSON.parse(encoded) as { game: { encounter: { process: unknown } } };
    missingProcess.game.encounter.process = null;
    expect(decodeGame(JSON.stringify(missingProcess))).toBeNull();
    const missingTick = JSON.parse(encoded) as { game: { encounter: Record<string, unknown> } };
    delete missingTick.game.encounter.tick;
    expect(decodeGame(JSON.stringify(missingTick))).toBeNull();
  });

  it("rejects saves from earlier schema versions", () => {
    const game = createScenarioGame("claim_8_delta");
    const envelope = JSON.parse(encodeGame(game)) as {
      game: Omit<GameState, "version"> & { version: number };
    };
    envelope.game.version = 13;

    expect(decodeGame(JSON.stringify(envelope))).toBeNull();
  });

  it("rejects malformed state", () => {
    expect(decodeGame("not-json")).toBeNull();
    expect(decodeGame(JSON.stringify({ format: "catalyst-castellum-save", game: {} }))).toBeNull();
  });

  it("rejects installed operation state that differs from its equipment definition", () => {
    const game = processSiteWithMembraneCell();
    const envelope = JSON.parse(encodeGame(game)) as { game: GameState };
    const cell = envelope.game.encounter.process.rooms.lower_intake?.equipment.socket_a;
    if (!cell) throw new Error("Expected an installed membrane cell.");
    cell.operation = null;

    expect(decodeGame(JSON.stringify(envelope))).toBeNull();
  });
});

describe("canonical portal persistence", () => {
  it("rejects state missing any canonical portal state", () => {
    const game = createScenarioGame("claim_8_delta");
    const envelope = JSON.parse(encodeGame(game)) as { game: GameState };
    envelope.game.encounter.portalStates = {};

    expect(decodeGame(JSON.stringify(envelope))).toBeNull();
  });
});

describe("enemy navigation persistence", () => {
  it("rejects an out-of-range path cursor", () => {
    const game = createScenarioGame("claim_8_delta");
    game.encounter.enemies.push(persistedEnemy(game));
    game.encounter.enemies[0]!.pathIndex = 999;
    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects paths through out-of-bounds or non-adjacent cells", () => {
    const game = createScenarioGame("claim_8_delta");
    game.encounter.enemies.push(persistedEnemy(game));
    game.encounter.enemies[0]!.path[0]!.cell = { column: -99, elevation: 999 };
    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects a ground enemy persisted with an otherwise-adjacent flying path", () => {
    const game = createScenarioGame("claim_8_delta");
    const enemy = persistedEnemy(game);
    enemy.path = findEnemyPath({ flying: true, portalStates: game.encounter.portalStates });
    enemy.pathIndex = 0;
    enemy.progress = 0;
    enemy.mode = "flying";
    game.encounter.enemies.push(enemy);

    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects sideways walking away from an unsupported fall cell", () => {
    const game = createScenarioGame("claim_8_delta");
    const enemy = persistedEnemy(game);
    const holeIndex = enemy.path.findIndex(
      (step) => step.cell.column === 28 && step.cell.elevation === 24
    );
    const hole = enemy.path[holeIndex]!;
    enemy.path.splice(holeIndex + 1, 0, {
      cell: { column: 27, elevation: 24 },
      mode: "walking",
      portalId: null,
    });
    enemy.path.splice(holeIndex + 2, 0, { ...hole, cell: { ...hole.cell } });
    game.encounter.enemies.push(enemy);

    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects downward ladder travel mislabeled as falling", () => {
    const game = createScenarioGame("claim_8_delta");
    const enemy = persistedEnemy(game);
    const ladderIndex = enemy.path.findIndex(
      (step) => step.cell.column === 8 && step.cell.elevation === 6
    );
    enemy.path.splice(ladderIndex + 1, 0, {
      cell: { column: 8, elevation: 5 },
      mode: "falling",
      portalId: null,
    });
    enemy.path.splice(ladderIndex + 2, 0, {
      cell: { column: 8, elevation: 6 },
      mode: "climbing",
      portalId: null,
    });
    game.encounter.enemies.push(enemy);

    expect(decodeGame(encodeGame(game))).toBeNull();
  });
});
