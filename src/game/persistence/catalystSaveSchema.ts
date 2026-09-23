import { z } from "zod";
import { CONTROL_EFFECT_KINDS, DAMAGE_SOURCE_IDS, TOWER_CHASSIS_IDS } from "../identifiers";

const amount = z.number().nonnegative();
const identity = z.string().min(1);
const point = z.strictObject({ x: z.number(), elevation: z.number() });
const contributions = z.record(identity, amount);
const chargeAccount = z.strictObject({
  input: amount,
  accepted: amount,
  overflow: amount,
  decay: amount,
  consumed: amount,
  death: amount,
  breach: amount,
  cleanup: amount,
});
const source = z.strictObject({
  id: identity,
  towerId: identity,
  chassisId: z.enum(TOWER_CHASSIS_IDS),
  provenance: z.enum(["site", "hull"]),
});
const device = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("field"),
    mode: z.enum(["attract", "repel"]),
    activatesAt: amount,
  }),
  z.strictObject({ kind: z.literal("discharge"), readyAt: amount }),
]);
export const catalystStateSchema = z.strictObject({
  sources: z.record(identity, source),
  chargeByEnemy: z.record(
    identity,
    z.strictObject({
      enemyId: z.number().int().positive(),
      amount,
      contributions,
      lastInputTick: z.number().int().nonnegative(),
      lastDischargeTick: z.number().int().min(-1),
    })
  ),
  devices: z.record(identity, device),
  accounting: chargeAccount,
  accountingBySource: z.record(identity, chargeAccount),
  damageByDevice: z.record(
    identity,
    z.strictObject({
      raw: amount,
      actual: amount,
      mitigation: amount,
      overkill: amount,
      kills: z.number().int().nonnegative(),
    })
  ),
  directBySource: z.record(
    identity,
    z.strictObject({
      damage: amount,
      kills: z.number().int().nonnegative(),
      shots: z.number().int().nonnegative(),
      overkill: amount,
    })
  ),
  fieldByDevice: z.record(
    identity,
    z.strictObject({ activeSeconds: amount, servicedEnemySeconds: amount })
  ),
  pulses: z.array(
    z.strictObject({
      id: z.number().int().positive(),
      sourceId: identity,
      elapsed: amount,
      origin: point,
      targets: z.array(
        z.strictObject({
          enemyId: z.number().int().positive(),
          position: point,
          consumed: amount,
          contributions,
          damage: amount,
        })
      ),
    })
  ),
  nextPulseId: z.number().int().positive(),
});

export const catalystReportSchema = catalystStateSchema
  .pick({
    sources: true,
    accounting: true,
    accountingBySource: true,
    directBySource: true,
    damageByDevice: true,
    fieldByDevice: true,
  })
  .extend({ remainingCharge: amount });

const packet = z.strictObject({
  key: identity,
  sourceId: z.enum(DAMAGE_SOURCE_IDS),
  channels: z.strictObject({
    atmosphere: amount,
    corrosion: amount,
    heat: amount,
    pressure: amount,
    radiation: amount,
  }),
});
const control = z.strictObject({
  kind: z.enum(CONTROL_EFFECT_KINDS),
  magnitude: amount,
  duration: amount,
  stacking: z.enum(["strongest", "additive"]),
  refresh: z.enum(["replace", "extend"]),
  floor: amount,
});
export const pendingAttackSchema = z.strictObject({
  id: z.number().int().positive(),
  strategy: z.enum(["projectile", "lobbed"]),
  source: z.strictObject({
    sourceId: identity,
    towerId: identity,
    chassisId: z.enum(TOWER_CHASSIS_IDS),
    color: identity,
    origin: point,
    packets: z.array(packet),
    controlEffects: z.array(control),
    chargePerHit: amount,
    eligibleLayers: z.array(z.enum(["ground", "flying"])),
    radius: amount,
    targetCap: z.number().int().positive(),
  }),
  target: point,
  speed: z.number().positive(),
  lobHeight: amount,
  collisionRadius: amount,
  age: amount,
  travelSeconds: z.number().positive(),
  position: point,
});
