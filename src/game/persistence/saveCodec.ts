import { z } from "zod";
import type { GameDefinition } from "../definitionTypes";
import type { GameState } from "../types";
import { validateWorldMap } from "../world/mapValidation";
import { gameStateIsValid } from "../engine/stateValidation";
import {
  eventSchema,
  levelIdSchema,
  packIdentitySchema,
  phaseSchema,
  processEncounterStateSchema,
} from "./encounterSaveSchema";

const campaignSchema = z.strictObject({
  levelId: levelIdSchema,
  levelIndex: z.number().int().nonnegative(),
  roundIndex: z.number().int().nonnegative(),
  completedLevelIds: z.array(levelIdSchema),
  operationCheckpoint: z.string().nullable(),
  retryCount: z.number().int().nonnegative(),
  settledEncounterIds: z.array(z.string().min(1)),
});
const gameSchema = z.strictObject({
  version: z.literal(30),
  pack: packIdentitySchema,
  phase: phaseSchema,
  campaign: campaignSchema,
  encounter: processEncounterStateSchema,
  events: z.array(eventSchema),
});

const saveEnvelopeSchema = z.strictObject({
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
const catalogsForMap = (map: GameState["encounter"]["map"]): GameState["encounter"]["world"] => ({
  rooms: Object.keys(map.rooms),
  connections: Object.keys(map.connections),
});

/** The save owns the map because player edits can diverge it from the content pack. */
const validGame = (game: GameState, definition: GameDefinition): GameState | null => {
  if (validateWorldMap(game.encounter.map).length > 0) return null;
  const withCatalogs: GameState = {
    ...game,
    encounter: { ...game.encounter, world: catalogsForMap(game.encounter.map) },
  };
  return gameStateIsValid(withCatalogs, definition) ? withCatalogs : null;
};

const decodeEnvelope = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const result = saveEnvelopeSchema.safeParse(parsed);
  if (!result.success) return null;
  if (
    result.data.pack.id !== definition.packId ||
    result.data.pack.contentVersion !== definition.contentVersion
  )
    return null;
  return validGame(result.data.game as unknown as GameState, definition);
};

const decodeParsedGame = (parsed: unknown, definition: GameDefinition): GameState | null => {
  const game = decodeEnvelope(parsed, definition);
  if (!game?.campaign.operationCheckpoint) return game;
  const checkpoint = decodeEnvelope(JSON.parse(game.campaign.operationCheckpoint), definition);
  if (
    !checkpoint ||
    checkpoint.campaign.operationCheckpoint !== null ||
    checkpoint.phase !== "build" ||
    checkpoint.campaign.levelId !== game.campaign.levelId ||
    checkpoint.campaign.roundIndex !== game.campaign.roundIndex ||
    checkpoint.encounter.definition.id !== game.encounter.definition.id
  )
    return null;
  return game;
};

export type SaveInspection =
  { status: "ready"; game: GameState } | { status: "incompatible" | "damaged" };

const saveIdentitySchema = z.object({
  format: z.literal("catalyst-castellum-save"),
  pack: packIdentitySchema,
  game: z.object({ version: z.number().int(), pack: packIdentitySchema }),
});

export const inspectGameSave = (raw: string, definition: GameDefinition): SaveInspection => {
  try {
    const parsed: unknown = JSON.parse(raw);
    const identity = saveIdentitySchema.safeParse(parsed);
    if (!identity.success) return { status: "damaged" };
    const { pack, game } = identity.data;
    if (
      game.version !== 30 ||
      [pack, game.pack].some(
        (value) =>
          value.id !== definition.packId || value.contentVersion !== definition.contentVersion
      )
    )
      return { status: "incompatible" };
    const decoded = decodeParsedGame(parsed, definition);
    return decoded ? { status: "ready", game: decoded } : { status: "damaged" };
  } catch {
    return { status: "damaged" };
  }
};

export const decodeGame = (raw: string, definition: GameDefinition): GameState | null => {
  const result = inspectGameSave(raw, definition);
  return result.status === "ready" ? result.game : null;
};
