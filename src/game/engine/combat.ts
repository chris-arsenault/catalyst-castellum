import { ENEMY_DEFINITIONS } from "../content/enemies";
import {
  FACILITY_MAP,
  facilityCellDefinition,
  facilityCellIsTraversable,
  gridCellToWorldPoint,
  roomAtWorldPoint,
} from "../content/facilityGeometry";
import type {
  CombatIncidentTarget,
  DamageSourceId,
  EnemyState,
  GameState,
  GasZone,
  HazardChannels,
  RoomId,
  RoomState,
  WorldPoint,
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

const ENEMY_WORLD_SPEED_SCALE = 32;
const LOCOMOTION_SPEED: Record<EnemyState["mode"], number> = {
  walking: 1,
  climbing: 0.68,
  falling: 1.7,
  door: 0.72,
  flying: 1,
};

const SOURCE_LABELS: Record<DamageSourceId, string> = {
  atmospheric_exposure: "atmospheric exposure",
  surface_corrosion: "surface corrosion",
  thermal_exposure: "thermal exposure",
  catastrophic_overpressure: "catastrophic static pressure",
  radiation_field: "radiation field",
  hydrogen_oxygen_combustion: "OX-1 flash",
  legacy_unattributed: "legacy environmental exposure",
};

export const enemyWorldPosition = (enemy: EnemyState): WorldPoint => {
  const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
  if (!current) throw new Error(`Enemy ${enemy.id} has no cell navigation path.`);
  const next = enemy.path[Math.min(enemy.pathIndex + 1, enemy.path.length - 1)] ?? current;
  const from = gridCellToWorldPoint(current.cell);
  const to = gridCellToWorldPoint(next.cell);
  return {
    x: from.x + (to.x - from.x) * enemy.progress,
    elevation: from.elevation + (to.elevation - from.elevation) * enemy.progress,
  };
};

export const enemyRoomId = (enemy: EnemyState): RoomId | null =>
  roomAtWorldPoint(enemyWorldPosition(enemy));

const channelsWith = (channel: keyof HazardChannels, amount: number): HazardChannels => ({
  ...emptyHazardChannels(),
  [channel]: amount,
});

const environmentalDamagePackets = (
  room: RoomState,
  enemy: EnemyState,
  dt: number
): DamagePacket[] => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const footElevation = enemyWorldPosition(enemy).elevation - 0.5;
  const floorContact =
    !definition.flying &&
    enemy.mode !== "climbing" &&
    enemy.mode !== "falling" &&
    liquidSurfaceElevation(room) > footElevation;
  const hazards = roomHazards(room, floorContact, definition.needsOxygen, enemyGasZone(enemy));
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

const enemyGasZone = (enemy: EnemyState): GasZone => {
  const roomId = enemyRoomId(enemy);
  if (!roomId) return "lower";
  const bounds = FACILITY_MAP.rooms[roomId].bounds;
  const relativeElevation =
    (enemyWorldPosition(enemy).elevation - bounds.elevation) / bounds.height;
  return relativeElevation >= 0.5 ? "upper" : "lower";
};

const burstPacket = (burst: HazardBurst, index: number, enemy: EnemyState): DamagePacket => ({
  key: `burst:${index}`,
  sourceId: burst.sourceId,
  channels: {
    ...burst.channels,
    heat: burst.zone === null || burst.zone === enemyGasZone(enemy) ? burst.channels.heat : 0,
  },
});

export const spawnEnemies = (state: GameState): void => {
  const wave = roundDefinitionFor(state).wave;
  while (state.spawnCursor < wave.length) {
    const entry = wave[state.spawnCursor];
    if (!entry || entry.at > state.phaseTime) break;
    const definition = ENEMY_DEFINITIONS[entry.type];
    const path = findEnemyPath({ flying: definition.flying, portalStates: state.portalStates });
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
  application: DamageApplication
): void => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
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

  const finalCause = finalSource ? SOURCE_LABELS[finalSource] : "environmental exposure";
  const channel = finalChannel ? ` ${finalChannel}` : "";
  const lifetime =
    lifetimeSource && lifetimeSource !== finalSource
      ? ` Dominant lifetime source: ${SOURCE_LABELS[lifetimeSource]}.`
      : "";
  addEvent(
    state,
    "good",
    `${definition.name} neutralized — ${finalCause}`,
    `${Math.round(enemy.damageTaken)} total damage; final${channel} contribution from ${finalCause}.${lifetime} ${definition.matterYield} matter recoverable.`,
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
    const hitSummary =
      builder.targets.length === 0
        ? "No hostiles occupied the chamber at the instant of ignition."
        : `${builder.targets.length} hit; ${killed} neutralized; ${Math.round(damage)} applied pressure/heat damage.`;
    addEvent(
      state,
      incidentTone(builder.targets.length, killed),
      `OX-1 flash — ${builder.targets.length} hit, ${killed} neutralized`,
      `${Math.round(builder.burst.pressureImpulse)} kPa impulse from ${builder.burst.reactionExtent.toFixed(2)} mol-eq. ${hitSummary}`,
      builder.burst.roomId,
      incident.id
    );
  }
};

/**
 * Resolves all continuous exposure and instantaneous reaction bursts before movement.
 * Bursts are recorded even when they occur during prime or find an empty room.
 */
export const resolveEnemyCombat = (state: GameState, dt: number, bursts: HazardBurst[]): void => {
  const builders = bursts.map<IncidentBuilder>((burst) => ({
    burst,
    targets: [],
    damageByChannel: emptyHazardChannels(),
  }));
  const survivors: EnemyState[] = [];

  for (const enemy of state.enemies) {
    const position = enemyWorldPosition(enemy);
    const roomId = enemyRoomId(enemy);
    enemy.spawnAge += dt;
    const matchingBurstIndices = bursts.flatMap((burst, index) =>
      roomId !== null && burst.roomId === roomId ? [index] : []
    );
    const packets = [
      ...(roomId ? environmentalDamagePackets(state.rooms[roomId], enemy, dt) : []),
      ...matchingBurstIndices.map((index) =>
        burstPacket(bursts[index] as HazardBurst, index, enemy)
      ),
    ];
    const application = applyDamagePackets(state, enemy, packets);
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

    if (application.killed && roomId) neutralizeEnemy(state, enemy, roomId, application);
    else survivors.push(enemy);
  }

  state.enemies = survivors;
  recordBurstIncidents(state, builders);
};

const repathEnemy = (state: GameState, enemy: EnemyState): boolean => {
  const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
  if (!current) return false;
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const path = findEnemyPathBetween({
    flying: definition.flying,
    portalStates: state.portalStates,
    start: current.cell,
    goal: FACILITY_MAP.coreBreachCell,
  });
  if (path.length === 0) return false;
  enemy.path = path;
  enemy.pathIndex = 0;
  enemy.progress = 0;
  enemy.mode = path[0]?.mode ?? "walking";
  return true;
};

const isClosedCoreThresholdStep = (step: EnemyState["path"][number]): boolean =>
  step.mode === "door" &&
  step.cell.column === FACILITY_MAP.coreBreachCell.column &&
  step.cell.elevation === FACILITY_MAP.coreBreachCell.elevation &&
  step.portalId !== null &&
  step.portalId === facilityCellDefinition(FACILITY_MAP.coreBreachCell).portalId &&
  facilityCellDefinition(step.cell).terrain === "door";

const nextEnemySegment = (
  state: GameState,
  enemy: EnemyState
): readonly [EnemyState["path"][number], EnemyState["path"][number]] | null => {
  let current = enemy.path[enemy.pathIndex];
  let next = enemy.path[enemy.pathIndex + 1];
  if (!current || !next) return null;
  if (facilityCellIsTraversable(next.cell, state.portalStates) || isClosedCoreThresholdStep(next))
    return [current, next];
  if (!repathEnemy(state, enemy)) return null;
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
  dt: number
): boolean => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  let travel =
    definition.speed *
    ENEMY_WORLD_SPEED_SCALE *
    (room ? roomMovementMultiplier(room, definition.flying) : 1) *
    dt;
  while (travel > 0 && enemy.pathIndex < enemy.path.length - 1) {
    const segment = nextEnemySegment(state, enemy);
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

const breachCore = (state: GameState, enemy: EnemyState): void => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  state.coreIntegrity = Math.max(0, state.coreIntegrity - definition.coreDamage);
  state.stats.breached += 1;
  state.stats.coreDamage += definition.coreDamage;
  addEvent(
    state,
    "danger",
    "Core breach",
    `${definition.name} dealt ${definition.coreDamage} persistent core damage.`,
    "core"
  );
};

export const moveEnemies = (state: GameState, dt: number): void => {
  state.enemies = state.enemies.filter((enemy) => {
    const roomId = enemyRoomId(enemy);
    const room = roomId ? state.rooms[roomId] : null;
    if (!moveEnemy(state, enemy, room, dt)) return true;
    breachCore(state, enemy);
    return false;
  });
};

export const simulateEnemies = (state: GameState, dt: number): void => {
  resolveEnemyCombat(state, dt, []);
  moveEnemies(state, dt);
};
