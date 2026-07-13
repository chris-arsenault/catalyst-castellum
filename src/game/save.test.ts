import { describe, expect, it } from "vitest";
import { emptyGas, emptyLiquid } from "./config";
import { emptyDamageLedger, emptyHazardChannels } from "./engine/damage";
import { decodeGame, encodeGame } from "./save";
import { findEnemyPath } from "./engine/navigation";
import { createScenarioGame } from "./simulation";
import { TRANSPORT_RUN_IDS, type EnemyState, type GameState } from "./types";

const persistedEnemy = (game: GameState): EnemyState => {
  const path = findEnemyPath({ flying: false, portalStates: game.portalStates });
  return {
    id: 9,
    type: "crawler",
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
  };
};

describe("v11 persistence", () => {
  it("round-trips conduit routes, damage ledgers, and structured incidents", () => {
    const game = createScenarioGame("flash_point");
    game.phase = "assault";
    game.gasConduits.core_furnace.enabled = true;
    game.gasConduits.core_furnace.gas.hydrogen = 4;
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
          enemyType: "crawler",
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
    if (!decoded) throw new Error("Expected the v11 save to decode.");
    expect(decoded.version).toBe(11);
    expect(decoded.gasConduits.core_furnace.route).toEqual(game.gasConduits.core_furnace.route);
    expect(decoded.enemies[0]?.damageBySource.hydrogen_oxygen_combustion.pressure).toBe(53);
    expect(decoded.enemies[0]?.path).toEqual(game.enemies[0]?.path);
    expect(decoded.enemies[0]).toMatchObject({
      pathIndex: 12,
      progress: 0.2,
      mode: game.enemies[0]?.mode,
      facing: 1,
    });
    expect(decoded.incidents[0]?.targets[0]?.healthAfter).toBe(21);
    expect(decoded.portalStates).toEqual(game.portalStates);
  });
});

describe("v11 compatibility decoding", () => {
  it("migrates a structurally current v10 snapshot to v11", () => {
    const game = createScenarioGame("make_the_reagent");
    const envelope = JSON.parse(encodeGame(game)) as {
      game: Omit<GameState, "version"> & { version: number };
    };
    envelope.game.version = 10;
    const legacyShape = envelope.game as unknown as {
      rooms: Record<string, { reactions: Record<string, Record<string, unknown>> }>;
      processes: Record<string, Record<string, unknown>>;
    };
    const legacyReaction = legacyShape.rooms.furnace!.reactions.hydrogen_oxygen_combustion!;
    delete legacyReaction.limitingFactor;
    legacyReaction.limitingReactant = "legacy reaction feed";
    const legacyProcess = legacyShape.processes.chlor_alkali_cell!;
    delete legacyProcess.limitingFactor;
    legacyProcess.limitingReactant = "legacy process feed";
    const decoded = decodeGame(JSON.stringify(envelope));

    expect(decoded?.version).toBe(11);
    expect(decoded?.campaign.levelId).toBe("make_the_reagent");
    expect(decoded?.rooms.furnace.reactions.hydrogen_oxygen_combustion.limitingFactor).toEqual({
      kind: "legacy",
      label: "legacy reaction feed",
    });
    expect(decoded?.processes.chlor_alkali_cell.limitingFactor).toEqual({
      kind: "legacy",
      label: "legacy process feed",
    });
  });

  it("rejects malformed state", () => {
    expect(decodeGame("not-json")).toBeNull();
    expect(decodeGame(JSON.stringify({ format: "catalyst-castellum-save", game: {} }))).toBeNull();
  });
});

describe("v11 canonical portal persistence", () => {
  it("rejects state missing any canonical portal state", () => {
    const game = createScenarioGame("flash_point");
    const malformed = { ...game, portalStates: {} };
    expect(
      decodeGame(
        JSON.stringify({
          format: "catalyst-castellum-save",
          savedAt: new Date(0).toISOString(),
          game: malformed,
        })
      )
    ).toBeNull();
  });
});

describe("v11 enemy navigation persistence", () => {
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

describe("v8 spatial migration", () => {
  it("converts room-segment enemies into cell navigation and initializes portal state", () => {
    const current = createScenarioGame("flash_point");
    const { portalStates: omittedPortalStates, ...legacyBase } = current;
    expect(omittedPortalStates.washlock_to_core_door?.sealed).toBe(true);
    const legacy = {
      ...legacyBase,
      version: 8,
      phase: "assault",
      events: current.events.map(({ code: _code, parameters: _parameters, ...event }) => ({
        ...event,
        title: "Legacy scenario",
        detail: "Legacy event detail",
      })),
      enemies: [
        {
          id: 7,
          type: "crawler",
          health: 60,
          maxHealth: 74,
          route: [
            "west_intake",
            "switchyard",
            "furnace",
            "reservoir",
            "gallery",
            "lower_intake",
            "washlock",
            "core",
          ],
          segment: 2,
          progress: 0.4,
          spawnAge: 3,
          damageTaken: 14,
          damageBySource: emptyDamageLedger(),
          lastDamage: null,
        },
      ],
    };
    const decoded = decodeGame(
      JSON.stringify({
        format: "catalyst-castellum-save",
        savedAt: new Date(0).toISOString(),
        game: legacy,
      })
    );

    expect(decoded).not.toBeNull();
    if (!decoded) throw new Error("Expected the v8 save to migrate.");
    expect(decoded.version).toBe(11);
    expect(decoded.enemies[0]?.routeId).toBe("entry_to_core");
    expect(decoded.enemies[0]?.path.length).toBeGreaterThan(1);
    expect(decoded.portalStates.switchyard_to_furnace_shaft?.open).toBe(true);
    expect(decoded.portalStates.washlock_to_core_door?.sealed).toBe(true);
  });
});

const legacyGasIds = [
  "gas_oxygen_to_furnace",
  "gas_anode_to_furnace",
  "gas_cathode_to_furnace",
  "gas_cathode_relief",
  "gas_anode_to_absorber",
  "gas_acid_return",
  "gas_final_header",
  "gas_outer_bleed",
  "gas_furnace_exhaust",
  "gas_final_exhaust",
] as const;
const legacyLiquidIds = [
  "liquid_water_to_cell",
  "liquid_salt_to_cell",
  "liquid_liquor_to_absorber",
  "liquid_liquor_recovery",
  "liquid_water_to_final",
  "liquid_hypochlorite_to_final",
  "liquid_absorber_recycle",
  "liquid_cell_drain",
  "liquid_absorber_drain",
  "liquid_final_drain",
] as const;

describe("conserving v7 migration", () => {
  it("merges hidden sub-lines by run+phase without discarding material and leaves them off", () => {
    const baseline = createScenarioGame("flash_point");
    const gasLines = Object.fromEntries(
      legacyGasIds.map((id) => [id, { setting: 1, gas: emptyGas(), temperature: 20 }])
    ) as Record<
      (typeof legacyGasIds)[number],
      { setting: number; gas: ReturnType<typeof emptyGas>; temperature: number }
    >;
    gasLines.gas_oxygen_to_furnace.gas.oxygen = 7;
    gasLines.gas_cathode_to_furnace.gas.hydrogen = 5;
    gasLines.gas_cathode_to_furnace.temperature = 60;
    gasLines.gas_furnace_exhaust.gas.nitrogen = 3;
    const liquidLines = Object.fromEntries(
      legacyLiquidIds.map((id) => [id, { setting: 1, liquid: emptyLiquid() }])
    ) as Record<
      (typeof legacyLiquidIds)[number],
      { setting: number; liquid: ReturnType<typeof emptyLiquid> }
    >;
    liquidLines.liquid_water_to_cell.liquid.water = 4;
    liquidLines.liquid_salt_to_cell.liquid.sodium_chloride = 6;
    const transportRuns = Object.fromEntries(
      TRANSPORT_RUN_IDS.map((id) => [id, { gasInstalled: true, liquidInstalled: true }])
    );
    const gasBuffers = {
      ...baseline.gasBuffers,
      cathode_header: { gas: { ...emptyGas(), hydrogen: 13 } },
    };
    const legacy = {
      format: "catalyst-castellum-save",
      savedAt: new Date().toISOString(),
      game: {
        version: 7,
        campaign: { ...baseline.campaign, roundIndex: 99 },
        rooms: baseline.rooms,
        gasSources: { oxygen_tank: { gas: { ...emptyGas(), oxygen: 11, nitrogen: 2 } } },
        liquidSources: baseline.liquidSources,
        gasBuffers,
        liquidBuffers: baseline.liquidBuffers,
        gasLines,
        liquidLines,
        transportRuns,
        processes: baseline.processes,
        gasVent: baseline.gasVent,
        liquidDrain: baseline.liquidDrain,
        coreIntegrity: 91,
        matter: 17,
        pendingMatter: 3,
      },
    };

    const migrated = decodeGame(JSON.stringify(legacy));
    expect(migrated).not.toBeNull();
    if (!migrated) throw new Error("Expected the valid V7 fixture to migrate");
    expect(migrated.gasConduits.core_furnace.gas.oxygen).toBe(7);
    expect(migrated.gasConduits.core_furnace.gas.hydrogen).toBe(5);
    expect(migrated.gasConduits.core_furnace.gas.nitrogen).toBe(3);
    expect(migrated.gasConduits.core_furnace.enabled).toBe(false);
    expect(migrated.gasConduits.absorber_final.installed).toBe(false);
    expect(migrated.liquidConduits.furnace_return.installed).toBe(false);
    expect(migrated.liquidConduits.core_cell.liquid.water).toBe(4);
    expect(migrated.liquidConduits.core_cell.liquid.sodium_chloride).toBe(6);
    expect(migrated.gasSources.starter_gas_header.gas.oxygen).toBe(11);
    expect(migrated.gasSources.starter_gas_header.gas.nitrogen).toBe(2);
    expect(migrated.gasSources.starter_gas_header.gas.hydrogen).toBe(13);
    expect(migrated.gasBuffers.cathode_header.gas.hydrogen).toBe(0);
    expect(migrated.campaign.roundIndex).toBe(1);
    expect(migrated.events[0]?.code).toBe("physical_conduit_migrated");
  });
});
