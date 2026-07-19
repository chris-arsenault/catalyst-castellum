import type { GameDefinition } from "../game/definitionTypes";
import type { GameQueries } from "../game/queries";
import type { EnemyDefinition, EnemyType, GameState, GridCell, RoomId } from "../game/types";
import { instance } from "../game/world/instances";
import type { Translator } from "../localization/translator";
import { enemyCopy, roomCopy } from "./entityCopy";

export type WaveCadence = "single" | "surge" | "tight" | "steady" | "spaced";

export type WaveTrait = "flying" | "armored" | "climber" | "shared_field" | "reagent_emitter";

export interface WaveEnemyForecast {
  type: EnemyType;
  count: number;
  minimumLevel: number;
  maximumLevel: number;
  traits: readonly WaveTrait[];
}

export interface WaveForecastModel {
  total: number;
  composition: readonly WaveEnemyForecast[];
  cadence: WaveCadence;
  cohortCount: number;
  firstArrivalSeconds: number;
  durationSeconds: number;
  traits: readonly WaveTrait[];
  entryRoomId: RoomId;
  coreRoomId: RoomId;
}

export interface WaveEnemyForecastCopy extends WaveEnemyForecast {
  name: string;
  description: string;
  countLabel: string;
  levelLabel: string;
  traitLabels: readonly string[];
}

export interface WaveForecastCopy extends WaveForecastModel {
  totalLabel: string;
  cadenceLabel: string;
  arrivalLabel: string;
  timingLabel: string;
  approachLabel: string;
  composition: readonly WaveEnemyForecastCopy[];
  traitLabels: readonly string[];
}

const TRAIT_ORDER: readonly WaveTrait[] = [
  "flying",
  "armored",
  "climber",
  "shared_field",
  "reagent_emitter",
];

const COHORT_BREAK_SECONDS = 5;

const traitsFor = (enemy: EnemyDefinition): readonly WaveTrait[] => {
  const traits: WaveTrait[] = [];
  if (enemy.flying) traits.push("flying");
  switch (enemy.behavior.kind) {
    case "armored_molt":
      traits.push("armored");
      break;
    case "ladder_runner":
      traits.push("climber");
      break;
    case "shared_field":
      traits.push("shared_field");
      break;
    case "gas_emitter":
      traits.push("reagent_emitter");
      break;
  }
  return traits;
};

const median = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

const cadenceFor = (entryCount: number, gaps: readonly number[]): WaveCadence => {
  if (entryCount <= 1) return "single";
  const typicalGap = median(gaps);
  if (typicalGap <= 1.25) return "surge";
  if (typicalGap <= 2.5) return "tight";
  if (typicalGap <= 5) return "steady";
  return "spaced";
};

const contains = (
  cell: GridCell,
  bounds: { column: number; elevation: number; width: number; height: number }
): boolean =>
  cell.column >= bounds.column &&
  cell.column < bounds.column + bounds.width &&
  cell.elevation >= bounds.elevation &&
  cell.elevation < bounds.elevation + bounds.height;

const routeRooms = (game: GameState): readonly [RoomId, RoomId] => {
  const rooms = Object.values(game.map.rooms);
  const entry = rooms.find((room) => contains(game.map.entryCell, room.bounds));
  const core = rooms.find((room) => room.structure === "core");
  if (!entry || !core) throw new Error("Wave forecast requires entry and core rooms.");
  return [entry.id, core.id];
};

/** Mechanical forecast derived entirely from the current round's authored wave. */
export const waveForecastModel = (
  game: GameState,
  definition: GameDefinition,
  queries: GameQueries
): WaveForecastModel => {
  const level = queries.levelDefinitionFor(game);
  const sortedWave = [...queries.roundDefinitionFor(game).wave].sort(
    (left, right) => left.at - right.at
  );
  const grouped = new Map<EnemyType, WaveEnemyForecast>();

  for (const entry of sortedWave) {
    const levelValue = queries.resolveEnemyLevel(level.enemyLevel, entry.levelOffset);
    const current = grouped.get(entry.type);
    if (current) {
      grouped.set(entry.type, {
        ...current,
        count: current.count + 1,
        minimumLevel: Math.min(current.minimumLevel, levelValue),
        maximumLevel: Math.max(current.maximumLevel, levelValue),
      });
      continue;
    }
    grouped.set(entry.type, {
      type: entry.type,
      count: 1,
      minimumLevel: levelValue,
      maximumLevel: levelValue,
      traits: traitsFor(definition.enemies[entry.type]),
    });
  }

  const gaps = sortedWave.slice(1).map((entry, index) => entry.at - sortedWave[index]!.at);
  const composition = [...grouped.values()];
  const traits = TRAIT_ORDER.filter((trait) =>
    composition.some((enemy) => enemy.traits.includes(trait))
  );
  const [entryRoomId, coreRoomId] = routeRooms(game);
  const firstArrivalSeconds = sortedWave[0]?.at ?? 0;
  const lastArrivalSeconds = sortedWave.at(-1)?.at ?? firstArrivalSeconds;

  return {
    total: sortedWave.length,
    composition,
    cadence: cadenceFor(sortedWave.length, gaps),
    cohortCount:
      sortedWave.length === 0 ? 0 : 1 + gaps.filter((gap) => gap > COHORT_BREAK_SECONDS).length,
    firstArrivalSeconds,
    durationSeconds: Math.max(0, lastArrivalSeconds - firstArrivalSeconds),
    traits,
    entryRoomId,
    coreRoomId,
  };
};

const levelLabel = (enemy: WaveEnemyForecast, translator: Translator): string =>
  enemy.minimumLevel === enemy.maximumLevel
    ? translator.text("ui.waveForecast.level", { level: enemy.minimumLevel })
    : translator.text("ui.waveForecast.levelRange", {
        minimum: enemy.minimumLevel,
        maximum: enemy.maximumLevel,
      });

const arrivalLabel = (model: WaveForecastModel, translator: Translator): string => {
  if (model.firstArrivalSeconds <= 2) {
    return translator.text("ui.waveForecast.arrival.immediate");
  }
  if (model.firstArrivalSeconds <= 7) return translator.text("ui.waveForecast.arrival.soon");
  return translator.text("ui.waveForecast.arrival.delayed");
};

const timingLabel = (model: WaveForecastModel, translator: Translator): string => {
  if (model.total === 1) return translator.text("ui.waveForecast.timing.single");
  if (model.durationSeconds === 0) {
    return translator.text("ui.waveForecast.timing.simultaneous", {
      count: model.total,
    });
  }
  return model.cohortCount <= 1
    ? translator.text("ui.waveForecast.timing.oneFormation")
    : translator.text("ui.waveForecast.timing.formations", {
        cohorts: model.cohortCount,
      });
};

export const createWaveForecastPresentation =
  (definition: GameDefinition, queries: GameQueries, translator: Translator) =>
  (game: GameState): WaveForecastCopy => {
    const model = waveForecastModel(game, definition, queries);
    const traitLabel = (trait: WaveTrait): string =>
      translator.text(`ui.waveForecast.trait.${trait}`);
    const entryName = roomCopy(
      instance(game.map.rooms, model.entryRoomId, "entry room definition"),
      translator
    ).name;
    const coreName = roomCopy(
      instance(game.map.rooms, model.coreRoomId, "core room definition"),
      translator
    ).name;

    return {
      ...model,
      totalLabel: translator.text("ui.waveForecast.hostiles", { count: model.total }),
      cadenceLabel: translator.text(`ui.waveForecast.cadence.${model.cadence}`),
      arrivalLabel: arrivalLabel(model, translator),
      timingLabel: timingLabel(model, translator),
      approachLabel: translator.text("ui.waveForecast.route", {
        entry: entryName,
        core: coreName,
      }),
      composition: model.composition.map((enemy) => {
        const copy = enemyCopy(definition.enemies[enemy.type], translator);
        return {
          ...enemy,
          name: copy.name,
          description: copy.description,
          countLabel: translator.text("ui.waveForecast.enemyCount", {
            count: enemy.count,
            enemy: copy.name,
          }),
          levelLabel: levelLabel(enemy, translator),
          traitLabels: enemy.traits.map(traitLabel),
        };
      }),
      traitLabels: model.traits.map(traitLabel),
    };
  };
