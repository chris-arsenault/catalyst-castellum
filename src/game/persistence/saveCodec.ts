/* eslint-disable max-lines -- The current save schema stays contiguous for compatibility review. */

import { z } from "zod";
import type { GameDefinition } from "../definitionTypes";
import {
  DAMAGE_SOURCE_IDS,
  ENEMY_LOCOMOTION_MODES,
  ENEMY_TYPES,
  EQUIPMENT_IDS,
  EQUIPMENT_OUTPUT_IDS,
  EQUIPMENT_SOCKET_IDS,
  EVENT_TONES,
  FLOW_CAUSES,
  GAME_PHASES,
  GAME_EVENT_CODES,
  GAS_TYPES,
  GAS_ZONES,
  LEVEL_IDS,
  LIMIT_CONDITION_CODES,
  LIQUID_TYPES,
  ROOM_REACTION_IDS,
  STATIONARY_TYPES,
  CONTROL_EFFECT_KINDS,
  TOWER_ATTACK_STRATEGIES,
  TOWER_CHASSIS_IDS,
  TOWER_MOUNT_FACES,
  TOWER_ORIENTATIONS,
  TOWER_TARGET_POLICIES,
  TOWER_UPGRADE_IDS,
  type GameState,
} from "../types";
import { validateWorldMap } from "../world/mapValidation";
import { gameStateIsValid } from "../engine/stateValidation";
import { MAX_ENEMY_LEVEL, MIN_ENEMY_LEVEL, REFERENCE_ENEMY_LEVEL } from "../engine/enemyLevel";
import { worldMapSaveSchema } from "./worldMapSaveSchema";

const roomIdSchema = z.string().min(1);
const phaseSchema = z.enum(GAME_PHASES);
const levelIdSchema = z.enum(LEVEL_IDS);
const gasSourceIdSchema = z.string().min(1);
const liquidSourceIdSchema = z.string().min(1);
const equipmentOutputIdSchema = z.enum(EQUIPMENT_OUTPUT_IDS);
const reactionIdSchema = z.enum(ROOM_REACTION_IDS);
const equipmentIdSchema = z.enum(EQUIPMENT_IDS);
const socketIdSchema = z.enum(EQUIPMENT_SOCKET_IDS);
const runIdSchema = z.string().min(1);
const damageSourceSchema = z.enum(DAMAGE_SOURCE_IDS);
const towerIdSchema = z.string().min(1);
const towerChassisSchema = z.enum(TOWER_CHASSIS_IDS);
const towerUpgradeSchema = z.enum(TOWER_UPGRADE_IDS);
const towerAttackStrategySchema = z.enum(TOWER_ATTACK_STRATEGIES);
const towerMountFaceSchema = z.enum(TOWER_MOUNT_FACES);
const towerOrientationSchema = z.enum(TOWER_ORIENTATIONS);
const towerTargetPolicySchema = z.enum(TOWER_TARGET_POLICIES);

const gasSchema = z.object({
  oxygen: z.number().nonnegative(),
  nitrogen: z.number().nonnegative(),
  carbon_dioxide: z.number().nonnegative(),
  carbon_monoxide: z.number().nonnegative(),
  chlorine: z.number().nonnegative(),
  hydrogen: z.number().nonnegative(),
  hydrogen_chloride: z.number().nonnegative(),
  steam: z.number().nonnegative(),
  methane: z.number().nonnegative(),
  ammonia: z.number().nonnegative(),
  nitric_oxide: z.number().nonnegative(),
  nitrogen_dioxide: z.number().nonnegative(),
  nitrous_oxide: z.number().nonnegative(),
  nickel_carbonyl: z.number().nonnegative(),
  uranium_hexafluoride: z.number().nonnegative(),
  hydrogen_fluoride: z.number().nonnegative(),
  fluorine: z.number().nonnegative(),
});

const liquidSchema = z.object({
  water: z.number().nonnegative(),
  sodium_chloride: z.number().nonnegative(),
  sodium_hydroxide: z.number().nonnegative(),
  sodium_hypochlorite: z.number().nonnegative(),
  hydrochloric_acid: z.number().nonnegative(),
  nitric_acid: z.number().nonnegative(),
});

const stationarySchema = z.record(z.enum(STATIONARY_TYPES), z.number().nonnegative());

const hazardSchema = z.object({
  atmosphere: z.number().nonnegative(),
  corrosion: z.number().nonnegative(),
  heat: z.number().nonnegative(),
  pressure: z.number().nonnegative(),
  radiation: z.number().nonnegative(),
});

const damageLedgerSchema = z.record(damageSourceSchema, hazardSchema);
const sourceTotalsSchema = z.record(damageSourceSchema, z.number().nonnegative());
const gridCellSchema = z.object({ column: z.number().int(), elevation: z.number().int() });
const worldPointSchema = z.object({ x: z.number(), elevation: z.number() });
const flowCauseSchema = z.enum(FLOW_CAUSES);

const speciesIdSchema = z.union([
  z.enum(GAS_TYPES),
  z.enum(LIQUID_TYPES),
  z.enum(STATIONARY_TYPES),
]);
const limitingFactorSchema = z.union([
  z.object({
    kind: z.literal("species"),
    speciesId: speciesIdSchema,
    zone: z.enum(GAS_ZONES).nullable(),
  }),
  z.object({
    kind: z.literal("condition"),
    code: z.enum(LIMIT_CONDITION_CODES),
    zone: z.enum(GAS_ZONES).nullable(),
  }),
]);
const equipmentOutputSchema = z.union([
  z.object({ phase: z.literal("gas"), gas: gasSchema }),
  z.object({ phase: z.literal("liquid"), liquid: liquidSchema }),
]);
const equipmentOperationSchema = z.object({
  lastRate: z.number().nonnegative(),
  totalProcessed: z.number().nonnegative(),
  powerDraw: z.number().nonnegative(),
  separatorLeakTotal: z.number().nonnegative(),
  limitingFactor: limitingFactorSchema,
  outputs: z.record(equipmentOutputIdSchema, equipmentOutputSchema.nullable()),
});
const equipmentSchema = z.object({
  equipmentId: equipmentIdSchema,
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  enabled: z.boolean(),
  medium: z.enum(STATIONARY_TYPES).nullable(),
  operation: equipmentOperationSchema.nullable(),
});
const reactionTelemetrySchema = z.object({
  lastRate: z.number().nonnegative(),
  direction: z.enum(["forward", "reverse", "idle"]),
  limitingFactor: limitingFactorSchema,
});
const roomSchema = z.object({
  id: roomIdSchema,
  gas: z.object({ lower: gasSchema, upper: gasSchema }),
  gasTemperature: z.object({ lower: z.number(), upper: z.number() }),
  liquid: liquidSchema,
  stationary: stationarySchema,
  temperature: z.number(),
  residue: z.number().min(0).max(100),
  reactionIntensity: z.number().nonnegative(),
  pressurePulse: z.number().nonnegative(),
  flashCooldown: z.object({ lower: z.number().nonnegative(), upper: z.number().nonnegative() }),
  combustionCount: z.number().int().nonnegative(),
  reactions: z.record(reactionIdSchema, reactionTelemetrySchema),
  equipment: z.record(socketIdSchema, equipmentSchema.nullable()),
});

const gasConduitSchema = z.object({
  enabled: z.boolean(),
  route: z.array(gridCellSchema),
  gas: gasSchema,
  lastFlow: z.number(),
  lastSpeciesFlow: gasSchema,
  blocked: z.boolean(),
  flowCause: flowCauseSchema,
  temperature: z.number(),
});
const liquidConduitSchema = z.object({
  enabled: z.boolean(),
  route: z.array(gridCellSchema),
  liquid: liquidSchema,
  lastFlow: z.number(),
  lastSpeciesFlow: liquidSchema,
  blocked: z.boolean(),
  flowCause: flowCauseSchema,
});

const damageReceiptSchema = z.object({
  sourceId: damageSourceSchema,
  channels: hazardSchema,
  amount: z.number().nonnegative(),
  elapsed: z.number().nonnegative(),
});
const enemyPathStepSchema = z.object({
  cell: gridCellSchema,
  mode: z.enum(ENEMY_LOCOMOTION_MODES),
  portalId: z.string().nullable(),
});

const enemyBehaviorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("standard") }),
  z.object({ kind: z.literal("ladder_runner") }),
  z.object({
    kind: z.literal("armored_molt"),
    phase: z.enum(["armored", "exposed"]),
    transitionHealth: z.number().nonnegative(),
  }),
  z.object({
    kind: z.literal("shared_field"),
    charge: z.number().nonnegative(),
    maximumCharge: z.number().positive(),
    active: z.boolean(),
  }),
  z.object({
    kind: z.literal("gas_emitter"),
    reservoir: z.number().nonnegative(),
    initialReservoir: z.number().positive(),
  }),
]);

const enemyControlEffectSchema = z.object({
  sourceTowerId: towerIdSchema,
  kind: z.enum(CONTROL_EFFECT_KINDS),
  magnitude: z.number().nonnegative(),
  remaining: z.number().nonnegative(),
  stacking: z.enum(["strongest", "additive"]),
  floor: z.number().nonnegative(),
});

const enemySchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(ENEMY_TYPES),
  level: z.number().int().min(MIN_ENEMY_LEVEL).max(MAX_ENEMY_LEVEL).default(REFERENCE_ENEMY_LEVEL),
  health: z.number().nonnegative(),
  maxHealth: z.number().positive(),
  routeId: z.string().min(1),
  path: z.array(enemyPathStepSchema).min(1),
  pathIndex: z.number().int().nonnegative(),
  progress: z.number().min(0).max(1),
  mode: z.enum(ENEMY_LOCOMOTION_MODES),
  facing: z.union([z.literal(-1), z.literal(1)]),
  spawnAge: z.number().nonnegative(),
  damageTaken: z.number().nonnegative(),
  damageBySource: damageLedgerSchema,
  lastDamage: damageReceiptSchema.nullable(),
  behavior: enemyBehaviorSchema.default({ kind: "standard" }),
  effects: z.array(enemyControlEffectSchema),
});

const towerPlacementSchema = z.object({
  anchor: gridCellSchema,
  mountFace: towerMountFaceSchema,
  orientation: towerOrientationSchema,
  occupiedCells: z.array(gridCellSchema).min(1),
  supportCells: z.array(gridCellSchema).min(1),
  firingOrigin: worldPointSchema,
});

const towerSchema = z.object({
  id: towerIdSchema,
  chassisId: towerChassisSchema,
  placement: towerPlacementSchema,
  provenance: z.enum(["site", "hull"]),
  upgrades: z.array(towerUpgradeSchema),
  targetPolicy: towerTargetPolicySchema,
  cooldown: z.number().nonnegative(),
  localResources: z.object({
    gas: z.partialRecord(z.enum(GAS_TYPES), z.number().nonnegative()),
    liquid: z.partialRecord(z.enum(LIQUID_TYPES), z.number().nonnegative()),
  }),
  currentTargetIds: z.array(z.number().int().positive()),
  damageDealt: z.number().nonnegative(),
  kills: z.number().int().nonnegative(),
  shots: z.number().int().nonnegative(),
  totalMatterSpent: z.number().nonnegative(),
  downtimeReason: z.enum(["none", "no_target", "cooldown", "supply"]),
  telemetry: z.object({
    engagedSeconds: z.number().nonnegative(),
    targetsServiced: z.number().int().nonnegative(),
    overkillDamage: z.number().nonnegative(),
    controlApplications: z.number().int().nonnegative(),
    downtime: z.object({
      noTarget: z.number().nonnegative(),
      cooldown: z.number().nonnegative(),
      supply: z.number().nonnegative(),
    }),
  }),
});

const towerAttackSchema = z.object({
  id: z.number().int().positive(),
  towerId: towerIdSchema,
  strategy: towerAttackStrategySchema,
  source: worldPointSchema,
  target: worldPointSchema,
  targetEnemyIds: z.array(z.number().int().positive()),
  startedAt: z.number().nonnegative(),
  expiresAt: z.number().nonnegative(),
  damage: z.number().nonnegative(),
  killedEnemyIds: z.array(z.number().int().positive()),
});

const environmentalFieldSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  effect: z.enum(["visibility", "cadence", "movement", "damage", "reveal"]),
  roomId: roomIdSchema,
  zone: z.enum(["lower", "upper", "both"]),
  intensity: z.number().nonnegative(),
  remaining: z.number().nonnegative(),
  decayPerSecond: z.number().nonnegative(),
  stacking: z.enum(["strongest", "additive"]),
  species: speciesIdSchema.nullable(),
});

const statsSchema = z.object({
  spawned: z.number().int().nonnegative(),
  killed: z.number().int().nonnegative(),
  breached: z.number().int().nonnegative(),
  coreDamage: z.number().nonnegative(),
  breachesByRoute: z.record(z.string(), z.number().int().nonnegative()),
  damageDealt: z.number().nonnegative(),
  reactions: z.number().nonnegative(),
  combustionFlashes: z.number().int().nonnegative(),
  peakHazard: z.number().min(0).max(100),
  matterHarvested: z.number().nonnegative(),
  fieldDamageAbsorbed: z.number().nonnegative().default(0),
  fieldDamageAbsorbedBySource: sourceTotalsSchema,
  reagentEmitted: z.number().nonnegative().default(0),
  armorTransitions: z.number().int().nonnegative().default(0),
  protectedAllySeconds: z.number().nonnegative().default(0),
  damageByChannel: hazardSchema,
  damageBySource: sourceTotalsSchema,
  killsBySource: sourceTotalsSchema,
});
const reportSchema = statsSchema.extend({
  levelId: levelIdSchema,
  round: z.number().int().positive(),
  towers: z.record(
    towerIdSchema,
    z.object({
      chassisId: towerChassisSchema,
      damageDealt: z.number().nonnegative(),
      kills: z.number().int().nonnegative(),
      shots: z.number().int().nonnegative(),
      overkillDamage: z.number().nonnegative(),
      engagedSeconds: z.number().nonnegative(),
      targetsServiced: z.number().int().nonnegative(),
      controlApplications: z.number().int().nonnegative(),
      matterInvested: z.number().nonnegative(),
      downtime: z.object({
        noTarget: z.number().nonnegative(),
        cooldown: z.number().nonnegative(),
        supply: z.number().nonnegative(),
      }),
    })
  ),
});
const eventSchema = z.object({
  id: z.number().int().positive(),
  levelId: levelIdSchema,
  round: z.number().int().positive(),
  phase: phaseSchema,
  tone: z.enum(EVENT_TONES),
  code: z.enum(GAME_EVENT_CODES),
  parameters: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  roomId: roomIdSchema.nullable(),
  elapsed: z.number().nonnegative(),
  incidentId: z.number().int().positive().nullable(),
});
const incidentTargetSchema = z.object({
  enemyId: z.number().int().positive(),
  enemyType: z.enum(ENEMY_TYPES),
  worldPosition: worldPointSchema,
  healthBefore: z.number().nonnegative(),
  healthAfter: z.number().nonnegative(),
  damageByChannel: hazardSchema,
  killed: z.boolean(),
});
const incidentSchema = z.object({
  id: z.number().int().positive(),
  elapsed: z.number().nonnegative(),
  levelId: levelIdSchema,
  round: z.number().int().positive(),
  phase: phaseSchema,
  roomId: roomIdSchema,
  zone: z.enum(["lower", "upper"]).nullable(),
  sourceId: z.union([damageSourceSchema, z.literal("hydrogen_oxygen_combustion")]),
  reactionExtent: z.number().nonnegative(),
  pressureImpulse: z.number().nonnegative(),
  heatDelta: z.number().nonnegative(),
  damageByChannel: hazardSchema,
  targets: z.array(incidentTargetSchema),
});

const campaignSchema = z.object({
  levelId: levelIdSchema,
  levelIndex: z.number().int().nonnegative(),
  roundIndex: z.number().int().nonnegative(),
  completedLevelIds: z.array(levelIdSchema),
  operationCheckpoint: z.string().nullable(),
  retryCount: z.number().int().nonnegative(),
});
const availabilitySchema = z.object({
  towers: z.array(towerChassisSchema),
  equipment: z.array(equipmentIdSchema),
  gasLines: z.array(runIdSchema),
  liquidLines: z.array(runIdSchema),
});

const portalStateSchema = z.object({
  open: z.boolean(),
  sealed: z.boolean(),
  lastGasFlow: z.number(),
  lastLiquidFlow: z.number(),
});
const portalStatesSchema = z.record(z.string(), portalStateSchema);

const gameSimulationSchema = z.object({
  phase: phaseSchema,
  campaign: campaignSchema,
  availability: availabilitySchema,
  phaseTime: z.number().nonnegative(),
  elapsed: z.number().nonnegative(),
  rooms: z.record(roomIdSchema, roomSchema),
  gasSources: z.record(gasSourceIdSchema, z.object({ gas: gasSchema })),
  liquidSources: z.record(liquidSourceIdSchema, z.object({ liquid: liquidSchema })),
  gasJunctions: z.record(roomIdSchema, z.object({ gas: gasSchema, temperature: z.number() })),
  liquidJunctions: z.record(roomIdSchema, z.object({ liquid: liquidSchema })),
  gasConduits: z.record(runIdSchema, gasConduitSchema),
  liquidConduits: z.record(runIdSchema, liquidConduitSchema),
  gasVent: gasSchema,
  liquidDrain: liquidSchema,
  enemies: z.array(enemySchema),
  towers: z.record(towerIdSchema, towerSchema),
  towerAttacks: z.array(towerAttackSchema),
  environmentalFields: z.array(environmentalFieldSchema),
  towerSupply: z.record(
    towerIdSchema,
    z.object({
      towerId: towerIdSchema,
      destinationRoomId: roomIdSchema,
      connectionIds: z.array(runIdSchema),
      availableRate: z.number().nonnegative(),
      demandedRate: z.number().nonnegative(),
      storedAmount: z.number().nonnegative(),
      capacity: z.number().nonnegative(),
      limitingSpecies: speciesIdSchema.nullable(),
      mode: z.enum(["assisted", "direct", "reduced", "paused"]),
      modifier: z.number().nonnegative(),
    })
  ),
  spawnCursor: z.number().int().nonnegative(),
  nextEnemyId: z.number().int().positive(),
  nextTowerSequence: z.number().int().positive(),
  nextTowerAttackId: z.number().int().positive(),
  nextEventId: z.number().int().positive(),
  nextIncidentId: z.number().int().positive(),
  coreIntegrity: z.number().min(0).max(100),
  matter: z.number().nonnegative(),
  pendingMatter: z.number().nonnegative(),
  paused: z.boolean(),
  speed: z.union([z.literal(1), z.literal(2)]),
  stats: statsSchema,
  lastReport: reportSchema.nullable(),
  events: z.array(eventSchema),
  incidents: z.array(incidentSchema),
  portalStates: portalStatesSchema,
});
const packIdentitySchema = z.object({
  id: z.string().min(1),
  contentVersion: z.number().int().min(1),
});

const gameSchema = gameSimulationSchema.extend({
  version: z.literal(27),
  pack: packIdentitySchema,
  map: worldMapSaveSchema,
  mapRevision: z.number().int().min(0),
});

const saveEnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  pack: packIdentitySchema,
  game: gameSchema,
});

export const encodeGame = (
  game: GameState,
  definition: GameDefinition,
  savedAt = new Date().toISOString()
): string => {
  if (
    game.pack.id !== definition.packId ||
    game.pack.contentVersion !== definition.contentVersion
  ) {
    throw new Error("Game state belongs to a different content pack.");
  }
  return JSON.stringify({
    format: "catalyst-castellum-save",
    savedAt,
    pack: game.pack,
    game,
  });
};

/** Catalogs derive from whichever map the state carries; never trust the serialized copy. */
const catalogsForMap = (map: GameState["map"]): GameState["world"] => ({
  rooms: Object.keys(map.rooms),
  connections: Object.keys(map.connections),
});

/** The save owns the map because player edits can diverge it from the content pack. */
const validGame = (game: GameState, definition: GameDefinition): GameState | null => {
  if (validateWorldMap(game.map).length > 0) return null;
  const withCatalogs: GameState = { ...game, world: catalogsForMap(game.map) };
  return gameStateIsValid(withCatalogs, definition) ? withCatalogs : null;
};

const decodeParsedGame = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = saveEnvelopeSchema.safeParse(parsed);
  if (!result.success) return null;
  if (
    result.data.pack.id !== definition.packId ||
    result.data.pack.contentVersion !== definition.contentVersion
  )
    return null;
  return validGame(result.data.game as unknown as GameState, definition);
};

export const decodeGame = (raw: string, definition: GameDefinition): GameState | null => {
  try {
    return decodeParsedGame(JSON.parse(raw) as unknown, definition);
  } catch {
    return null;
  }
};
