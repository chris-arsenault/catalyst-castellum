import { describe, expect, it } from "vitest";
import { emptyDamageLedger, emptyHazardChannels } from "./engine/damage";
import { decodeGame, encodeGame } from "./save";
import { createScenarioGame, findEnemyPath } from "./simulation";
import { type EnemyState, type GameState } from "./types";
import { gasConduitState } from "./world/instances";
import { DEFAULT_GAME_DEFINITION } from "./definition";
import { initialEnemyBehaviorState } from "./engine/enemyBehaviors";

const persistedEnemy = (game: GameState): EnemyState => {
  const path = findEnemyPath({ flying: false, portalStates: game.portalStates });
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
      sourceId: "hydrogen_oxygen_combustion",
      channels: { ...emptyHazardChannels(), pressure: 53 },
      amount: 53,
      elapsed: 11,
    },
    behavior: { kind: "standard" },
  };
};

describe("current persistence", () => {
  it("round-trips conduit routes, damage ledgers, and structured incidents", () => {
    const game = createScenarioGame("flash_point");
    game.phase = "assault";
    gasConduitState(game, "gas:core__furnace").enabled = true;
    gasConduitState(game, "gas:core__furnace").gas.hydrogen = 4;
    game.enemies.push(persistedEnemy(game));
    game.nextEnemyId = 10;
    game.enemies[0]!.damageBySource.hydrogen_oxygen_combustion.pressure = 53;
    game.incidents.push({
      id: 3,
      elapsed: 11,
      levelId: "flash_point",
      round: 1,
      phase: "assault",
      roomId: "furnace",
      zone: "lower",
      sourceId: "hydrogen_oxygen_combustion",
      reactionExtent: 3,
      pressureImpulse: 132,
      heatDelta: 33,
      damageByChannel: { ...emptyHazardChannels(), pressure: 53 },
      targets: [
        {
          enemyId: 9,
          enemyType: "deckmouth",
          worldPosition: { x: 98, elevation: 14 },
          healthBefore: 74,
          healthAfter: 21,
          damageByChannel: { ...emptyHazardChannels(), pressure: 53 },
          killed: false,
        },
      ],
    });
    game.nextIncidentId = 4;

    const decoded = decodeGame(encodeGame(game));
    expect(decoded).not.toBeNull();
    if (!decoded) throw new Error("Expected the current save to decode.");
    expect(decoded.version).toBe(14);
    expect(gasConduitState(decoded, "gas:core__furnace").route).toEqual(
      gasConduitState(game, "gas:core__furnace").route
    );
    expect(decoded.enemies[0]?.damageBySource.hydrogen_oxygen_combustion.pressure).toBe(53);
    expect(decoded.enemies[0]?.path).toEqual(game.enemies[0]?.path);
    expect(decoded.enemies[0]).toMatchObject({
      level: 20,
      pathIndex: 12,
      progress: 0.2,
      mode: game.enemies[0]?.mode,
      facing: 1,
    });
    expect(decoded.incidents[0]?.targets[0]?.healthAfter).toBe(21);
    expect(decoded.portalStates).toEqual(game.portalStates);
  });
});

describe("enemy behavior persistence", () => {
  it("round-trips special enemy resources", () => {
    const game = createScenarioGame("flash_point");
    game.phase = "assault";
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
    game.enemies = [anchor];
    game.nextEnemyId = 10;

    const decoded = decodeGame(encodeGame(game));

    expect(decoded?.enemies[0]?.behavior).toEqual({
      kind: "shared_field",
      charge: 42.5,
      maximumCharge: 170,
      active: false,
    });
  });
});

describe("save decoding", () => {
  it("rejects saves from earlier schema versions", () => {
    const game = createScenarioGame("flash_point");
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
});

describe("canonical portal persistence", () => {
  it("rejects state missing any canonical portal state", () => {
    const game = createScenarioGame("flash_point");
    const envelope = JSON.parse(encodeGame(game)) as { game: GameState };
    envelope.game.portalStates = {};

    expect(decodeGame(JSON.stringify(envelope))).toBeNull();
  });
});

describe("enemy navigation persistence", () => {
  it("rejects an out-of-range path cursor", () => {
    const game = createScenarioGame("flash_point");
    game.enemies.push(persistedEnemy(game));
    game.enemies[0]!.pathIndex = 999;
    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects paths through out-of-bounds or non-adjacent cells", () => {
    const game = createScenarioGame("flash_point");
    game.enemies.push(persistedEnemy(game));
    game.enemies[0]!.path[0]!.cell = { column: -99, elevation: 999 };
    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects a ground enemy persisted with an otherwise-adjacent flying path", () => {
    const game = createScenarioGame("flash_point");
    const enemy = persistedEnemy(game);
    enemy.path = findEnemyPath({ flying: true, portalStates: game.portalStates });
    enemy.pathIndex = 0;
    enemy.progress = 0;
    enemy.mode = "flying";
    game.enemies.push(enemy);

    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects sideways walking away from an unsupported fall cell", () => {
    const game = createScenarioGame("flash_point");
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
    game.enemies.push(enemy);

    expect(decodeGame(encodeGame(game))).toBeNull();
  });

  it("rejects downward ladder travel mislabeled as falling", () => {
    const game = createScenarioGame("flash_point");
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
    game.enemies.push(enemy);

    expect(decodeGame(encodeGame(game))).toBeNull();
  });
});
