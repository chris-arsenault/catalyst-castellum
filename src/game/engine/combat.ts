import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import type {
  CombatIncidentTarget,
  EnemyState,
  GameState,
  HazardChannels,
  RoomId,
  RoomState,
} from "../types";
import { roundDefinitionFor } from "./campaign";
import {
  addChannels,
  applyDamagePackets,
  channelTotal,
  dominantAppliedDamagePacket,
  dominantLedgerSource,
  emptyDamageLedger,
  emptyHazardChannels,
  type AppliedDamagePacket,
  type DamageApplication,
  type DamagePacket,
  type HazardBurst,
} from "./damage";
import { addCombatIncident, addEvent } from "./events";
import { clamp } from "./math";
import { findEnemyPath, findEnemyPathBetween } from "./navigation";
import { liquidSurfaceElevation } from "./physics";
import { roomHazards, roomMovementMultiplier } from "./roomState";
import { enemyGasZone, enemyRoomId, enemyWorldPosition } from "./enemyPosition";
import { ENEMY_WORLD_SPEED_SCALE, LOCOMOTION_SPEED } from "./enemyMovementRules";

export { enemyRoomId, enemyWorldPosition } from "./enemyPosition";

const channelsWith = (channel: keyof HazardChannels, amount: number): HazardChannels => ({
  ...emptyHazardChannels(),
  [channel]: amount,
});

const environmentalDamagePackets = (
  room: RoomState,
  enemy: EnemyState,
  dt: number,
  gameDefinition: GameDefinition
): DamagePacket[] => {
  const definition = gameDefinition.enemies[enemy.type];
  const footElevation = enemyWorldPosition(enemy).elevation - 0.5;
  const floorContact =
    !definition.flying &&
    enemy.mode !== "climbing" &&
    enemy.mode !== "falling" &&
    liquidSurfaceElevation(room, gameDefinition) > footElevation;
  const hazards = roomHazards(
    room,
    floorContact,
    definition.needsOxygen,
    enemyGasZone(enemy, gameDefinition),
    gameDefinition
  );
  return [
    {
      key: "environment:atmospheric_exposure",
      sourceId: "atmospheric_exposure",
      channels: channelsWith("atmosphere", hazards.atmosphere * dt),
    },
    {
      key: "environment:surface_corrosion",
      sourceId: "surface_corrosion",
      channels: channelsWith("corrosion", hazards.corrosion * dt),
    },
    {
      key: "environment:thermal_exposure",
      sourceId: "thermal_exposure",
      channels: channelsWith("heat", hazards.heat * dt),
    },
    {
      key: "environment:catastrophic_overpressure",
      sourceId: "catastrophic_overpressure",
      channels: channelsWith("pressure", hazards.pressure * dt),
    },
    {
      key: "environment:radiation_field",
      sourceId: "radiation_field",
      channels: channelsWith("radiation", hazards.radiation * dt),
    },
  ];
};

const burstPacket = (
  burst: HazardBurst,
  index: number,
  enemy: EnemyState,
  definition: GameDefinition
): DamagePacket => ({
  key: `burst:${index}`,
  sourceId: burst.sourceId,
  channels: {
    ...burst.channels,
    heat:
      burst.zone === null || burst.zone === enemyGasZone(enemy, definition)
        ? burst.channels.heat
        : 0,
  },
});

export const spawnEnemies = (
  state: GameState,
  gameDefinition: GameDefinition = DEFAULT_GAME_DEFINITION
): void => {
  const wave = roundDefinitionFor(state, gameDefinition).wave;
  while (state.spawnCursor < wave.length) {
    const entry = wave[state.spawnCursor];
    if (!entry || entry.at > state.phaseTime) break;
    const definition = gameDefinition.enemies[entry.type];
    const path = findEnemyPath(
      { flying: definition.flying, portalStates: state.portalStates },
      gameDefinition
    );
    if (path.length === 0) throw new Error(`No cell route reaches Core for ${entry.type}.`);
    state.enemies.push({
      id: state.nextEnemyId,
      type: entry.type,
      health: definition.health,
      maxHealth: definition.health,
      routeId: entry.routeId,
      path,
      pathIndex: 0,
      progress: 0,
      mode: definition.flying ? "flying" : "walking",
      facing: 1,
      spawnAge: 0,
      damageTaken: 0,
      damageBySource: emptyDamageLedger(),
      lastDamage: null,
    });
    state.nextEnemyId += 1;
    state.spawnCursor += 1;
    state.stats.spawned += 1;
  }
};

const appliedPacketFor = (
  application: DamageApplication,
  key: string
): AppliedDamagePacket | null => application.packets.find((packet) => packet.key === key) ?? null;

const neutralizeEnemy = (
  state: GameState,
  enemy: EnemyState,
  roomId: RoomId,
  application: DamageApplication,
  gameDefinition: GameDefinition
): void => {
  const definition = gameDefinition.enemies[enemy.type];
  const finalSource = application.dominantSource ?? dominantLedgerSource(enemy.damageBySource);
  const lifetimeSource = dominantLedgerSource(enemy.damageBySource);
  const finalChannel = application.dominantChannel;
  state.stats.killed += 1;
  if (finalSource) state.stats.killsBySource[finalSource] += 1;
  state.stats.matterHarvested += definition.matterYield;
  state.pendingMatter += definition.matterYield;
  state.rooms[roomId].residue = clamp(
    state.rooms[roomId].residue + definition.residueOnDeath,
    0,
    100
  );

  addEvent(
    state,
    "good",
    "enemy_neutralized",
    {
      enemyType: enemy.type,
      damageTaken: Math.round(enemy.damageTaken),
      finalSource: finalSource ?? "",
      finalChannel: finalChannel ?? "",
      lifetimeSource: lifetimeSource && lifetimeSource !== finalSource ? lifetimeSource : "",
      matterYield: definition.matterYield,
    },
    roomId
  );
};

interface IncidentBuilder {
  burst: HazardBurst;
  targets: CombatIncidentTarget[];
  damageByChannel: HazardChannels;
}

const incidentTone = (hitCount: number, killed: number): "good" | "warning" | "reaction" => {
  if (killed > 0) return "good";
  return hitCount > 0 ? "warning" : "reaction";
};

const recordBurstIncidents = (state: GameState, builders: IncidentBuilder[]): void => {
  for (const builder of builders) {
    const incident = addCombatIncident(state, {
      elapsed: state.elapsed,
      levelId: state.campaign.levelId,
      round: state.campaign.roundIndex + 1,
      phase: state.phase,
      roomId: builder.burst.roomId,
      zone: builder.burst.zone,
      sourceId: builder.burst.sourceId,
      reactionExtent: builder.burst.reactionExtent,
      pressureImpulse: builder.burst.pressureImpulse,
      heatDelta: builder.burst.heatDelta,
      damageByChannel: builder.damageByChannel,
      targets: builder.targets,
    });
    const killed = builder.targets.filter((target) => target.killed).length;
    const damage = channelTotal(builder.damageByChannel);
    addEvent(
      state,
      incidentTone(builder.targets.length, killed),
      "flash_incident",
      {
        hitCount: builder.targets.length,
        killed,
        damage: Math.round(damage),
        pressureImpulse: Math.round(builder.burst.pressureImpulse),
        reactionExtent: builder.burst.reactionExtent,
      },
      builder.burst.roomId,
      incident.id
    );
  }
};

const resolveCombatForEnemy = (
  state: GameState,
  enemy: EnemyState,
  dt: number,
  bursts: HazardBurst[],
  builders: IncidentBuilder[],
  definition: GameDefinition
): boolean => {
  const position = enemyWorldPosition(enemy);
  const roomId = enemyRoomId(enemy, definition);
  enemy.spawnAge += dt;
  const matchingBurstIndices = bursts.flatMap((burst, index) =>
    roomId !== null && burst.roomId === roomId ? [index] : []
  );
  const packets = [
    ...(roomId ? environmentalDamagePackets(state.rooms[roomId], enemy, dt, definition) : []),
    ...matchingBurstIndices.map((index) =>
      burstPacket(bursts[index] as HazardBurst, index, enemy, definition)
    ),
  ];
  const application = applyDamagePackets(state, enemy, packets, definition);
  const lethalPacket = dominantAppliedDamagePacket(application.packets);
  for (const index of matchingBurstIndices) {
    const packet = appliedPacketFor(application, `burst:${index}`);
    if (!packet || packet.amount <= 0) continue;
    const builder = builders[index] as IncidentBuilder;
    addChannels(builder.damageByChannel, packet.channels);
    builder.targets.push({
      enemyId: enemy.id,
      enemyType: enemy.type,
      worldPosition: position,
      healthBefore: application.healthBefore,
      healthAfter: application.healthAfter,
      damageByChannel: { ...packet.channels },
      killed: application.killed && lethalPacket?.key === packet.key,
    });
  }
  if (!application.killed || !roomId) return true;
  neutralizeEnemy(state, enemy, roomId, application, definition);
  return false;
};

/**
 * Resolves all continuous exposure and instantaneous reaction bursts before movement.
 * Bursts are recorded even when they occur during prime or find an empty room.
 */
export const resolveEnemyCombat = (
  state: GameState,
  dt: number,
  bursts: HazardBurst[],
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): void => {
  const builders = bursts.map<IncidentBuilder>((burst) => ({
    burst,
    targets: [],
    damageByChannel: emptyHazardChannels(),
  }));
  state.enemies = state.enemies.filter((enemy) =>
    resolveCombatForEnemy(state, enemy, dt, bursts, builders, definition)
  );
  recordBurstIncidents(state, builders);
};

const repathEnemy = (state: GameState, enemy: EnemyState, definition: GameDefinition): boolean => {
  const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
  if (!current) return false;
  const enemyDefinition = definition.enemies[enemy.type];
  const path = findEnemyPathBetween(
    {
      flying: enemyDefinition.flying,
      portalStates: state.portalStates,
      start: current.cell,
      goal: definition.facilityMap.coreBreachCell,
    },
    definition
  );
  if (path.length === 0) return false;
  enemy.path = path;
  enemy.pathIndex = 0;
  enemy.progress = 0;
  enemy.mode = path[0]?.mode ?? "walking";
  return true;
};

const isClosedCoreThresholdStep = (
  step: EnemyState["path"][number],
  definition: GameDefinition
): boolean =>
  step.mode === "door" &&
  step.cell.column === definition.facilityMap.coreBreachCell.column &&
  step.cell.elevation === definition.facilityMap.coreBreachCell.elevation &&
  step.portalId !== null &&
  step.portalId ===
    definition.facility.cellDefinition(definition.facilityMap.coreBreachCell).portalId &&
  definition.facility.cellDefinition(step.cell).terrain === "door";

const nextEnemySegment = (
  state: GameState,
  enemy: EnemyState,
  definition: GameDefinition
): readonly [EnemyState["path"][number], EnemyState["path"][number]] | null => {
  let current = enemy.path[enemy.pathIndex];
  let next = enemy.path[enemy.pathIndex + 1];
  if (!current || !next) return null;
  if (
    definition.facility.cellIsTraversable(next.cell, state.portalStates) ||
    isClosedCoreThresholdStep(next, definition)
  )
    return [current, next];
  if (!repathEnemy(state, enemy, definition)) return null;
  current = enemy.path[enemy.pathIndex];
  next = enemy.path[enemy.pathIndex + 1];
  return current && next ? [current, next] : null;
};

const prepareEnemySegment = (
  enemy: EnemyState,
  current: EnemyState["path"][number],
  next: EnemyState["path"][number]
): number => {
  enemy.mode = next.mode;
  if (next.cell.column !== current.cell.column) {
    enemy.facing = next.cell.column > current.cell.column ? 1 : -1;
  }
  return Math.hypot(
    next.cell.column - current.cell.column,
    next.cell.elevation - current.cell.elevation
  );
};

const moveEnemy = (
  state: GameState,
  enemy: EnemyState,
  room: RoomState | null,
  dt: number,
  gameDefinition: GameDefinition
): boolean => {
  const definition = gameDefinition.enemies[enemy.type];
  let travel =
    definition.speed *
    ENEMY_WORLD_SPEED_SCALE *
    (room ? roomMovementMultiplier(room, definition.flying, gameDefinition) : 1) *
    dt;
  while (travel > 0 && enemy.pathIndex < enemy.path.length - 1) {
    const segment = nextEnemySegment(state, enemy, gameDefinition);
    if (!segment) return false;
    const segmentLength = prepareEnemySegment(enemy, ...segment);
    const modeTravel = travel * LOCOMOTION_SPEED[enemy.mode];
    const remaining = segmentLength * (1 - enemy.progress);
    if (modeTravel < remaining) {
      enemy.progress += modeTravel / segmentLength;
      return false;
    }
    travel -= remaining / LOCOMOTION_SPEED[enemy.mode];
    enemy.pathIndex += 1;
    enemy.progress = 0;
  }
  return enemy.pathIndex >= enemy.path.length - 1;
};

const breachCore = (state: GameState, enemy: EnemyState, gameDefinition: GameDefinition): void => {
  const definition = gameDefinition.enemies[enemy.type];
  state.coreIntegrity = Math.max(0, state.coreIntegrity - definition.coreDamage);
  state.stats.breached += 1;
  state.stats.coreDamage += definition.coreDamage;
  addEvent(
    state,
    "danger",
    "core_breached",
    { enemyType: enemy.type, coreDamage: definition.coreDamage },
    "core"
  );
};

export const moveEnemies = (
  state: GameState,
  dt: number,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): void => {
  state.enemies = state.enemies.filter((enemy) => {
    const roomId = enemyRoomId(enemy, definition);
    const room = roomId ? state.rooms[roomId] : null;
    if (!moveEnemy(state, enemy, room, dt, definition)) return true;
    breachCore(state, enemy, definition);
    return false;
  });
};

export const simulateEnemies = (
  state: GameState,
  dt: number,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): void => {
  resolveEnemyCombat(state, dt, [], definition);
  moveEnemies(state, dt, definition);
};
