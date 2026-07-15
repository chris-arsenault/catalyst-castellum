/* eslint-disable max-lines -- Current and frozen structural schemas intentionally share exact field codecs. */
import { z } from "zod";
import type { GameDefinition } from "../definitionTypes";
import {
  DAMAGE_SOURCE_IDS,
  ENEMY_LOCOMOTION_MODES,
  ENEMY_TYPES,
  EQUIPMENT_IDS,
  EQUIPMENT_SOCKET_IDS,
  EVENT_TONES,
  FLOW_CAUSES,
  GAME_PHASES,
  GAME_EVENT_CODES,
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  GAS_TYPES,
  GAS_ZONES,
  LEVEL_IDS,
  LIMIT_CONDITION_CODES,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  LIQUID_TYPES,
  PROCESS_IDS,
  ROOM_REACTION_IDS,
  type GameState,
} from "../types";
import { validateWorldMap } from "../world/mapValidation";
import { gameStateIsValid } from "../engine/stateValidation";
import {
  LEGACY_GAS_LINE_IDS,
  LEGACY_LIQUID_LINE_IDS,
  migrateV10Game,
  migrateV7Game,
  migrateV8Game,
  migrateV9Game,
} from "./legacySaveMigrations";

const roomIdSchema = z.string().min(1);
const phaseSchema = z.enum(GAME_PHASES);
const levelIdSchema = z.enum(LEVEL_IDS);
const gasSourceIdSchema = z.enum(GAS_SOURCE_IDS);
const liquidSourceIdSchema = z.enum(LIQUID_SOURCE_IDS);
const gasBufferIdSchema = z.enum(GAS_BUFFER_IDS);
const liquidBufferIdSchema = z.enum(LIQUID_BUFFER_IDS);
const processIdSchema = z.enum(PROCESS_IDS);
const reactionIdSchema = z.enum(ROOM_REACTION_IDS);
const equipmentIdSchema = z.enum(EQUIPMENT_IDS);
const socketIdSchema = z.enum(EQUIPMENT_SOCKET_IDS);
const runIdSchema = z.string().min(1);
const damageSourceSchema = z.enum(DAMAGE_SOURCE_IDS);

const gasSchema = z.object({
  oxygen: z.number().nonnegative(),
  nitrogen: z.number().nonnegative(),
  carbon_dioxide: z.number().nonnegative(),
  chlorine: z.number().nonnegative(),
  hydrogen: z.number().nonnegative(),
  hydrogen_chloride: z.number().nonnegative(),
  steam: z.number().nonnegative(),
});

const liquidSchema = z.object({
  water: z.number().nonnegative(),
  sodium_chloride: z.number().nonnegative(),
  sodium_hydroxide: z.number().nonnegative(),
  sodium_hypochlorite: z.number().nonnegative(),
  hydrochloric_acid: z.number().nonnegative(),
});

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

const equipmentSchema = z.object({
  equipmentId: equipmentIdSchema,
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  enabled: z.boolean(),
});
const speciesIdSchema = z.union([z.enum(GAS_TYPES), z.enum(LIQUID_TYPES)]);
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
  z.object({ kind: z.literal("legacy"), label: z.string() }),
  z.string().transform((label) => ({ kind: "legacy" as const, label })),
]);
const reactionTelemetrySchema = z.union([
  z.object({ lastRate: z.number().nonnegative(), limitingFactor: limitingFactorSchema }),
  z
    .object({ lastRate: z.number().nonnegative(), limitingReactant: z.string() })
    .transform(({ lastRate, limitingReactant }) => ({
      lastRate,
      limitingFactor: { kind: "legacy" as const, label: limitingReactant },
    })),
]);
const roomSchema = z.object({
  id: roomIdSchema,
  gas: z.object({ lower: gasSchema, upper: gasSchema }),
  gasTemperature: z.object({ lower: z.number(), upper: z.number() }),
  liquid: liquidSchema,
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
  installed: z.boolean(),
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
  installed: z.boolean(),
  enabled: z.boolean(),
  route: z.array(gridCellSchema),
  liquid: liquidSchema,
  lastFlow: z.number(),
  lastSpeciesFlow: liquidSchema,
  blocked: z.boolean(),
  flowCause: flowCauseSchema,
});

const processBaseSchema = z.object({
  setting: z.number().min(0).max(1),
  lastRate: z.number().nonnegative(),
  totalProcessed: z.number().nonnegative(),
  powerDraw: z.number().nonnegative(),
  separatorLeakTotal: z.number().nonnegative(),
});
const processSchema = z.union([
  processBaseSchema.extend({ limitingFactor: limitingFactorSchema }),
  processBaseSchema
    .extend({ limitingReactant: z.string() })
    .transform(({ limitingReactant, ...process }) => ({
      ...process,
      limitingFactor: { kind: "legacy" as const, label: limitingReactant },
    })),
]);

const damageReceiptSchema = z.object({
  sourceId: damageSourceSchema,
  channels: hazardSchema,
  amount: z.number().nonnegative(),
  elapsed: z.number().nonnegative(),
});
const legacyV8EnemySchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(ENEMY_TYPES),
  health: z.number().nonnegative(),
  maxHealth: z.number().positive(),
  route: z.array(roomIdSchema).min(2),
  segment: z.number().int().nonnegative(),
  progress: z.number().nonnegative(),
  spawnAge: z.number().nonnegative(),
  damageTaken: z.number().nonnegative(),
  damageBySource: damageLedgerSchema,
  lastDamage: damageReceiptSchema.nullable(),
});
const enemyPathStepSchema = z.object({
  cell: gridCellSchema,
  mode: z.enum(ENEMY_LOCOMOTION_MODES),
  portalId: z.string().nullable(),
});

const enemySchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(ENEMY_TYPES),
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
});

const statsSchema = z.object({
  spawned: z.number().int().nonnegative(),
  killed: z.number().int().nonnegative(),
  breached: z.number().int().nonnegative(),
  coreDamage: z.number().nonnegative(),
  damageDealt: z.number().nonnegative(),
  reactions: z.number().nonnegative(),
  combustionFlashes: z.number().int().nonnegative(),
  peakHazard: z.number().min(0).max(100),
  matterHarvested: z.number().nonnegative(),
  damageByChannel: hazardSchema,
  damageBySource: sourceTotalsSchema,
  killsBySource: sourceTotalsSchema,
});
const reportSchema = statsSchema.extend({
  levelId: levelIdSchema,
  round: z.number().int().positive(),
});
const legacyEventSchema = z.object({
  id: z.number().int().positive(),
  levelId: levelIdSchema,
  round: z.number().int().positive(),
  phase: phaseSchema,
  tone: z.enum(EVENT_TONES),
  title: z.string(),
  detail: z.string(),
  roomId: roomIdSchema.nullable(),
  elapsed: z.number().nonnegative(),
  incidentId: z.number().int().positive().nullable(),
});
const eventParameterSchema = z.union([z.boolean(), z.number(), z.string()]);
const eventSchema = legacyEventSchema.omit({ title: true, detail: true }).extend({
  code: z.enum(GAME_EVENT_CODES),
  parameters: z.record(z.string(), eventParameterSchema),
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
  sourceId: damageSourceSchema,
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
  checkpointLevelId: levelIdSchema,
  completedLevelIds: z.array(levelIdSchema),
});
const availabilitySchema = z.object({
  equipment: z.array(equipmentIdSchema),
  gasLines: z.array(runIdSchema),
  liquidLines: z.array(runIdSchema),
  gasSources: z.array(gasSourceIdSchema),
  liquidSources: z.array(liquidSourceIdSchema),
});

const legacyV8GameSchema = z.object({
  version: z.literal(8),
  phase: phaseSchema,
  campaign: campaignSchema,
  availability: availabilitySchema,
  phaseTime: z.number().nonnegative(),
  elapsed: z.number().nonnegative(),
  rooms: z.record(roomIdSchema, roomSchema),
  gasSources: z.record(gasSourceIdSchema, z.object({ gas: gasSchema })),
  liquidSources: z.record(liquidSourceIdSchema, z.object({ liquid: liquidSchema })),
  gasBuffers: z.record(gasBufferIdSchema, z.object({ gas: gasSchema })),
  liquidBuffers: z.record(liquidBufferIdSchema, z.object({ liquid: liquidSchema })),
  gasJunctions: z.record(roomIdSchema, z.object({ gas: gasSchema, temperature: z.number() })),
  liquidJunctions: z.record(roomIdSchema, z.object({ liquid: liquidSchema })),
  gasConduits: z.record(runIdSchema, gasConduitSchema),
  liquidConduits: z.record(runIdSchema, liquidConduitSchema),
  processes: z.record(processIdSchema, processSchema),
  gasVent: gasSchema,
  liquidDrain: liquidSchema,
  enemies: z.array(legacyV8EnemySchema),
  spawnCursor: z.number().int().nonnegative(),
  nextEnemyId: z.number().int().positive(),
  nextEventId: z.number().int().positive(),
  nextIncidentId: z.number().int().positive(),
  coreIntegrity: z.number().min(0).max(100),
  matter: z.number().nonnegative(),
  pendingMatter: z.number().nonnegative(),
  paused: z.boolean(),
  speed: z.union([z.literal(1), z.literal(2)]),
  stats: statsSchema,
  lastReport: reportSchema.nullable(),
  events: z.array(legacyEventSchema),
  incidents: z.array(incidentSchema),
});

const portalStateSchema = z.object({
  open: z.boolean(),
  sealed: z.boolean(),
  lastGasFlow: z.number(),
  lastLiquidFlow: z.number(),
});
const portalStatesSchema = z.record(z.string(), portalStateSchema);

const legacyV9GameSchema = legacyV8GameSchema.omit({ version: true, enemies: true }).extend({
  version: z.literal(9),
  enemies: z.array(enemySchema),
  portalStates: portalStatesSchema,
});

const legacyV10GameSchema = legacyV9GameSchema.omit({ version: true, events: true }).extend({
  version: z.literal(10),
  events: z.array(eventSchema),
});

const legacyV11GameSchema = legacyV10GameSchema
  .omit({ version: true })
  .extend({ version: z.literal(11) });
const packIdentitySchema = z.object({
  id: z.string().min(1),
  contentVersion: z.number().int().min(1),
});

const mapGridCellSchema = z.object({ column: z.number().int(), elevation: z.number().int() });
const cellRectSchema = z.object({
  column: z.number().int(),
  elevation: z.number().int(),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
});
const tapSchema = z.object({
  capacity: z.number(),
  includeRoomInventory: z.boolean(),
  roomPortHeight: z.number(),
  sourceIds: z.array(z.string().min(1)),
});
const mapRoomSchema = z.object({
  id: roomIdSchema,
  bounds: cellRectSchema,
  socketCells: z.record(z.string(), mapGridCellSchema),
  platformCells: z.array(mapGridCellSchema),
  ladderCells: z.array(mapGridCellSchema),
  taps: z.object({ gas: tapSchema, liquid: tapSchema }),
  provenance: z.enum(["site", "hull"]),
});
const processLineSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["gas_line", "liquid_line"]),
  rooms: z.tuple([roomIdSchema, roomIdSchema]),
  direction: z.tuple([roomIdSchema, roomIdSchema]),
  destinationKind: z.enum(["room", "gas_vent", "liquid_recovery"]),
  actuator: z.enum(["fan", "pump", "passive"]),
  actuatorHead: z.number(),
  maxFlow: z.number(),
  volumePerCell: z.number(),
  buildCost: z.number(),
  route: z.array(mapGridCellSchema).min(2),
});
const architecturalConnectionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["passage", "ladder_shaft", "floor_hole", "door", "trapdoor", "core_door"]),
  rooms: z.tuple([roomIdSchema, roomIdSchema]),
  connectorCells: z.array(mapGridCellSchema).min(1),
  endpoints: z.tuple([mapGridCellSchema, mapGridCellSchema]),
  orientation: z.enum(["horizontal", "vertical"]),
  sillElevation: z.number(),
  aperture: z.number(),
  gasConductance: z.number(),
  liquidConductance: z.number(),
  liquidMode: z.enum(["spill", "drain", "blocked"]),
  defaultOpen: z.boolean(),
  defaultSealed: z.boolean(),
  sealGroupId: z.string().nullable(),
  hostRoomId: roomIdSchema,
});
const worldMapSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  cellSize: z.number().min(1),
  coreAnchor: mapGridCellSchema,
  ringRadii: z.object({ inner: z.number(), middle: z.number() }),
  entryCell: mapGridCellSchema,
  coreBreachCell: mapGridCellSchema,
  rooms: z.record(roomIdSchema, mapRoomSchema),
  connections: z.record(z.string(), z.union([processLineSchema, architecturalConnectionSchema])),
  utilityNodes: z.record(
    z.string(),
    z.object({ cell: mapGridCellSchema, hostRoomId: roomIdSchema })
  ),
});

const gameSchema = legacyV11GameSchema.omit({ version: true }).extend({
  version: z.literal(13),
  pack: packIdentitySchema,
  map: worldMapSchema,
  mapRevision: z.number().int().min(0),
});

const saveEnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  pack: packIdentitySchema,
  game: gameSchema,
});
const legacyV11EnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  game: legacyV11GameSchema,
});
const legacyV10EnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  game: legacyV10GameSchema,
});
const legacyV9EnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  game: legacyV9GameSchema,
});
const legacyV8EnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  game: legacyV8GameSchema,
});

const legacyGasIdSchema = z.enum(LEGACY_GAS_LINE_IDS);
const legacyLiquidIdSchema = z.enum(LEGACY_LIQUID_LINE_IDS);
const legacyGasLineSchema = z
  .object({
    setting: z.number(),
    gas: gasSchema,
    temperature: z.number().default(22),
  })
  .passthrough();
const legacyLiquidLineSchema = z
  .object({ setting: z.number(), liquid: liquidSchema })
  .passthrough();
const legacyRunSchema = z.object({ gasInstalled: z.boolean(), liquidInstalled: z.boolean() });
const legacyV7GameSchema = z
  .object({
    version: z.literal(7),
    campaign: campaignSchema,
    rooms: z.record(roomIdSchema, roomSchema),
    gasSources: z.record(z.string(), z.object({ gas: gasSchema })),
    liquidSources: z.record(liquidSourceIdSchema, z.object({ liquid: liquidSchema })),
    gasBuffers: z.record(gasBufferIdSchema, z.object({ gas: gasSchema })),
    liquidBuffers: z.record(liquidBufferIdSchema, z.object({ liquid: liquidSchema })),
    gasLines: z.record(legacyGasIdSchema, legacyGasLineSchema),
    liquidLines: z.record(legacyLiquidIdSchema, legacyLiquidLineSchema),
    transportRuns: z.record(runIdSchema, legacyRunSchema),
    processes: z.record(processIdSchema, processSchema),
    gasVent: gasSchema,
    liquidDrain: liquidSchema,
    coreIntegrity: z.number().min(0).max(100),
    matter: z.number().nonnegative(),
    pendingMatter: z.number().nonnegative(),
  })
  .passthrough();
const legacyV7EnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  game: legacyV7GameSchema,
});

export type LegacyV8Enemy = z.infer<typeof legacyV8EnemySchema>;
export type LegacyV7Game = z.infer<typeof legacyV7GameSchema>;
export type LegacyV8Game = z.infer<typeof legacyV8GameSchema>;
export type LegacyV9Game = z.infer<typeof legacyV9GameSchema>;
export type LegacyV10Game = z.infer<typeof legacyV10GameSchema>;

export const encodeGame = (game: GameState, definition: GameDefinition): string => {
  if (
    game.pack.id !== definition.packId ||
    game.pack.contentVersion !== definition.contentVersion
  ) {
    throw new Error("Game state belongs to a different content pack.");
  }
  return JSON.stringify({
    format: "catalyst-castellum-save",
    savedAt: new Date().toISOString(),
    pack: game.pack,
    game,
  });
};

/** Catalogs derive from whichever map the state carries; never trust the serialized copy. */
const catalogsForMap = (map: GameState["map"]): GameState["world"] => ({
  rooms: Object.keys(map.rooms),
  connections: Object.keys(map.connections),
});

/** v13: the save owns the map (player edits diverge it from the pack). */
const validGame = (game: GameState, definition: GameDefinition): GameState | null => {
  if (validateWorldMap(game.map).length > 0) return null;
  const packRooms = Object.keys(definition.map.rooms).sort().join("|");
  if (Object.keys(game.map.rooms).sort().join("|") !== packRooms) return null;
  const withCatalogs: GameState = { ...game, world: catalogsForMap(game.map) };
  return gameStateIsValid(withCatalogs, definition) ? withCatalogs : null;
};

/** Legacy saves predate map edits: they run on the pack map. */
const validLegacyGame = (game: GameState, definition: GameDefinition): GameState | null =>
  validGame({ ...game, map: definition.map, mapRevision: 0 }, definition);

const decodeCurrent = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = saveEnvelopeSchema.safeParse(parsed);
  if (!result.success) return null;
  if (
    result.data.pack.id !== definition.packId ||
    result.data.pack.contentVersion !== definition.contentVersion
  )
    return null;
  return validGame(result.data.game as unknown as GameState, definition);
};

const decodeV11 = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = legacyV11EnvelopeSchema.safeParse(parsed);
  if (!result.success) return null;
  return validLegacyGame(
    {
      ...result.data.game,
      version: 13,
      pack: { id: definition.packId, contentVersion: definition.contentVersion },
    } as unknown as GameState,
    definition
  );
};

const decodeV10 = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = legacyV10EnvelopeSchema.safeParse(parsed);
  return result.success
    ? validLegacyGame(migrateV10Game(result.data.game, definition), definition)
    : null;
};

const decodeV9 = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = legacyV9EnvelopeSchema.safeParse(parsed);
  return result.success
    ? validGame(migrateV10Game(migrateV9Game(result.data.game), definition), definition)
    : null;
};

const decodeV8 = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = legacyV8EnvelopeSchema.safeParse(parsed);
  return result.success
    ? validLegacyGame(
        migrateV10Game(migrateV9Game(migrateV8Game(result.data.game, definition)), definition),
        definition
      )
    : null;
};

const decodeV7 = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = legacyV7EnvelopeSchema.safeParse(parsed);
  return result.success
    ? validLegacyGame(migrateV7Game(result.data.game, definition), definition)
    : null;
};

const decodeParsedGame = (parsed: unknown, definition: GameDefinition): GameState | null =>
  decodeCurrent(parsed, definition) ??
  decodeV11(parsed, definition) ??
  decodeV10(parsed, definition) ??
  decodeV9(parsed, definition) ??
  decodeV8(parsed, definition) ??
  decodeV7(parsed, definition);

export const decodeGame = (raw: string, definition: GameDefinition): GameState | null => {
  try {
    return decodeParsedGame(JSON.parse(raw) as unknown, definition);
  } catch {
    return null;
  }
};
