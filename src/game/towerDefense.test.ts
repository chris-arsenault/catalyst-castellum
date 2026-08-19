import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { emptyDamageLedger } from "./engine/damage";
import { initialEnemyBehaviorState } from "./engine/enemyBehaviors";
import { acquireTowerTargets } from "./engine/towerTargeting";
import { createGameRuntime } from "./runtime";
import type { EnemyState, GameCommand, GameState, TowerMountFace } from "./types";
import { routePathForEnemy } from "./world/routes";

const runtime = createGameRuntime(DEFAULT_GAME_DEFINITION);

const enterBuild = (): GameState => {
  const entered = runtime.execute(runtime.createScenario("claim_8_delta"), {
    type: "begin_level",
  });
  expect(entered.accepted).toBe(true);
  entered.state.matter = 500;
  return entered.state;
};

const place = (
  state: GameState,
  values: Omit<Extract<GameCommand, { type: "place_tower" }>, "type">
): GameState => {
  const result = runtime.execute(state, { type: "place_tower", ...values });
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const placements: ReadonlyArray<{
  face: TowerMountFace;
  anchor: { column: number; elevation: number };
  orientation: "right" | "down";
}> = [
  { face: "floor", anchor: { column: 10, elevation: 13 }, orientation: "right" },
  { face: "left_wall", anchor: { column: 6, elevation: 8 }, orientation: "right" },
  { face: "right_wall", anchor: { column: 27, elevation: 8 }, orientation: "right" },
  { face: "ceiling", anchor: { column: 15, elevation: 11 }, orientation: "down" },
];

const twoRouteRuntime = () => {
  const base = DEFAULT_GAME_DEFINITION.levels.claim_8_delta;
  const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
    id: "two-route-tower-test",
    towers: {
      ...DEFAULT_GAME_DEFINITION.towers,
      flash_chamber: {
        ...DEFAULT_GAME_DEFINITION.towers.flash_chamber,
        range: 100,
        firingArc: 360,
        lineOfSight: "lobbed",
      },
    },
    levels: {
      ...DEFAULT_GAME_DEFINITION.levels,
      claim_8_delta: {
        ...base,
        routes: [
          ...base.routes,
          {
            id: "upper_entry",
            roomId: "switchyard",
            offset: { column: 0, elevation: 0 },
            movementCost: 1.1,
            eligibility: "all",
          },
        ],
        rounds: base.rounds.map((round, index) =>
          index === 0
            ? {
                ...round,
                wave: [
                  { at: 0, type: "deckmouth", routeId: "entry_to_core", levelOffset: 0 },
                  { at: 0, type: "flintjack", routeId: "upper_entry", levelOffset: 0 },
                ],
              }
            : round
        ),
      },
    },
  });
  return createGameRuntime(definition);
};

const neutralizationRuntime = () => {
  const base = DEFAULT_GAME_DEFINITION.levels.claim_8_delta;
  const neutralizationTower = (chassisId: "caustic_jet" | "acid_pot") => {
    const chassis = DEFAULT_GAME_DEFINITION.towers[chassisId];
    return {
      ...chassis,
      range: 100,
      minimumRange: 0,
      firingArc: 360,
      lineOfSight: "lobbed" as const,
      cadence: 10,
      attack: {
        ...chassis.attack,
        packets: chassis.attack.packets.map((packet) => ({
          ...packet,
          channels: {
            atmosphere: 0,
            corrosion: 0,
            heat: 0,
            pressure: 0,
            radiation: 0,
          },
        })),
      },
    };
  };
  return createGameRuntime(
    deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "neutralization-tower-test",
      towers: {
        ...DEFAULT_GAME_DEFINITION.towers,
        caustic_jet: neutralizationTower("caustic_jet"),
        acid_pot: neutralizationTower("acid_pot"),
      },
      levels: {
        ...DEFAULT_GAME_DEFINITION.levels,
        claim_8_delta: {
          ...base,
          rounds: [
            {
              ...base.rounds[0]!,
              wave: [{ at: 0, type: "deckmouth", routeId: "entry_to_core", levelOffset: 0 }],
              availability: {
                ...base.rounds[0]!.availability,
                towers: ["caustic_jet", "acid_pot"],
              },
            },
            ...base.rounds.slice(1),
          ],
        },
      },
    })
  );
};

// eslint-disable-next-line max-lines-per-function -- Construction invariants share one stateful command fixture.
describe("tower construction commands", () => {
  it("places ordinary towers freely on every supported architectural face", () => {
    let state = enterBuild();
    for (const candidate of placements) {
      state = place(state, {
        chassisId: "flash_chamber",
        anchor: candidate.anchor,
        mountFace: candidate.face,
        orientation: candidate.orientation,
      });
    }
    expect(Object.values(state.towers).map((tower) => tower.placement.mountFace)).toEqual(
      placements.map(({ face }) => face)
    );
    expect(state.nextTowerSequence).toBe(5);
  });

  it("uses one decision for overlap, route obstruction, Matter, and execution", () => {
    let state = enterBuild();
    const command = {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    } as const;
    const decision = runtime.evaluate(state, command);
    expect(decision).toMatchObject({ allowed: true, cost: 18 });
    state = runtime.execute(state, command).state;
    expect(runtime.evaluate(state, command)).toMatchObject({ allowed: false, code: "placement" });

    state.matter = 0;
    expect(
      runtime.evaluate(state, {
        ...command,
        anchor: { column: 6, elevation: 9 },
      })
    ).toMatchObject({ allowed: false, code: "insufficient_matter", cost: 18 });

    state.matter = 500;
    expect(
      runtime.evaluate(state, {
        ...command,
        anchor: { column: 1, elevation: 4 },
        mountFace: "floor",
      })
    ).toMatchObject({ allowed: false, code: "route_unavailable" });
  });

  it("reserves the full boundary span of architectural openings", () => {
    const state = enterBuild();
    const openingPlacements = [
      ...[4, 5, 6].map((elevation) => ({
        anchor: { column: 6, elevation },
        mountFace: "left_wall" as const,
        orientation: "right" as const,
      })),
      ...[7, 8, 9].flatMap((column) => [
        {
          anchor: { column, elevation: 11 },
          mountFace: "ceiling" as const,
          orientation: "down" as const,
        },
        {
          anchor: { column, elevation: 13 },
          mountFace: "floor" as const,
          orientation: "right" as const,
        },
      ]),
    ];
    for (const placement of openingPlacements) {
      expect(
        runtime.evaluate(state, {
          type: "place_tower",
          chassisId: "flash_chamber",
          ...placement,
        })
      ).toMatchObject({ allowed: false, code: "placement" });
    }
  });

  it("moves, rotates, retargets, upgrades, and dismantles through typed policy", () => {
    let state = place(enterBuild(), {
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    });
    const towerId = Object.keys(state.towers)[0]!;
    state = runtime.execute(state, {
      type: "move_tower",
      towerId,
      anchor: { column: 15, elevation: 11 },
      mountFace: "ceiling",
      orientation: "down",
    }).state;
    state = runtime.execute(state, { type: "rotate_tower", towerId, orientation: "left" }).state;
    state = runtime.execute(state, {
      type: "set_tower_targeting",
      towerId,
      policy: "strongest",
    }).state;
    state = runtime.execute(state, {
      type: "upgrade_tower",
      towerId,
      upgradeId: "flash_calibration",
    }).state;
    expect(state.towers[towerId]).toMatchObject({
      targetPolicy: "strongest",
      upgrades: ["flash_calibration"],
      totalMatterSpent: 27,
    });
    const dismantle = runtime.evaluate(state, { type: "dismantle_tower", towerId });
    expect(dismantle).toMatchObject({ allowed: true, refund: 20 });
    state = runtime.execute(state, { type: "dismantle_tower", towerId }).state;
    expect(state.towers).toEqual({});
  });
});

describe("authored route graph and targeting", () => {
  it("materializes two authored ingresses and restores them through the save codec", () => {
    const gameRuntime = twoRouteRuntime();
    const state = gameRuntime.createScenario("claim_8_delta");
    expect(Object.keys(state.map.routeGraph.routes)).toEqual(["entry_to_core", "upper_entry"]);
    expect(Object.values(state.map.routeGraph.edges).every((edge) => edge.cells.length > 1)).toBe(
      true
    );
    const restored = gameRuntime.save.decode(gameRuntime.save.encode(state));
    expect(restored?.map.routeGraph).toEqual(state.map.routeGraph);
  });

  it("orders first and last by remaining route distance across lanes with stable ID ties", () => {
    const gameRuntime = twoRouteRuntime();
    let state = gameRuntime.execute(gameRuntime.createScenario("claim_8_delta"), {
      type: "begin_level",
    }).state;
    state.matter = 500;
    state = gameRuntime.execute(state, {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 15, elevation: 11 },
      mountFace: "ceiling",
      orientation: "down",
    }).state;
    const tower = Object.values(state.towers)[0]!;
    const makeEnemy = (
      id: number,
      type: "deckmouth" | "flintjack",
      routeId: string
    ): EnemyState => {
      const path = routePathForEnemy(
        { routeId, type },
        state.map,
        state.portalStates,
        gameRuntime.definition
      );
      const enemyDefinition = gameRuntime.definition.enemies[type];
      return {
        id,
        type,
        level: 20,
        health: enemyDefinition.health,
        maxHealth: enemyDefinition.health,
        routeId,
        path,
        pathIndex: Math.min(5, path.length - 1),
        progress: 0.5,
        mode: path[Math.min(5, path.length - 1)]?.mode ?? "walking",
        facing: 1,
        spawnAge: 1,
        damageTaken: 0,
        damageBySource: emptyDamageLedger(),
        lastDamage: null,
        behavior: initialEnemyBehaviorState(enemyDefinition, 20),
        effects: [],
      };
    };
    state.enemies = [
      makeEnemy(2, "deckmouth", "entry_to_core"),
      makeEnemy(1, "flintjack", "upper_entry"),
    ];
    tower.targetPolicy = "first";
    const first = acquireTowerTargets(state, tower, gameRuntime.definition)[0];
    tower.targetPolicy = "last";
    const last = acquireTowerTargets(state, tower, gameRuntime.definition)[0];
    expect(first?.id).not.toBe(last?.id);
  });
});

describe("deterministic tower combat", () => {
  const configuredAssault = (): GameState => {
    let state = enterBuild();
    state = place(state, {
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    });
    state = place(state, {
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 7 },
      mountFace: "left_wall",
      orientation: "right",
    });
    state = runtime.execute(state, { type: "start_assault" }).state;
    return runtime.execute(state, { type: "start_assault" }).state;
  };

  const advance = (source: GameState, steps: number): GameState => {
    let state = source;
    for (let index = 0; index < steps; index += 1) state = runtime.step(state, 0.1);
    return state;
  };

  it("applies direct attacks through damage ledgers, rewards, and source attribution", () => {
    const state = advance(configuredAssault(), 400);
    expect(state.stats.damageBySource.tower_flash).toBeGreaterThan(0);
    expect(state.stats.damageBySource.tower_caustic).toBeGreaterThan(0);
    expect(state.stats.killed).toBeGreaterThan(0);
    expect(state.pendingMatter + state.matter).toBeGreaterThan(500 - 18 - 16);
    expect(Object.values(state.towers).some((tower) => tower.kills > 0)).toBe(true);
    expect(state.nextTowerAttackId).toBeGreaterThan(1);
  });

  it("replays identically across cloning and save/load", () => {
    const checkpoint = advance(configuredAssault(), 80);
    const restored = runtime.save.decode(runtime.save.encode(checkpoint));
    expect(restored).not.toBeNull();
    if (!restored) throw new Error("Tower checkpoint failed to restore.");
    expect(advance(checkpoint, 120)).toEqual(advance(restored, 120));
  });

  it("consumes opposing coatings and attributes the neutralization heat burst", () => {
    const reactionRuntime = neutralizationRuntime();
    let state = reactionRuntime.execute(reactionRuntime.createScenario("claim_8_delta"), {
      type: "begin_level",
    }).state;
    state.matter = 500;
    state = reactionRuntime.execute(state, {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    }).state;
    state = reactionRuntime.execute(state, {
      type: "place_tower",
      chassisId: "acid_pot",
      anchor: { column: 10, elevation: 13 },
      mountFace: "floor",
      orientation: "right",
    }).state;
    state = reactionRuntime.execute(state, { type: "start_assault" }).state;
    state = reactionRuntime.execute(state, { type: "start_assault" }).state;
    for (let index = 0; index < 30; index += 1) state = reactionRuntime.step(state, 0.1);

    expect(state.stats.damageBySource.tower_neutralization).toBeGreaterThan(0);
    expect(
      state.enemies.every(
        (enemy) =>
          !enemy.effects.some((effect) => effect.kind === "acid") ||
          !enemy.effects.some((effect) => effect.kind === "caustic")
      )
    ).toBe(true);
  });
});
