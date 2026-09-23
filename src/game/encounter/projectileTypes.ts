import type { DamagePacket } from "../damageTypes";
import type { TowerChassisId, TowerControlEffectDefinition, WorldPoint } from "../types";

/** Launch-time values: impacts never consult the current installation or its upgrades. */
export interface AttackSourceSnapshot {
  sourceId: string;
  towerId: string;
  chassisId: TowerChassisId;
  color: string;
  origin: WorldPoint;
  packets: DamagePacket[];
  controlEffects: TowerControlEffectDefinition[];
  chargePerHit: number;
  eligibleLayers: ("ground" | "flying")[];
  radius: number;
  targetCap: number;
}

export interface PendingAttack {
  id: number;
  strategy: "projectile" | "lobbed";
  source: AttackSourceSnapshot;
  target: WorldPoint;
  speed: number;
  lobHeight: number;
  collisionRadius: number;
  age: number;
  travelSeconds: number;
  position: WorldPoint;
}
