import type { DamageSourceId, HazardChannels } from "./types";

export interface DamagePacket {
  key: string;
  sourceId: DamageSourceId;
  channels: HazardChannels;
}
export interface AppliedDamagePacket extends DamagePacket {
  amount: number;
}
export interface DamageApplication {
  healthBefore: number;
  healthAfter: number;
  amount: number;
  killed: boolean;
  dominantSource: DamageSourceId | null;
  dominantChannel: keyof HazardChannels | null;
  packets: AppliedDamagePacket[];
}
