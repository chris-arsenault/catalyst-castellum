import { z } from "zod";
import {
  TOWER_CHASSIS_IDS,
  TOWER_MOUNT_FACES,
  TOWER_ORIENTATIONS,
  TOWER_TARGET_POLICIES,
  TOWER_UPGRADE_IDS,
} from "../src/game/types";
import { ENCOUNTER_FIXTURES, ENCOUNTER_VARIANTS } from "../src/game/encounter/fixtures";

const placement = {
  anchor: z.strictObject({ column: z.number().int(), elevation: z.number().int() }),
  mountFace: z.enum(TOWER_MOUNT_FACES),
  orientation: z.enum(TOWER_ORIENTATIONS),
};
const towerId = z.string().min(1);
export const encounterToolCommandSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("start_assault") }),
  z.strictObject({
    type: z.literal("place_tower"),
    chassisId: z.enum(TOWER_CHASSIS_IDS),
    ...placement,
  }),
  z.strictObject({ type: z.literal("move_tower"), towerId, ...placement }),
  z.strictObject({
    type: z.literal("rotate_tower"),
    towerId,
    orientation: z.enum(TOWER_ORIENTATIONS),
  }),
  z.strictObject({
    type: z.literal("upgrade_tower"),
    towerId,
    upgradeId: z.enum(TOWER_UPGRADE_IDS),
  }),
  z.strictObject({ type: z.literal("dismantle_tower"), towerId }),
  z.strictObject({
    type: z.literal("set_field_mode"),
    towerId,
    mode: z.enum(["attract", "repel"]),
  }),
  z.strictObject({
    type: z.literal("set_tower_targeting"),
    towerId,
    policy: z.enum(TOWER_TARGET_POLICIES),
  }),
  z.strictObject({
    type: z.literal("set_portal"),
    connectionId: z.string().min(1),
    open: z.boolean(),
  }),
]);

export const encounterCommandLogSchema = z.array(
  z.strictObject({
    tick: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative(),
    command: encounterToolCommandSchema,
  })
);

/** Diagnostic fields may grow; replay consumes only the versioned identity, snapshot and inputs. */
const artifactSchema = z.object({
  format: z.literal("catalyst-encounter-run"),
  version: z.literal(1),
  fixture: z.enum(ENCOUNTER_FIXTURES),
  variant: z.enum(ENCOUNTER_VARIANTS),
  finalSnapshot: z.string().min(1),
  scheduledCommands: encounterCommandLogSchema,
});

export const parseEncounterArtifact = (text: string) => artifactSchema.parse(JSON.parse(text));
