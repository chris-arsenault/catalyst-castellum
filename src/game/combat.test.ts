import { describe, expect, it } from "vitest";
import {
  ROOM_REACTION_IDS,
  type EnemyState,
  type GameState,
  type GasAmounts,
  type HazardChannels,
  type RoomState,
} from "./types";
import { enemyRoomId, moveEnemies, resolveEnemyCombat } from "./engine/combat";
import { initialPortalStates, roomAtWorldPoint, roomVolume } from "./content/facilityGeometry";
import {
  applyDamagePackets,
  emptyDamageLedger,
  emptyHazardChannels,
  type HazardBurst,
} from "./engine/damage";
import { makeStats } from "./engine/events";
import { simulateHydrogenOxygenFlash } from "./engine/flashReaction";
import { findEnemyPath } from "./engine/navigation";
import { createScenarioGame } from "./engine/scenarioState";
import {
  CATASTROPHIC_PRESSURE_START,
  STANDARD_PRESSURE,
  pressureMovementMultiplier,
  roomHazards,
  roomStaticPressure,
} from "./engine/physics";

const gas = (scale = 1): GasAmounts => ({
  oxygen: 10.5 * scale,
  nitrogen: 39.5 * scale,
  carbon_dioxide: 0,
  chlorine: 0,
  hydrogen: 0,
  hydrogen_chloride: 0,
  steam: 0,
});

const room = (pressureScale = 1, id: RoomState["id"] = "furnace"): RoomState => ({
  id,
  gas: {
    lower: gas((pressureScale * roomVolume(id)) / 100),
    upper: gas((pressureScale * roomVolume(id)) / 100),
  },
  gasTemperature: { lower: 22, upper: 22 },
  liquid: {
    water: 0,
    sodium_chloride: 0,
    sodium_hydroxide: 0,
    sodium_hypochlorite: 0,
    hydrochloric_acid: 0,
  },
  temperature: 22,
  residue: 0,
  reactionIntensity: 0,
  pressurePulse: 0,
  flashCooldown: { lower: 0, upper: 0 },
  combustionCount: 0,
  reactions: Object.fromEntries(
    ROOM_REACTION_IDS.map((reactionId) => [
      reactionId,
      {
        lastRate: 0,
        limitingFactor: { kind: "condition", code: "conditions", zone: null },
      },
    ])
  ) as RoomState["reactions"],
  equipment: { socket_a: null, socket_b: null },
});

const enemy = (health = 200): EnemyState => {
  const path = findEnemyPath({ flying: false, portalStates: initialPortalStates() });
  const pathIndex = path.findIndex(
    (step) =>
      roomAtWorldPoint({ x: step.cell.column + 0.5, elevation: step.cell.elevation + 0.5 }) ===
      "furnace"
  );
  return {
    id: 41,
    type: "crawler",
    health,
    maxHealth: health,
    routeId: "entry_to_core",
    path,
    pathIndex,
    progress: 0,
    mode: path[pathIndex]?.mode ?? "walking",
    facing: 1,
    spawnAge: 0,
    damageTaken: 0,
    damageBySource: emptyDamageLedger(),
    lastDamage: null,
  };
};

const stateFor = (furnace: RoomState, enemies: EnemyState[] = []): GameState =>
  ({
    version: 11,
    phase: "assault",
    campaign: {
      levelId: "flash_point",
      levelIndex: 0,
      roundIndex: 0,
      checkpointLevelId: "flash_point",
      completedLevelIds: [],
    },
    phaseTime: 4,
    elapsed: 12,
    rooms: { furnace, reservoir: room(1, "reservoir") } as GameState["rooms"],
    portalStates: initialPortalStates(),
    enemies,
    spawnCursor: 0,
    nextEnemyId: 100,
    nextEventId: 1,
    nextIncidentId: 1,
    coreIntegrity: 100,
    pendingMatter: 0,
    stats: makeStats(),
    events: [],
    incidents: [],
  }) as unknown as GameState;

const burst = (channels?: Partial<HazardChannels>): HazardBurst => ({
  roomId: "furnace",
  zone: "lower",
  sourceId: "hydrogen_oxygen_combustion",
  reactionExtent: 3,
  pressureImpulse: 132,
  heatDelta: 33,
  channels: { ...emptyHazardChannels(), pressure: 80, heat: 10, ...channels },
});

describe("pressure roles", () => {
  it("slows below the catastrophic threshold without converting a transient pulse into DOT", () => {
    const slowed = room(1.7);
    slowed.pressurePulse = 190;

    expect(roomStaticPressure(slowed) / STANDARD_PRESSURE).toBeCloseTo(1.7, 6);
    expect(pressureMovementMultiplier(slowed)).toBeLessThan(1);
    expect(roomHazards(slowed).pressure).toBe(0);

    const catastrophic = room(CATASTROPHIC_PRESSURE_START + 0.1);
    expect(roomHazards(catastrophic).pressure).toBeGreaterThan(0);
  });

  it("applies room exposure only while an enemy physically occupies that room", () => {
    const target = enemy(200);
    target.pathIndex = target.path.findIndex(
      (step) => step.cell.column === 21 && step.cell.elevation === 24
    );
    target.progress = 0;
    const state = stateFor(room(CATASTROPHIC_PRESSURE_START + 0.2), [target]);

    resolveEnemyCombat(state, 0.1, []);
    expect(target.damageTaken).toBeGreaterThan(0);
    const furnaceDamage = target.damageTaken;

    moveEnemies(state, 0.5);
    expect(enemyRoomId(target)).toBe("reservoir");
    resolveEnemyCombat(state, 0.1, []);

    expect(target.damageTaken).toBeCloseTo(furnaceDamage, 8);
  });

  it("samples upper or lower gas from actual elevation rather than locomotion type", () => {
    const hostileRoom = room();
    hostileRoom.gas.lower.chlorine = 35;
    const lowTarget = enemy(200);
    lowTarget.pathIndex = lowTarget.path.findIndex(
      (step) => step.cell.column === 8 && step.cell.elevation === 14
    );
    lowTarget.mode = "climbing";
    const lowState = stateFor(hostileRoom, [lowTarget]);
    resolveEnemyCombat(lowState, 0.1, []);

    const highTarget = enemy(200);
    highTarget.pathIndex = highTarget.path.findIndex(
      (step) => step.cell.column === 8 && step.cell.elevation === 24
    );
    highTarget.mode = "climbing";
    const highState = stateFor(room(), [highTarget]);
    highState.rooms.furnace.gas.lower.chlorine = 35;
    resolveEnemyCombat(highState, 0.1, []);

    expect(lowTarget.damageTaken).toBeGreaterThan(0);
    expect(highTarget.damageTaken).toBe(0);
  });
});

describe("position-derived surface contact", () => {
  it("applies liquid contact hazards only when the physical surface reaches enemy feet", () => {
    const acidicRoom = room();
    acidicRoom.liquid.hydrochloric_acid = 10;
    const path = findEnemyPath({ flying: false, portalStates: initialPortalStates() });
    const elevated = enemy(200);
    elevated.pathIndex = path.findIndex(
      (step) => step.cell.column === 10 && step.cell.elevation === 24
    );
    elevated.mode = "walking";
    const dryState = stateFor(acidicRoom, [elevated]);

    resolveEnemyCombat(dryState, 0.1, []);

    expect(elevated.damageBySource.surface_corrosion.corrosion).toBe(0);

    const immersed = enemy(200);
    immersed.pathIndex = path.findIndex(
      (step) => step.cell.column === 8 && step.cell.elevation === 13
    );
    immersed.mode = "walking";
    const wetState = stateFor(room(), [immersed]);
    wetState.rooms.furnace.liquid.hydrochloric_acid = 10;

    resolveEnemyCombat(wetState, 0.1, []);

    expect(immersed.damageBySource.surface_corrosion.corrosion).toBeGreaterThan(0);
  });
});

describe("damage attribution", () => {
  it("attributes catastrophic static-pressure DOT separately from combustion", () => {
    const target = enemy(200);
    const state = stateFor(room(CATASTROPHIC_PRESSURE_START + 0.2), [target]);

    resolveEnemyCombat(state, 1, []);

    expect(target.damageBySource.catastrophic_overpressure.pressure).toBeGreaterThan(0);
    expect(target.damageBySource.hydrogen_oxygen_combustion.pressure).toBe(0);
    expect(state.stats.damageBySource.catastrophic_overpressure).toBeCloseTo(target.damageTaken, 8);
  });
});

describe("cell locomotion integration", () => {
  it("walks, climbs, falls, and crosses the sealed Core door at simulated cell positions", () => {
    const state = createScenarioGame("flash_point");
    const target = enemy(500);
    target.pathIndex = 0;
    target.progress = 0;
    target.mode = "walking";
    state.enemies = [target];
    const modes = new Set<EnemyState["mode"]>();
    const occupiedRooms = new Set<RoomState["id"]>();

    for (let step = 0; step < 1_200 && state.enemies.length > 0; step += 1) {
      const active = state.enemies[0]!;
      modes.add(active.mode);
      const roomId = enemyRoomId(active);
      if (roomId) occupiedRooms.add(roomId);
      moveEnemies(state, 0.05);
    }

    expect(state.stats.breached).toBe(1);
    expect([...modes]).toEqual(expect.arrayContaining(["walking", "climbing", "falling", "door"]));
    expect([...occupiedRooms]).toEqual(
      expect.arrayContaining([
        "west_intake",
        "switchyard",
        "furnace",
        "reservoir",
        "gallery",
        "lower_intake",
        "washlock",
      ])
    );
  });
});

describe("central damage resolution", () => {
  it("proportionally caps a lethal frame without packet-order attribution bias", () => {
    const forwardState = stateFor(room());
    const forwardEnemy = enemy(100);
    const corrosion = {
      key: "corrosion",
      sourceId: "surface_corrosion" as const,
      channels: { ...emptyHazardChannels(), corrosion: 80 },
    };
    const pressure = {
      key: "pressure",
      sourceId: "catastrophic_overpressure" as const,
      channels: { ...emptyHazardChannels(), pressure: 80 },
    };
    applyDamagePackets(forwardState, forwardEnemy, [corrosion, pressure]);

    const reverseState = stateFor(room());
    const reverseEnemy = enemy(100);
    applyDamagePackets(reverseState, reverseEnemy, [pressure, corrosion]);

    expect(forwardEnemy.damageTaken).toBeCloseTo(100, 8);
    expect(forwardEnemy.damageBySource.surface_corrosion.corrosion).toBeCloseTo(50, 8);
    expect(forwardEnemy.damageBySource.catastrophic_overpressure.pressure).toBeCloseTo(50, 8);
    expect(reverseEnemy.damageBySource).toEqual(forwardEnemy.damageBySource);
    expect(forwardState.stats.damageByChannel).toEqual(reverseState.stats.damageByChannel);
    expect(reverseEnemy.lastDamage?.sourceId).toBe(forwardEnemy.lastDamage?.sourceId);
  });
});

describe("OX-1 burst incidents", () => {
  it("turns a real conserved H₂/O₂ reaction into an explicit combat burst", () => {
    const target = enemy(200);
    const state = stateFor(room(), [target]);
    state.rooms.furnace.gas.lower.hydrogen = 16;

    const flash = simulateHydrogenOxygenFlash(state, state.rooms.furnace, "lower", 0.1);
    expect(flash).not.toBeNull();
    if (!flash) throw new Error("Expected the prepared mixture to ignite");
    resolveEnemyCombat(state, 0.1, [flash]);

    expect(state.rooms.furnace.gas.lower.hydrogen).toBeLessThan(16);
    expect(state.rooms.furnace.gas.lower.steam).toBeGreaterThan(6);
    expect(target.damageBySource.hydrogen_oxygen_combustion.pressure).toBeGreaterThan(80);
    expect(state.incidents[0]?.reactionExtent).toBeCloseTo(6, 8);
  });

  it("applies a flash once and never turns its residual pressure impulse into later damage", () => {
    const target = enemy(200);
    const state = stateFor(room(), [target]);
    state.rooms.furnace.pressurePulse = 190;

    resolveEnemyCombat(state, 0.1, [burst()]);

    expect(target.damageBySource.hydrogen_oxygen_combustion.pressure).toBeCloseTo(80, 8);
    expect(target.damageBySource.hydrogen_oxygen_combustion.heat).toBeCloseTo(10, 8);
    expect(state.incidents).toHaveLength(1);
    expect(state.incidents[0]?.targets).toHaveLength(1);
    const afterFlash = target.damageTaken;

    resolveEnemyCombat(state, 0.1, []);

    expect(target.damageTaken).toBeCloseTo(afterFlash, 8);
    expect(target.damageBySource.catastrophic_overpressure.pressure).toBe(0);
  });

  it("records an empty flash but does not damage an enemy that arrives during the residual pulse", () => {
    const state = stateFor(room());
    state.rooms.furnace.pressurePulse = 190;
    resolveEnemyCombat(state, 0.1, [burst()]);

    expect(state.incidents[0]?.targets).toEqual([]);
    const lateEnemy = enemy(200);
    state.enemies.push(lateEnemy);
    resolveEnemyCombat(state, 0.1, []);

    expect(lateEnemy.damageTaken).toBe(0);
    expect(lateEnemy.damageBySource.hydrogen_oxygen_combustion.pressure).toBe(0);
  });

  it("records actual capped damage and attributes a flash kill in incidents, events, and stats", () => {
    const state = stateFor(room(), [enemy(74)]);
    resolveEnemyCombat(state, 0.1, [burst({ heat: 0 })]);

    expect(state.enemies).toEqual([]);
    expect(state.stats.damageDealt).toBeCloseTo(74, 8);
    expect(state.stats.damageBySource.hydrogen_oxygen_combustion).toBeCloseTo(74, 8);
    expect(state.stats.killsBySource.hydrogen_oxygen_combustion).toBe(1);
    expect(state.incidents[0]?.damageByChannel.pressure).toBeCloseTo(74, 8);
    expect(state.incidents[0]?.targets[0]?.killed).toBe(true);
    expect(state.events.some((event) => event.code === "enemy_neutralized")).toBe(true);
  });
});
