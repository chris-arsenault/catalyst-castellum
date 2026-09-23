/* eslint-disable max-lines -- The shared encounter save schema stays contiguous for compatibility review. */
import { z } from "zod";
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
} from "../types";
import { MAX_ENEMY_LEVEL, MIN_ENEMY_LEVEL } from "../engine/enemyLevel";
import { worldMapSaveSchema } from "./worldMapSaveSchema";
import {
  catalystReportSchema,
  catalystStateSchema,
  pendingAttackSchema,
} from "./catalystSaveSchema";

const roomIdSchema = z.string().min(1);
export const phaseSchema = z.enum(GAME_PHASES);
export const levelIdSchema = z.enum(LEVEL_IDS);
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

const gasSchema = z.strictObject({
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

const liquidSchema = z.strictObject({
  water: z.number().nonnegative(),
  sodium_chloride: z.number().nonnegative(),
  sodium_hydroxide: z.number().nonnegative(),
  sodium_hypochlorite: z.number().nonnegative(),
  hydrochloric_acid: z.number().nonnegative(),
  nitric_acid: z.number().nonnegative(),
});

const stationarySchema = z.record(z.enum(STATIONARY_TYPES), z.number().nonnegative());

const hazardSchema = z.strictObject({
  atmosphere: z.number().nonnegative(),
  corrosion: z.number().nonnegative(),
  heat: z.number().nonnegative(),
  pressure: z.number().nonnegative(),
  radiation: z.number().nonnegative(),
});

const damageLedgerSchema = z.record(damageSourceSchema, hazardSchema);
const sourceTotalsSchema = z.record(damageSourceSchema, z.number().nonnegative());
const gridCellSchema = z.strictObject({ column: z.number().int(), elevation: z.number().int() });
const worldPointSchema = z.strictObject({ x: z.number(), elevation: z.number() });
const flowCauseSchema = z.enum(FLOW_CAUSES);

const speciesIdSchema = z.union([
  z.enum(GAS_TYPES),
  z.enum(LIQUID_TYPES),
  z.enum(STATIONARY_TYPES),
]);
const limitingFactorSchema = z.union([
  z.strictObject({
    kind: z.literal("species"),
    speciesId: speciesIdSchema,
    zone: z.enum(GAS_ZONES).nullable(),
  }),
  z.strictObject({
    kind: z.literal("condition"),
    code: z.enum(LIMIT_CONDITION_CODES),
    zone: z.enum(GAS_ZONES).nullable(),
  }),
]);
const equipmentOutputSchema = z.union([
  z.strictObject({ phase: z.literal("gas"), gas: gasSchema }),
  z.strictObject({ phase: z.literal("liquid"), liquid: liquidSchema }),
]);
const equipmentOperationSchema = z.strictObject({
  lastRate: z.number().nonnegative(),
  totalProcessed: z.number().nonnegative(),
  powerDraw: z.number().nonnegative(),
  separatorLeakTotal: z.number().nonnegative(),
  limitingFactor: limitingFactorSchema,
  outputs: z.record(equipmentOutputIdSchema, equipmentOutputSchema.nullable()),
});
const equipmentSchema = z.strictObject({
  equipmentId: equipmentIdSchema,
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  enabled: z.boolean(),
  medium: z.enum(STATIONARY_TYPES).nullable(),
  operation: equipmentOperationSchema.nullable(),
});
const reactionTelemetrySchema = z.strictObject({
  lastRate: z.number().nonnegative(),
  direction: z.enum(["forward", "reverse", "idle"]),
  limitingFactor: limitingFactorSchema,
});
const roomSchema = z.strictObject({
  id: roomIdSchema,
  gas: z.strictObject({ lower: gasSchema, upper: gasSchema }),
  gasTemperature: z.strictObject({ lower: z.number(), upper: z.number() }),
  liquid: liquidSchema,
  stationary: stationarySchema,
  temperature: z.number(),
  residue: z.number().min(0).max(100),
  reactionIntensity: z.number().nonnegative(),
  pressurePulse: z.number().nonnegative(),
  flashCooldown: z.strictObject({
    lower: z.number().nonnegative(),
    upper: z.number().nonnegative(),
  }),
  combustionCount: z.number().int().nonnegative(),
  reactions: z.record(reactionIdSchema, reactionTelemetrySchema),
  equipment: z.record(socketIdSchema, equipmentSchema.nullable()),
});

const gasConduitSchema = z.strictObject({
  enabled: z.boolean(),
  route: z.array(gridCellSchema),
  gas: gasSchema,
  lastFlow: z.number(),
  lastSpeciesFlow: gasSchema,
  blocked: z.boolean(),
  flowCause: flowCauseSchema,
  temperature: z.number(),
});
const liquidConduitSchema = z.strictObject({
  enabled: z.boolean(),
  route: z.array(gridCellSchema),
  liquid: liquidSchema,
  lastFlow: z.number(),
  lastSpeciesFlow: liquidSchema,
  blocked: z.boolean(),
  flowCause: flowCauseSchema,
});

const damageReceiptSchema = z.strictObject({
  sourceId: damageSourceSchema,
  channels: hazardSchema,
  amount: z.number().nonnegative(),
  elapsed: z.number().nonnegative(),
});
const enemyPathStepSchema = z.strictObject({
  cell: gridCellSchema,
  mode: z.enum(ENEMY_LOCOMOTION_MODES),
  portalId: z.string().nullable(),
});

const enemyBehaviorSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("standard") }),
  z.strictObject({ kind: z.literal("ladder_runner") }),
  z.strictObject({
    kind: z.literal("armored_molt"),
    phase: z.enum(["armored", "exposed"]),
    transitionHealth: z.number().nonnegative(),
  }),
  z.strictObject({
    kind: z.literal("shared_field"),
    charge: z.number().nonnegative(),
    maximumCharge: z.number().positive(),
    active: z.boolean(),
  }),
  z.strictObject({
    kind: z.literal("gas_emitter"),
    reservoir: z.number().nonnegative(),
    initialReservoir: z.number().positive(),
  }),
]);

const enemyControlEffectSchema = z.strictObject({
  sourceTowerId: towerIdSchema,
  kind: z.enum(CONTROL_EFFECT_KINDS),
  magnitude: z.number().nonnegative(),
  remaining: z.number().nonnegative(),
  stacking: z.enum(["strongest", "additive"]),
  floor: z.number().nonnegative(),
});

const enemySchema = z.strictObject({
  id: z.number().int().positive(),
  type: z.enum(ENEMY_TYPES),
  level: z.number().int().min(MIN_ENEMY_LEVEL).max(MAX_ENEMY_LEVEL),
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
  behavior: enemyBehaviorSchema,
  effects: z.array(enemyControlEffectSchema),
});

const towerPlacementSchema = z.strictObject({
  anchor: gridCellSchema,
  mountFace: towerMountFaceSchema,
  orientation: towerOrientationSchema,
  occupiedCells: z.array(gridCellSchema).min(1),
  supportCells: z.array(gridCellSchema).min(1),
  firingOrigin: worldPointSchema,
});

const towerSchema = z.strictObject({
  id: towerIdSchema,
  chassisId: towerChassisSchema,
  placement: towerPlacementSchema,
  provenance: z.enum(["site", "hull"]),
  upgrades: z.array(towerUpgradeSchema),
  targetPolicy: towerTargetPolicySchema,
  cooldown: z.number().nonnegative(),
  currentTargetIds: z.array(z.number().int().positive()),
  damageDealt: z.number().nonnegative(),
  kills: z.number().int().nonnegative(),
  shots: z.number().int().nonnegative(),
  totalMatterSpent: z.number().nonnegative(),
  downtimeReason: z.enum(["none", "no_target", "cooldown", "supply"]),
  telemetry: z.strictObject({
    engagedSeconds: z.number().nonnegative(),
    targetsServiced: z.number().int().nonnegative(),
    overkillDamage: z.number().nonnegative(),
    controlApplications: z.number().int().nonnegative(),
    downtime: z.strictObject({
      noTarget: z.number().nonnegative(),
      cooldown: z.number().nonnegative(),
      supply: z.number().nonnegative(),
    }),
  }),
});

const towerAttackSchema = z.strictObject({
  id: z.number().int().positive(),
  towerId: towerIdSchema,
  sourceChassisId: towerChassisSchema.optional(),
  sourceColor: z.string().min(1).optional(),
  strategy: towerAttackStrategySchema,
  source: worldPointSchema,
  target: worldPointSchema,
  targetEnemyIds: z.array(z.number().int().positive()),
  startedAt: z.number().nonnegative(),
  expiresAt: z.number().nonnegative(),
  damage: z.number().nonnegative(),
  killedEnemyIds: z.array(z.number().int().positive()),
});

const environmentalFieldSchema = z.strictObject({
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

const statsSchema = z.strictObject({
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
  fieldDamageAbsorbed: z.number().nonnegative(),
  fieldDamageAbsorbedBySource: sourceTotalsSchema,
  reagentEmitted: z.number().nonnegative(),
  armorTransitions: z.number().int().nonnegative(),
  protectedAllySeconds: z.number().nonnegative(),
  damageByChannel: hazardSchema,
  damageBySource: sourceTotalsSchema,
  killsBySource: sourceTotalsSchema,
});
const reportSchema = statsSchema.extend({
  levelId: levelIdSchema,
  round: z.number().int().positive(),
  towers: z.record(
    towerIdSchema,
    z.strictObject({
      chassisId: towerChassisSchema,
      damageDealt: z.number().nonnegative(),
      kills: z.number().int().nonnegative(),
      shots: z.number().int().nonnegative(),
      overkillDamage: z.number().nonnegative(),
      engagedSeconds: z.number().nonnegative(),
      targetsServiced: z.number().int().nonnegative(),
      controlApplications: z.number().int().nonnegative(),
      matterInvested: z.number().nonnegative(),
      downtime: z.strictObject({
        noTarget: z.number().nonnegative(),
        cooldown: z.number().nonnegative(),
        supply: z.number().nonnegative(),
      }),
    })
  ),
});
export const eventSchema = z.strictObject({
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
const incidentTargetSchema = z.strictObject({
  enemyId: z.number().int().positive(),
  enemyType: z.enum(ENEMY_TYPES),
  worldPosition: worldPointSchema,
  healthBefore: z.number().nonnegative(),
  healthAfter: z.number().nonnegative(),
  damageByChannel: hazardSchema,
  killed: z.boolean(),
});
const incidentSchema = z.strictObject({
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

const availabilitySchema = z.strictObject({
  towers: z.array(towerChassisSchema),
  equipment: z.array(equipmentIdSchema),
  gasLines: z.array(runIdSchema),
  liquidLines: z.array(runIdSchema),
});

const portalStateSchema = z.strictObject({
  open: z.boolean(),
  sealed: z.boolean(),
  lastGasFlow: z.number(),
  lastLiquidFlow: z.number(),
});
const portalStatesSchema = z.record(z.string(), portalStateSchema);

const localResourcesSchema = z.strictObject({
  gas: z.partialRecord(z.enum(GAS_TYPES), z.number().nonnegative()),
  liquid: z.partialRecord(z.enum(LIQUID_TYPES), z.number().nonnegative()),
});

const processStateSchema = z.strictObject({
  rooms: z.record(roomIdSchema, roomSchema),
  gasSources: z.record(gasSourceIdSchema, z.strictObject({ gas: gasSchema })),
  liquidSources: z.record(liquidSourceIdSchema, z.strictObject({ liquid: liquidSchema })),
  gasJunctions: z.record(roomIdSchema, z.strictObject({ gas: gasSchema, temperature: z.number() })),
  liquidJunctions: z.record(roomIdSchema, z.strictObject({ liquid: liquidSchema })),
  gasConduits: z.record(runIdSchema, gasConduitSchema),
  liquidConduits: z.record(runIdSchema, liquidConduitSchema),
  gasVent: gasSchema,
  liquidDrain: liquidSchema,
  towerResources: z.record(towerIdSchema, localResourcesSchema),
  towerSupply: z.record(
    towerIdSchema,
    z.strictObject({
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
});

export const packIdentitySchema = z.strictObject({
  id: z.string().min(1),
  contentVersion: z.number().int().positive(),
});
const encounterPhaseSchema = z.enum(["build", "assault", "complete", "defeat", "timeout"]);
const encounterEventSchema = eventSchema.omit({ levelId: true, round: true }).extend({
  encounterId: z.string().min(1),
  phase: encounterPhaseSchema,
});
const encounterIncidentSchema = incidentSchema.omit({ levelId: true, round: true }).extend({
  encounterId: z.string().min(1),
  phase: encounterPhaseSchema,
});
const encounterReportSchema = reportSchema.omit({ levelId: true, round: true }).extend({
  catalyst: catalystReportSchema.nullable(),
});
export const encounterResultSchema = z.strictObject({
  encounterId: z.string().min(1),
  termination: z.enum(["complete", "defeat", "timeout"]),
  ticks: z.number().int().nonnegative(),
  coreIntegrity: z.number().nonnegative(),
  matter: z.number().nonnegative(),
  pendingMatter: z.number().nonnegative(),
  report: encounterReportSchema,
});

export const encounterStateSchema = z.strictObject({
  definition: z.strictObject({
    id: z.string().min(1),
    contentVersion: z.number().int().positive(),
    combatId: z.string().min(1),
    combatVersion: z.number().int().positive(),
  }),
  map: worldMapSaveSchema,
  mapRevision: z.number().int().nonnegative(),
  world: z.strictObject({ rooms: z.array(roomIdSchema), connections: z.array(z.string().min(1)) }),
  phase: encounterPhaseSchema,
  tick: z.number().int().nonnegative(),
  elapsed: z.number().nonnegative(),
  phaseTime: z.number().nonnegative(),
  commandCursor: z.strictObject({
    tick: z.number().int().nonnegative(),
    sequence: z.number().int().min(-1),
  }),
  availability: availabilitySchema,
  portalStates: portalStatesSchema,
  towers: z.record(towerIdSchema, towerSchema),
  enemies: z.array(enemySchema),
  towerAttacks: z.array(towerAttackSchema),
  pendingAttacks: z.array(pendingAttackSchema),
  catalyst: catalystStateSchema.nullable(),
  environmentalFields: z.array(environmentalFieldSchema),
  spawnCursor: z.number().int().nonnegative(),
  nextEnemyId: z.number().int().positive(),
  nextTowerSequence: z.number().int().positive(),
  nextTowerAttackId: z.number().int().positive(),
  nextEventId: z.number().int().positive(),
  nextIncidentId: z.number().int().positive(),
  matter: z.number().nonnegative(),
  pendingMatter: z.number().nonnegative(),
  coreIntegrity: z.number().nonnegative(),
  stats: statsSchema,
  result: encounterResultSchema.nullable(),
  events: z.array(encounterEventSchema),
  incidents: z.array(encounterIncidentSchema),
  process: processStateSchema.nullable(),
});

export const processEncounterStateSchema = encounterStateSchema.extend({
  process: processStateSchema,
});
