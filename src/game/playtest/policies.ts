import { WORLD_MAP } from "../config";
import type { GameCommand, LevelId, RoomId } from "../types";
import type { RandomSource } from "../world/seededRandom";
import type { PlaytestPlan } from "./types";
import {
  failureControlBuildsFor,
  primaryReferenceBuildFor,
  referenceBuildsFor,
} from "../content/playtestPortfolios";

export { seededRandom } from "../world/seededRandom";

const PLACEMENT_ROOMS = Object.values(WORLD_MAP.rooms)
  .filter((room) => room.structure === "room")
  .map((room) => room.id);

const randomRoom = (random: RandomSource): RoomId =>
  PLACEMENT_ROOMS[Math.floor(random.next() * PLACEMENT_ROOMS.length)] as RoomId;

const maybeMisplace = (
  command: GameCommand,
  quality: number,
  random: RandomSource
): GameCommand => {
  if (command.type !== "install_equipment" || random.next() < quality) return command;
  return {
    ...command,
    roomId: randomRoom(random),
    socketId: random.next() < 0.5 ? "socket_a" : "socket_b",
  };
};

const shuffle = (commands: GameCommand[], random: RandomSource): GameCommand[] => {
  const result = [...commands];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    const current = result[index] as GameCommand;
    result[index] = result[swapIndex] as GameCommand;
    result[swapIndex] = current;
  }
  return result;
};

export const doNothingPlan = (): PlaytestPlan => ({
  name: "do_nothing",
  archetype: null,
  rounds: [],
});

export const referencePlans = (levelId: LevelId): PlaytestPlan[] => referenceBuildsFor(levelId);

export const failureControlPlans = (levelId: LevelId): PlaytestPlan[] =>
  failureControlBuildsFor(levelId);

export const primaryReferencePlan = (levelId: LevelId): PlaytestPlan =>
  primaryReferenceBuildFor(levelId);

export const mutatedReferencePlan = (
  levelId: LevelId,
  quality: number,
  random: RandomSource
): PlaytestPlan => {
  const reference = primaryReferencePlan(levelId);
  return {
    name: `mutation_${reference.name}_${quality.toFixed(2)}`,
    archetype: reference.archetype,
    rounds: reference.rounds.map((round) => {
      const selected = round.commands
        .filter(() => random.next() < quality)
        .map((command) => maybeMisplace(command, quality, random));
      return {
        commands: shuffle(selected, random),
        primeFraction: Math.min(round.primeFraction, 0.32 + quality * 0.68),
      };
    }),
  };
};
