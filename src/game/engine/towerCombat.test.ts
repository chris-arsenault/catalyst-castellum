import { campaignEncounterContext } from "./campaignEncounter";
import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../definition";
import { DEFAULT_GAME_RUNTIME as runtime } from "../runtime";
import type { EnemyState, EnemyType, GameState, GridCell, TowerChassisId } from "../types";
import { emptyDamageLedger } from "./damage";
import { initialEnemyBehaviorState } from "./enemyBehaviors";
import { simulateTowers } from "./towerCombat";

const configuredTower = (chassisId: TowerChassisId) => {
  let state = runtime.execute(runtime.createScenario("claim_8_delta"), {
    type: "begin_level",
  }).state;
  state.encounter.matter = 500;
  if (!state.encounter.availability.towers.includes(chassisId))
    state.encounter.availability.towers.push(chassisId);
  const floor = chassisId === "acid_pot";
  const result = runtime.execute(state, {
    type: "place_tower",
    chassisId,
    anchor: floor ? { column: 10, elevation: 13 } : { column: 6, elevation: 8 },
    mountFace: floor ? "floor" : "left_wall",
    orientation: "right",
  });
  expect(result.accepted, result.code ?? undefined).toBe(true);
  state = result.state;
  return { state, tower: Object.values(state.encounter.towers)[0]! };
};

const enemyAt = (
  id: number,
  cell: GridCell,
  type: EnemyType = "deckmouth",
  health = 1_000_000
): EnemyState => ({
  id,
  type,
  level: 1,
  health,
  maxHealth: health,
  routeId: "entry_to_core",
  path: [{ cell, mode: "walking", portalId: null }],
  pathIndex: 0,
  progress: 0,
  mode: "walking",
  facing: 1,
  spawnAge: 0,
  damageTaken: 0,
  damageBySource: emptyDamageLedger(),
  lastDamage: null,
  behavior: initialEnemyBehaviorState(DEFAULT_GAME_DEFINITION.enemies[type], 1),
  effects: [],
});

const advanceCombat = (state: GameState, ticks: number): void => {
  for (let tick = 0; tick < ticks; tick += 1) {
    state.encounter.elapsed += 0.1;
    simulateTowers(state.encounter, 0.1, campaignEncounterContext(state, DEFAULT_GAME_DEFINITION));
  }
};

const acceleratedTower = () => {
  const { state, tower } = configuredTower("flash_chamber");
  const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
    towers: {
      ...DEFAULT_GAME_DEFINITION.towers,
      flash_chamber: { ...DEFAULT_GAME_DEFINITION.towers.flash_chamber, cadence: 10 },
    },
  });
  state.encounter.environmentalFields = [
    {
      id: "cadence-fixture",
      sourceId: tower.id,
      effect: "cadence",
      roomId: "switchyard",
      zone: "both",
      intensity: 0.9,
      remaining: 100,
      decayPerSecond: 0,
      stacking: "strongest",
      species: null,
    },
  ];
  return { state, tower, definition };
};

describe("area attack eligibility", () => {
  it("keeps flying enemies outside a ground-only splash and its control effects", () => {
    const { state, tower } = configuredTower("quench_coil");
    const ground = enemyAt(2, { column: 9, elevation: 8 });
    const flyer = enemyAt(1, { column: 9, elevation: 8 }, "shear_jelly");
    state.encounter.enemies = [ground, flyer];

    advanceCombat(state, 1);

    expect(tower.currentTargetIds).toEqual([ground.id]);
    expect(ground.damageTaken).toBeGreaterThan(0);
    expect(ground.effects.some(({ kind }) => kind === "slow")).toBe(true);
    expect(flyer.damageTaken).toBe(0);
    expect(flyer.effects).toEqual([]);
  });

  it("retains the selected primary when older nearby enemies fill the splash cap", () => {
    const { state, tower } = configuredTower("quench_coil");
    tower.targetPolicy = "strongest";
    const primary = enemyAt(10, { column: 9, elevation: 8 }, "deckmouth", 2_000_000);
    const others = [1, 2, 3].map((id) => enemyAt(id, { column: 9, elevation: 8 }));
    state.encounter.enemies = [...others, primary];

    advanceCombat(state, 1);

    expect(tower.currentTargetIds).toEqual([10, 1, 2]);
    expect(primary.damageTaken).toBeGreaterThan(0);
    expect(others[2]!.damageTaken).toBe(0);
    expect(state.encounter.towerAttacks[0]!.targetEnemyIds[0]).toBe(primary.id);
  });

  it("blocks splash across architecture even when the lob can reach its primary", () => {
    const { state, tower } = configuredTower("acid_pot");
    tower.targetPolicy = "strongest";
    const room = state.encounter.map.rooms.furnace!;
    state.encounter.map = {
      ...state.encounter.map,
      rooms: {
        ...state.encounter.map.rooms,
        furnace: {
          ...room,
          platformCells: [...room.platformCells, { column: 15, elevation: 15 }],
        },
      },
    };
    const primary = enemyAt(10, { column: 14, elevation: 15 }, "deckmouth", 2_000_000);
    const blocked = enemyAt(1, { column: 16, elevation: 15 });
    state.encounter.enemies = [primary, blocked];

    advanceCombat(state, 1);

    expect(primary.damageTaken).toBeGreaterThan(0);
    expect(blocked.damageTaken).toBe(0);
    expect(blocked.effects).toEqual([]);
    expect(tower.currentTargetIds).toEqual([primary.id]);
  });
});

describe("cone attack geometry", () => {
  it("covers the full cone while excluding nearby enemies outside its arc", () => {
    const { state, tower } = configuredTower("carbon_burner");
    const primary = enemyAt(1, { column: 9, elevation: 8 });
    const outsideArc = enemyAt(2, { column: 9, elevation: 10 });
    const distant = enemyAt(3, { column: 13, elevation: 8 });
    state.encounter.enemies = [primary, outsideArc, distant];

    advanceCombat(state, 1);

    expect(tower.currentTargetIds).toEqual([primary.id, distant.id]);
    expect(distant.damageTaken).toBeGreaterThan(0);
    expect(outsideArc.damageTaken).toBe(0);
  });

  it("respects line of sight to each enemy in a cone", () => {
    const { state, tower } = configuredTower("carbon_burner");
    const room = state.encounter.map.rooms.switchyard!;
    state.encounter.map = {
      ...state.encounter.map,
      rooms: {
        ...state.encounter.map.rooms,
        switchyard: {
          ...room,
          platformCells: [{ column: 10, elevation: 8 }],
        },
      },
    };
    const primary = enemyAt(1, { column: 9, elevation: 8 });
    const blocked = enemyAt(2, { column: 11, elevation: 8 });
    state.encounter.enemies = [primary, blocked];

    advanceCombat(state, 1);

    expect(tower.currentTargetIds).toEqual([primary.id]);
    expect(blocked.damageTaken).toBe(0);
  });
});

describe("environmental tower cadence", () => {
  it("services a 19-per-second environmental cadence across fixed ticks", () => {
    const { state, tower, definition } = acceleratedTower();
    state.encounter.enemies = [enemyAt(1, { column: 9, elevation: 8 })];

    for (let tick = 0; tick < 100; tick += 1) {
      state.encounter.elapsed += 0.1;
      simulateTowers(state.encounter, 0.1, campaignEncounterContext(state, definition));
    }

    expect(tower.shots).toBe(189);
    expect(tower.telemetry.engagedSeconds).toBeCloseTo(10);
    expect(tower.cooldown).toBeGreaterThanOrEqual(0);
  });

  it("reacquires after a kill within the same tick", () => {
    const { state, tower, definition } = acceleratedTower();
    tower.cooldown = 0.01;
    state.encounter.enemies = [
      enemyAt(1, { column: 9, elevation: 8 }, "deckmouth", 1),
      enemyAt(2, { column: 9, elevation: 8 }),
    ];

    simulateTowers(state.encounter, 0.1, campaignEncounterContext(state, definition));

    expect(tower.shots).toBe(2);
    expect(tower.kills).toBe(1);
    expect(state.encounter.towerAttacks.map((attack) => attack.targetEnemyIds)).toEqual([[1], [2]]);
    expect(tower.telemetry.engagedSeconds).toBeCloseTo(0.1);
  });

  it("rechecks supply between ready attacks and discards paused firing debt", () => {
    const fixture = acceleratedTower();
    const { state, tower } = fixture;
    const definition = deriveGame(fixture.definition, {
      towers: {
        ...fixture.definition.towers,
        flash_chamber: {
          ...fixture.definition.towers.flash_chamber,
          supply: {
            port: "gas",
            acceptedSpecies: ["oxygen"],
            rate: 1,
            localCapacity: 1,
            insufficientFlow: "pause",
          },
        },
      },
    });
    tower.cooldown = 0.01;
    state.encounter.process.towerResources[tower.id]!.gas.oxygen = 0.1;
    state.encounter.enemies = [enemyAt(1, { column: 9, elevation: 8 })];

    simulateTowers(state.encounter, 0.1, campaignEncounterContext(state, definition));

    expect(tower.shots).toBe(1);
    expect(state.encounter.process.towerResources[tower.id]!.gas.oxygen).toBeCloseTo(0);
    expect(tower.downtimeReason).toBe("supply");
    expect(tower.cooldown).toBe(0);
    expect(tower.telemetry.engagedSeconds).toBeCloseTo(0.1);
    expect(tower.telemetry.downtime.supply).toBe(0);

    state.encounter.process.towerResources[tower.id]!.gas.oxygen = 0.1;
    simulateTowers(state.encounter, 0.1, campaignEncounterContext(state, definition));
    expect(tower.shots).toBe(2);
  });

  it("rejects service rates outside the compiled fixed-tick invariant", () => {
    const { state, tower, definition } = acceleratedTower();
    state.encounter.enemies = [enemyAt(1, { column: 9, elevation: 8 })];
    const invalid = {
      ...definition,
      towers: {
        ...definition.towers,
        flash_chamber: { ...definition.towers.flash_chamber, cadence: 11 },
      },
    };
    expect(() =>
      simulateTowers(state.encounter, 0.1, campaignEncounterContext(state, invalid))
    ).toThrow("supported finite service bounds");
    expect(tower.shots).toBe(0);
  });
});

describe("tower cadence", () => {
  it.each([
    { upgraded: false, shots: 32 },
    { upgraded: true, shots: 46 },
  ])("preserves fractional time with upgraded=$upgraded", ({ upgraded, shots }) => {
    const { state, tower } = configuredTower("caustic_jet");
    if (upgraded) tower.upgrades = ["caustic_manifold"];
    state.encounter.enemies = [enemyAt(1, { column: 9, elevation: 8 })];

    advanceCombat(state, 100);

    expect(tower.shots).toBe(shots);
    expect(tower.cooldown).toBeGreaterThanOrEqual(0);
  });

  it("retains one ready shot after a long idle interval", () => {
    const { state, tower } = configuredTower("caustic_jet");
    state.encounter.enemies = [enemyAt(1, { column: 9, elevation: 8 })];
    advanceCombat(state, 2);
    expect(tower.shots).toBe(1);
    state.encounter.enemies = [];
    advanceCombat(state, 100);
    expect(tower.cooldown).toBe(0);
    state.encounter.enemies = [enemyAt(2, { column: 9, elevation: 8 })];

    advanceCombat(state, 1);
    expect(tower.shots).toBe(2);
    advanceCombat(state, 3);
    expect(tower.shots).toBe(2);
    advanceCombat(state, 1);
    expect(tower.shots).toBe(3);
  });
});

describe("dismantling after instant damage", () => {
  it("saves combat between ticks after removing a tower with a visible attack", () => {
    const fixture = configuredTower("flash_chamber");
    let state = runtime.execute(fixture.state, { type: "start_assault" }).state;
    for (let tick = 0; tick < 100 && state.encounter.towerAttacks.length === 0; tick += 1) {
      state = runtime.step(state, 0.1);
    }
    expect(state.encounter.towerAttacks.length).toBeGreaterThan(0);
    const beforeDamage = state.encounter.stats.damageBySource.tower_flash;
    expect(beforeDamage).toBeGreaterThan(0);

    const result = runtime.execute(state, {
      type: "dismantle_tower",
      towerId: fixture.tower.id,
    });

    expect(result.accepted).toBe(true);
    expect(result.state.encounter.towerAttacks).toEqual([]);
    expect(result.state.encounter.stats.damageBySource.tower_flash).toBe(beforeDamage);
    expect(runtime.validate(result.state)).toEqual([]);
    expect(runtime.save.decode(runtime.save.encode(result.state))).toEqual(result.state);
  });
});
