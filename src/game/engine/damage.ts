import { ENEMY_DEFINITIONS } from "../config";
import {
  DAMAGE_SOURCE_IDS,
  type DamageLedger,
  type DamageSourceId,
  type EnemyState,
  type GameState,
  type GasZone,
  type HazardChannels,
  type RoomId,
} from "../types";

export const HAZARD_CHANNELS = [
  "atmosphere",
  "corrosion",
  "heat",
  "pressure",
  "radiation",
] as const satisfies readonly (keyof HazardChannels)[];

export type HazardChannel = (typeof HAZARD_CHANNELS)[number];

export interface DamagePacket {
  key: string;
  sourceId: DamageSourceId;
  channels: HazardChannels;
}

export interface HazardBurst {
  roomId: RoomId;
  zone: GasZone | null;
  sourceId: DamageSourceId;
  reactionExtent: number;
  pressureImpulse: number;
  heatDelta: number;
  channels: HazardChannels;
}

export interface AppliedDamagePacket {
  key: string;
  sourceId: DamageSourceId;
  channels: HazardChannels;
  amount: number;
}

export interface DamageApplication {
  healthBefore: number;
  healthAfter: number;
  amount: number;
  killed: boolean;
  dominantSource: DamageSourceId | null;
  dominantChannel: HazardChannel | null;
  packets: AppliedDamagePacket[];
}

export const emptyHazardChannels = (): HazardChannels => ({
  atmosphere: 0,
  corrosion: 0,
  heat: 0,
  pressure: 0,
  radiation: 0,
});

export const emptyDamageLedger = (): DamageLedger =>
  Object.fromEntries(
    DAMAGE_SOURCE_IDS.map((sourceId) => [sourceId, emptyHazardChannels()])
  ) as DamageLedger;

export const addChannels = (target: HazardChannels, addition: HazardChannels): void => {
  for (const channel of HAZARD_CHANNELS) target[channel] += addition[channel];
};

export const channelTotal = (channels: HazardChannels): number =>
  HAZARD_CHANNELS.reduce((total, channel) => total + channels[channel], 0);

const scaledChannels = (channels: HazardChannels, scale: number): HazardChannels => ({
  atmosphere: channels.atmosphere * scale,
  corrosion: channels.corrosion * scale,
  heat: channels.heat * scale,
  pressure: channels.pressure * scale,
  radiation: channels.radiation * scale,
});

const resistedChannels = (enemy: EnemyState, channels: HazardChannels): HazardChannels => {
  const multipliers = ENEMY_DEFINITIONS[enemy.type].hazardMultipliers;
  return {
    atmosphere: channels.atmosphere * multipliers.atmosphere,
    corrosion: channels.corrosion * multipliers.corrosion,
    heat: channels.heat * multipliers.heat,
    pressure: channels.pressure * multipliers.pressure,
    radiation: channels.radiation * multipliers.radiation,
  };
};

export const dominantAppliedDamagePacket = (
  packets: AppliedDamagePacket[]
): AppliedDamagePacket | null =>
  packets.reduce<AppliedDamagePacket | null>((best, packet) => {
    if (!best || packet.amount > best.amount) return packet;
    if (packet.amount === best.amount && packet.key.localeCompare(best.key) < 0) return packet;
    return best;
  }, null);

export const dominantChannel = (channels: HazardChannels): HazardChannel | null => {
  const best = HAZARD_CHANNELS.reduce<HazardChannel | null>((current, channel) => {
    if (channels[channel] <= 0) return current;
    if (!current || channels[channel] > channels[current]) return channel;
    return current;
  }, null);
  return best;
};

export const damageLedgerSourceTotal = (ledger: DamageLedger, sourceId: DamageSourceId): number =>
  channelTotal(ledger[sourceId]);

export const damageLedgerTotal = (ledger: DamageLedger): number =>
  DAMAGE_SOURCE_IDS.reduce(
    (total, sourceId) => total + damageLedgerSourceTotal(ledger, sourceId),
    0
  );

export const dominantLedgerSource = (ledger: DamageLedger): DamageSourceId | null =>
  DAMAGE_SOURCE_IDS.reduce<DamageSourceId | null>((best, sourceId) => {
    const amount = damageLedgerSourceTotal(ledger, sourceId);
    if (amount <= 0) return best;
    if (!best || amount > damageLedgerSourceTotal(ledger, best)) return sourceId;
    return best;
  }, null);

/**
 * Applies every contribution in a combat frame as one proportional transaction.
 * This keeps attribution independent of packet iteration order when several hazards
 * jointly deliver lethal damage in the same simulation tick.
 */
export const applyDamagePackets = (
  state: GameState,
  enemy: EnemyState,
  packets: DamagePacket[]
): DamageApplication => {
  const healthBefore = enemy.health;
  const resisted = packets.map((packet) => ({
    ...packet,
    channels: resistedChannels(enemy, packet.channels),
  }));
  const requested = resisted.reduce((total, packet) => total + channelTotal(packet.channels), 0);
  if (requested <= 0 || healthBefore <= 0) {
    return {
      healthBefore,
      healthAfter: healthBefore,
      amount: 0,
      killed: healthBefore <= 0,
      dominantSource: null,
      dominantChannel: null,
      packets: [],
    };
  }

  const scale = Math.min(1, healthBefore / requested);
  const applied = resisted
    .map<AppliedDamagePacket>((packet) => {
      const channels = scaledChannels(packet.channels, scale);
      return { ...packet, channels, amount: channelTotal(channels) };
    })
    .filter((packet) => packet.amount > 0);
  const amount = applied.reduce((total, packet) => total + packet.amount, 0);

  for (const packet of applied) {
    addChannels(enemy.damageBySource[packet.sourceId], packet.channels);
    addChannels(state.stats.damageByChannel, packet.channels);
    state.stats.damageBySource[packet.sourceId] += packet.amount;
  }
  enemy.health = Math.max(0, healthBefore - amount);
  enemy.damageTaken += amount;
  state.stats.damageDealt += amount;

  const dominant = dominantAppliedDamagePacket(applied);
  enemy.lastDamage = dominant
    ? {
        sourceId: dominant.sourceId,
        channels: { ...dominant.channels },
        amount: dominant.amount,
        elapsed: state.elapsed,
      }
    : null;

  return {
    healthBefore,
    healthAfter: enemy.health,
    amount,
    killed: enemy.health <= 0.001,
    dominantSource: dominant?.sourceId ?? null,
    dominantChannel: dominant ? dominantChannel(dominant.channels) : null,
    packets: applied,
  };
};
