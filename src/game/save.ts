import { z } from "zod";
import type { GameState } from "./types";

const gasSchema = z.object({
  oxygen: z.number().nonnegative(),
  co2: z.number().nonnegative(),
  toxic_gas: z.number().nonnegative(),
  fuel_gas: z.number().nonnegative(),
  steam: z.number().nonnegative(),
});

const liquidSchema = z.object({
  water: z.number().nonnegative(),
  acid: z.number().nonnegative(),
  caustic: z.number().nonnegative(),
  sludge: z.number().nonnegative(),
  neutral_liquid: z.number().nonnegative(),
});

const roomIdSchema = z.enum([
  "west_intake",
  "lower_intake",
  "switchyard",
  "furnace",
  "reservoir",
  "gallery",
  "washlock",
  "core",
]);

const phaseSchema = z.enum(["build", "prime", "assault", "settle", "victory", "defeat"]);

const deviceSchema = z.enum([
  "gas_toxic",
  "gas_co2",
  "gas_fuel",
  "liquid_acid",
  "liquid_caustic",
  "liquid_water",
  "liquid_sludge",
  "vent",
  "drain",
  "igniter",
  "door",
  "boiler",
  "fan",
]);

const statsSchema = z.object({
  spawned: z.number().nonnegative(),
  killed: z.number().nonnegative(),
  breached: z.number().nonnegative(),
  coreDamage: z.number().nonnegative(),
  damageDealt: z.number().nonnegative(),
  reactions: z.number().nonnegative(),
  peakHazard: z.number().min(0).max(100),
});

const roomSchema = z.object({
  id: roomIdSchema,
  gas: gasSchema,
  liquid: liquidSchema,
  temperature: z.number(),
  residue: z.number().min(0).max(100),
  sealTimer: z.number().nonnegative(),
  flashTimer: z.number().nonnegative(),
  flashIntensity: z.number().nonnegative(),
  devices: z.array(deviceSchema),
});

const enemySchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(["crawler", "skimmer", "floater", "shell", "bellows"]),
  health: z.number().nonnegative(),
  maxHealth: z.number().positive(),
  route: z.array(roomIdSchema).min(2),
  segment: z.number().int().nonnegative(),
  progress: z.number().nonnegative(),
  spawnAge: z.number().nonnegative(),
  damageTaken: z.number().nonnegative(),
  disrupted: z.boolean(),
});

const reportSchema = statsSchema.extend({
  cycle: z.number().int().min(1).max(5),
  headline: z.string(),
  detail: z.string(),
});

const eventSchema = z.object({
  id: z.number().int().positive(),
  cycle: z.number().int().min(1).max(5),
  phase: phaseSchema,
  tone: z.enum(["info", "good", "warning", "danger", "reaction"]),
  title: z.string(),
  detail: z.string(),
  roomId: roomIdSchema.optional(),
});

const gameSchema = z.object({
  version: z.literal(1),
  phase: phaseSchema,
  cycle: z.number().int().min(1).max(5),
  phaseTime: z.number().nonnegative(),
  elapsed: z.number().nonnegative(),
  rooms: z.record(roomIdSchema, roomSchema),
  enemies: z.array(enemySchema),
  spawnCursor: z.number().int().nonnegative(),
  nextEnemyId: z.number().int().positive(),
  nextEventId: z.number().int().positive(),
  coreIntegrity: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  buildPoints: z.number().int().nonnegative(),
  cooldowns: z.record(z.string(), z.number().nonnegative()),
  paused: z.boolean(),
  speed: z.union([z.literal(1), z.literal(2)]),
  stats: statsSchema,
  lastReport: reportSchema.nullable(),
  events: z.array(eventSchema),
});

const saveEnvelopeSchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  savedAt: z.string(),
  game: gameSchema,
});

const SAVE_KEY = "catalyst-castellum:save:v1";

export const encodeGame = (game: GameState): string =>
  JSON.stringify({
    format: "catalyst-castellum-save",
    savedAt: new Date().toISOString(),
    game,
  });

export const decodeGame = (raw: string): GameState | null => {
  try {
    const result = saveEnvelopeSchema.safeParse(JSON.parse(raw));
    return result.success ? (result.data.game as GameState) : null;
  } catch {
    return null;
  }
};

export const loadSavedGame = (): GameState | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SAVE_KEY);
  return raw ? decodeGame(raw) : null;
};

export const saveGame = (game: GameState): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, encodeGame(game));
  } catch {
    // A full or blocked storage area should never interrupt the live simulation.
  }
};

export const clearSavedGame = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
};

let latestGame: GameState | null = null;
let saveTimer: number | null = null;

export const scheduleGameSave = (game: GameState): void => {
  if (typeof window === "undefined") return;
  latestGame = game;
  if (saveTimer !== null) return;
  saveTimer = window.setTimeout(() => {
    if (latestGame) saveGame(latestGame);
    latestGame = null;
    saveTimer = null;
  }, 750);
};
