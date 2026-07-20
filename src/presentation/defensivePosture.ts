import type {
  ConduitDefensiveImpact,
  DefensiveEnemyPosture,
  DefensivePosture,
  DefensiveRoomPosture,
  GameRuntime,
} from "../game/runtime";
import type { ConnectionId, EnemyType, GameState, RoomId } from "../game/types";
import type { LocaleFormatters } from "../localization/formatters";
import type { Translator } from "../localization/translator";
import { enemyCopy, equipmentCopy, roomCopy } from "./entityCopy";
import { instance } from "../game/world/instances";

export type DefensivePostureTrend = "strengthening" | "steady" | "weakening";
export type DefensiveImpactTone = "gain" | "loss" | "mixed" | "support" | "steady";

export interface DefensiveRoomPostureCopy extends DefensiveRoomPosture {
  name: string;
  damageLabel: string;
}

export interface DefensiveEnemyPostureCopy extends DefensiveEnemyPosture {
  name: string;
  damageRatio: number;
  damageLabel: string;
  projectedDamagePerTraversal: number;
  projectedDamageLabel: string | null;
  delayLabel: string;
  trend: DefensivePostureTrend;
  trendLabel: string;
  rooms: readonly DefensiveRoomPostureCopy[];
}

export interface DefensivePostureCopy {
  enemies: readonly DefensiveEnemyPostureCopy[];
  basisLabel: string;
}

export interface DefensiveEnemyImpactCopy {
  type: EnemyType;
  name: string;
  damageDelta: number;
  delayDelta: number;
  damageLabel: string;
  delayLabel: string | null;
}

export interface DefensiveEquipmentImpactCopy {
  roomId: RoomId;
  name: string;
  rateLabel: string;
}

export interface ConduitDefensiveImpactCopy extends Omit<
  ConduitDefensiveImpact,
  "enemies" | "equipment"
> {
  tone: DefensiveImpactTone;
  headline: string;
  basisLabel: string;
  enemies: readonly DefensiveEnemyImpactCopy[];
  equipment: readonly DefensiveEquipmentImpactCopy[];
}

export interface DefensivePosturePresentation {
  current: (game: GameState) => DefensivePostureCopy;
  conduitImpact: (
    game: GameState,
    connectionId: ConnectionId,
    enabled: boolean
  ) => ConduitDefensiveImpactCopy;
}

const buildSupplySignature = (game: GameState): string => {
  if (game.phase !== "build") return "live-supplies";
  const total = (amounts: Record<string, number>): string =>
    Object.values(amounts)
      .reduce((sum, amount) => sum + amount, 0)
      .toFixed(1);
  return [
    ...Object.entries(game.gasSources).map(([id, source]) => `${id}:${total(source.gas)}`),
    ...Object.entries(game.liquidSources).map(([id, source]) => `${id}:${total(source.liquid)}`),
  ].join("|");
};

/** Configuration changes invalidate projections; live material ticks keep the cached target stable. */
export const defensivePostureSampleKey = (game: GameState): string => {
  const conduits = [...Object.entries(game.gasConduits), ...Object.entries(game.liquidConduits)]
    .map(([id, conduit]) => `${id}:${Number(conduit.enabled)}:${Number(conduit.blocked)}`)
    .join("|");
  const equipment = Object.entries(game.rooms)
    .flatMap(([roomId, room]) =>
      Object.entries(room.equipment).flatMap(([socketId, item]) =>
        item
          ? [`${roomId}:${socketId}:${item.equipmentId}:${item.level}:${Number(item.enabled)}`]
          : []
      )
    )
    .join("|");
  const portals = Object.entries(game.portalStates)
    .map(([id, portal]) => `${id}:${Number(portal.open)}`)
    .join("|");
  return [
    game.campaign.levelId,
    game.campaign.roundIndex,
    game.mapRevision,
    game.phase,
    conduits,
    equipment,
    portals,
    buildSupplySignature(game),
  ].join(";");
};

const trendFor = (
  current: DefensiveEnemyPosture,
  projected: DefensiveEnemyPosture | undefined
): DefensivePostureTrend => {
  const delta =
    (projected?.damagePerTraversal ?? current.damagePerTraversal) - current.damagePerTraversal;
  const threshold = Math.max(0.1, current.damagePerTraversal * 0.01);
  if (delta > threshold) return "strengthening";
  if (delta < -threshold) return "weakening";
  return "steady";
};

const impactTone = (impact: ConduitDefensiveImpact): DefensiveImpactTone => {
  const signs = impact.enemies.flatMap((enemy) =>
    [enemy.damageDelta, enemy.delayDelta].filter((value) => Math.abs(value) >= 0.01).map(Math.sign)
  );
  const hasGain = signs.includes(1);
  const hasLoss = signs.includes(-1);
  if (hasGain && hasLoss) return "mixed";
  if (hasGain) return "gain";
  if (hasLoss) return "loss";
  if (impact.equipment.length > 0) return "support";
  return "steady";
};

const boundedCache = <Value>() => {
  const entries = new Map<string, Value>();
  return {
    get(key: string): Value | undefined {
      return entries.get(key);
    },
    set(key: string, value: Value): void {
      entries.set(key, value);
      if (entries.size > 36) entries.delete(entries.keys().next().value as string);
    },
  };
};

interface PostureCopyContext {
  runtime: GameRuntime;
  translator: Translator;
  formatters: LocaleFormatters;
}

interface PosturePair {
  current: DefensivePosture;
  projected: DefensivePosture;
  outlookSeconds: number;
}

const signed = (value: number, precision: number, formatters: LocaleFormatters): string =>
  `${value >= 0 ? "+" : "−"}${formatters.number(Math.abs(value), precision)}`;

const postureEnemyCopy = (
  game: GameState,
  enemy: DefensiveEnemyPosture,
  projected: DefensiveEnemyPosture | undefined,
  context: PostureCopyContext
): DefensiveEnemyPostureCopy => {
  const { formatters, runtime, translator } = context;
  const projectedDamage = projected?.damagePerTraversal ?? enemy.damagePerTraversal;
  const projectedDelta = projectedDamage - enemy.damagePerTraversal;
  const projectedThreshold = Math.max(0.1, enemy.damagePerTraversal * 0.01);
  const trend = trendFor(enemy, projected);
  return {
    ...enemy,
    name: enemyCopy(runtime.definition.enemies[enemy.type], translator).name,
    damageRatio: enemy.health > 0 ? enemy.damagePerTraversal / enemy.health : 0,
    damageLabel: translator.text("ui.posture.damageVsHealth", {
      damage: formatters.number(enemy.damagePerTraversal, 0),
      health: formatters.number(enemy.health, 0),
    }),
    projectedDamagePerTraversal: projectedDamage,
    projectedDamageLabel:
      Math.abs(projectedDelta) > projectedThreshold
        ? translator.text("ui.posture.projectedDamageVsHealth", {
            damage: formatters.number(projectedDamage, 0),
            health: formatters.number(enemy.health, 0),
          })
        : null,
    delayLabel: translator.text("ui.posture.routeDelay", {
      seconds: formatters.number(enemy.delaySeconds, 1),
    }),
    trend,
    trendLabel: translator.text(`ui.posture.trend.${trend}`),
    rooms: enemy.rooms
      .filter((room) => room.damagePerTraversal >= 0.05)
      .sort((left, right) => right.damagePerTraversal - left.damagePerTraversal)
      .map((room) => ({
        ...room,
        name: roomCopy(instance(game.map.rooms, room.roomId, "posture room"), translator).name,
        damageLabel: translator.text("ui.posture.roomDamage", {
          damage: formatters.number(room.damagePerTraversal, 0),
        }),
      })),
  };
};

const currentPostureCopy = (
  game: GameState,
  posture: PosturePair,
  context: PostureCopyContext
): DefensivePostureCopy => ({
  basisLabel: context.translator.text("ui.posture.currentBasis", {
    seconds: context.formatters.number(posture.outlookSeconds, 0),
  }),
  enemies: posture.current.enemies.map((enemy) =>
    postureEnemyCopy(
      game,
      enemy,
      posture.projected.enemies.find((candidate) => candidate.type === enemy.type),
      context
    )
  ),
});

const enemyImpactCopies = (
  impact: ConduitDefensiveImpact,
  context: PostureCopyContext
): DefensiveEnemyImpactCopy[] => {
  const { formatters, runtime, translator } = context;
  return impact.enemies
    .filter((enemy) => Math.abs(enemy.damageDelta) >= 0.05 || Math.abs(enemy.delayDelta) >= 0.01)
    .sort(
      (left, right) =>
        Math.abs(right.damageDelta) +
        Math.abs(right.delayDelta) -
        (Math.abs(left.damageDelta) + Math.abs(left.delayDelta))
    )
    .map((enemy) => ({
      ...enemy,
      name: enemyCopy(runtime.definition.enemies[enemy.type], translator).name,
      damageLabel: translator.text("ui.posture.impactDamage", {
        delta: signed(enemy.damageDelta, enemy.damageDelta === 0 ? 0 : 1, formatters),
        damage: formatters.number(enemy.projectedDamagePerTraversal, 0),
        health: formatters.number(enemy.health, 0),
      }),
      delayLabel:
        Math.abs(enemy.delayDelta) >= 0.01
          ? translator.text("ui.posture.impactDelay", {
              delta: signed(enemy.delayDelta, 1, formatters),
            })
          : null,
    }));
};

const equipmentImpactCopies = (
  impact: ConduitDefensiveImpact,
  context: PostureCopyContext
): DefensiveEquipmentImpactCopy[] =>
  [...impact.equipment]
    .sort((left, right) => Math.abs(right.rateDelta) - Math.abs(left.rateDelta))
    .map((equipment) => ({
      roomId: equipment.roomId,
      name: equipmentCopy(
        context.runtime.definition.equipment[equipment.equipmentId],
        context.translator
      ).name,
      rateLabel: context.translator.text("ui.posture.impactEquipment", {
        current: context.formatters.number(equipment.currentRate, 2),
        projected: context.formatters.number(equipment.projectedRate, 2),
      }),
    }));

const localizedConduitImpact = (
  impact: ConduitDefensiveImpact,
  context: PostureCopyContext
): ConduitDefensiveImpactCopy => {
  const tone = impactTone(impact);
  return {
    ...impact,
    tone,
    headline: context.translator.text(`ui.posture.impact.${tone}`),
    basisLabel: context.translator.text("ui.posture.impactBasis", { seconds: impact.seconds }),
    enemies: enemyImpactCopies(impact, context),
    equipment: equipmentImpactCopies(impact, context),
  };
};

export const createDefensivePosturePresentation = (
  runtime: GameRuntime,
  translator: Translator,
  formatters: LocaleFormatters
): DefensivePosturePresentation => {
  const postureCache = boundedCache<{
    projected: DefensivePosture;
    outlookSeconds: number;
  }>();
  const impactCache = boundedCache<ConduitDefensiveImpact>();
  const context = { runtime, translator, formatters };

  const posturesFor = (game: GameState) => {
    const key = defensivePostureSampleKey(game);
    const cached = postureCache.get(key);
    if (cached) return { current: runtime.posture.current(game), ...cached };
    const round = runtime.round(game);
    const remainingPrime = Math.max(
      1,
      round.primeSeconds - (game.phase === "prime" ? game.phaseTime : 0)
    );
    const outlookSeconds = Math.min(30, remainingPrime);
    const created = {
      projected: runtime.posture.projected(game, outlookSeconds),
      outlookSeconds,
    };
    postureCache.set(key, created);
    return { current: runtime.posture.current(game), ...created };
  };

  const current = (game: GameState): DefensivePostureCopy =>
    currentPostureCopy(game, posturesFor(game), context);

  const conduitImpactCopy = (
    game: GameState,
    connectionId: ConnectionId,
    enabled: boolean
  ): ConduitDefensiveImpactCopy => {
    const sampleKey = defensivePostureSampleKey(game);
    const key = `${sampleKey};${connectionId};${Number(enabled)}`;
    let impact = impactCache.get(key);
    if (!impact) {
      impact = runtime.posture.conduitImpact(game, connectionId, enabled);
      impactCache.set(key, impact);
    }
    return localizedConduitImpact(impact, context);
  };

  return Object.freeze({ current, conduitImpact: conduitImpactCopy });
};
