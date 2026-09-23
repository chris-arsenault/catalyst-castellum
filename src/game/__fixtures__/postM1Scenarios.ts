import { DEFAULT_GAME_DEFINITION, deriveGame } from "../definition";
import { createGameRuntime, DEFAULT_GAME_RUNTIME, type GameRuntime } from "../runtime";
import type { GameCommand, GameState } from "../types";

export const applyFixtureCommand = (
  runtime: GameRuntime,
  state: GameState,
  command: GameCommand
): GameState => {
  const result = runtime.execute(state, command);
  if (!result.accepted) throw new Error(`${command.type} rejected: ${result.code}`);
  return result.state;
};

export const advanceFixtureTicks = (
  runtime: GameRuntime,
  source: GameState,
  count: number
): GameState => {
  let state = source;
  for (let tick = 0; tick < count; tick += 1) state = runtime.step(state, 0.1);
  return state;
};

export const firstWaveFixture = () => {
  const runtime = DEFAULT_GAME_RUNTIME;
  const state = applyFixtureCommand(runtime, runtime.createScenario("claim_8_delta"), {
    type: "begin_level",
  });
  return { runtime, state };
};

export const directFireFixture = () => {
  const fixture = firstWaveFixture();
  const state = applyFixtureCommand(fixture.runtime, fixture.state, {
    type: "place_tower",
    chassisId: "flash_chamber",
    anchor: { column: 6, elevation: 8 },
    mountFace: "left_wall",
    orientation: "right",
  });
  return { ...fixture, state, towerId: Object.keys(state.encounter.towers)[0]! };
};

export const finiteProcessFixture = () => {
  const base = DEFAULT_GAME_DEFINITION;
  const level = base.levels.claim_8_delta;
  const definition = deriveGame(base, {
    id: "post-m1-process-characterization",
    packId: "post-m1-process-characterization",
    enemies: { ...base.enemies, glowbag: { ...base.enemies.glowbag, health: 10_000 } },
    towers: {
      ...base.towers,
      carbon_burner: {
        ...base.towers.carbon_burner,
        range: 100,
        firingArc: 320,
        lineOfSight: "lobbed",
      },
    },
    levels: {
      ...base.levels,
      claim_8_delta: {
        ...level,
        rounds: [
          {
            ...level.rounds[0]!,
            wave: [{ at: 0, type: "glowbag", routeId: "entry_to_core", levelOffset: 0 }],
            availability: { ...level.rounds[0]!.availability, towers: ["carbon_burner"] },
          },
          ...level.rounds.slice(1),
        ],
      },
    },
  });
  const runtime = createGameRuntime(definition);
  let state = applyFixtureCommand(runtime, runtime.createScenario("claim_8_delta"), {
    type: "begin_level",
  });
  state = applyFixtureCommand(runtime, state, {
    type: "place_tower",
    chassisId: "carbon_burner",
    anchor: { column: 6, elevation: 8 },
    mountFace: "left_wall",
    orientation: "right",
  });
  const towerId = Object.keys(state.encounter.towers)[0]!;
  // Authored fixture inventory funds one assisted shot; the running simulation adds none here.
  state.encounter.process.towerResources[towerId]!.gas.hydrogen = 0.5;
  return { runtime, state, towerId };
};

/** Normalize float representation to nanosecond precision; preserve the .1-second boundary. */
export const measured = (value: number): number => Number(value.toFixed(9));

/** Mechanical projection deliberately excludes the campaign/save envelope and observation buffers. */
export const combatProjection = (state: GameState) => ({
  phase: state.phase,
  elapsed: measured(state.encounter.elapsed),
  phaseTime: measured(state.encounter.phaseTime),
  matter: state.encounter.matter,
  pendingMatter: state.encounter.pendingMatter,
  core: state.encounter.coreIntegrity,
  spawned: state.encounter.stats.spawned,
  killed: state.encounter.stats.killed,
  breached: state.encounter.stats.breached,
  damage: measured(state.encounter.stats.damageDealt),
  breachesByRoute: state.encounter.stats.breachesByRoute,
  towers: Object.values(state.encounter.towers).map((tower) => ({
    id: tower.id,
    chassis: tower.chassisId,
    targetPolicy: tower.targetPolicy,
    upgrades: tower.upgrades,
    shots: tower.shots,
    kills: tower.kills,
    damage: measured(tower.damageDealt),
    cooldown: measured(tower.cooldown),
    targets: tower.currentTargetIds,
  })),
  enemies: state.encounter.enemies.map((enemy) => ({
    id: enemy.id,
    type: enemy.type,
    health: measured(enemy.health),
    pathIndex: enemy.pathIndex,
    progress: measured(enemy.progress),
    mode: enemy.mode,
    spawnAge: measured(enemy.spawnAge),
    damage: measured(enemy.damageTaken),
  })),
});

export const processProjection = (state: GameState, towerId: string) => {
  const room = state.encounter.process.rooms.switchyard!;
  return {
    ...combatProjection(state),
    storedHydrogen: measured(state.encounter.process.towerResources[towerId]!.gas.hydrogen ?? 0),
    supplyMode: state.encounter.process.towerSupply[towerId]?.mode ?? null,
    emitted: measured(state.encounter.stats.reagentEmitted),
    reservoirs: state.encounter.enemies.flatMap((enemy) =>
      enemy.behavior.kind === "gas_emitter" ? [measured(enemy.behavior.reservoir)] : []
    ),
    upperSteam: measured(room.gas.upper.steam),
    roomHydrogen: measured(room.gas.lower.hydrogen + room.gas.upper.hydrogen),
    fields: state.encounter.environmentalFields.map((field) => ({
      id: field.id,
      remaining: measured(field.remaining),
      intensity: measured(field.intensity),
    })),
  };
};
