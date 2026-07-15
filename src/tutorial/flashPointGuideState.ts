import { roomEquipmentIsActive } from "../game/queries";
import type { CombatIncident, GameState, RoomId } from "../game/types";
import { gasConduitState, roomState } from "../game/world/instances";

export const roomHasAgitator = (game: GameState, roomId: RoomId): boolean =>
  Object.values(roomState(game, roomId).equipment).some(
    (instance) => instance?.equipmentId === "gas_agitator"
  );

export const roomAgitatorRunning = (game: GameState, roomId: RoomId): boolean =>
  roomEquipmentIsActive(roomState(game, roomId), "gas_agitator");

export const furnaceAgitatorRunning = (game: GameState): boolean =>
  roomAgitatorRunning(game, "furnace");

export const furnaceAgitatorUpgraded = (game: GameState): boolean =>
  Object.values(roomState(game, "furnace").equipment).some(
    (instance) => instance?.equipmentId === "gas_agitator" && instance.level >= 2
  );

export const coreFurnaceFeedEnabled = (game: GameState): boolean =>
  gasConduitState(game, "core_furnace").installed && gasConduitState(game, "core_furnace").enabled;

/** Forward Core feed routes a player may choose for the second OX-1 chamber. */
export const SECOND_CHAMBER_FEEDS = [
  { runId: "core_switchyard", roomId: "switchyard" },
  { runId: "core_reservoir", roomId: "reservoir" },
  { runId: "core_gallery", roomId: "gallery" },
] as const;

const feedEnabled = (game: GameState, runId: (typeof SECOND_CHAMBER_FEEDS)[number]["runId"]) =>
  gasConduitState(game, runId).installed && gasConduitState(game, runId).enabled;

export const secondFeedEnabled = (game: GameState): boolean =>
  SECOND_CHAMBER_FEEDS.some((feed) => feedEnabled(game, feed.runId));

export const secondChamberRunning = (game: GameState): boolean =>
  SECOND_CHAMBER_FEEDS.some(
    (feed) => feedEnabled(game, feed.runId) && roomAgitatorRunning(game, feed.roomId)
  );

export const flashIncidentIn = (
  game: GameState,
  roomId: RoomId,
  predicate: (incident: CombatIncident) => boolean = () => true
): CombatIncident | null =>
  game.incidents.find(
    (incident) =>
      incident.sourceId === "hydrogen_oxygen_combustion" &&
      incident.roomId === roomId &&
      incident.round === game.campaign.roundIndex + 1 &&
      predicate(incident)
  ) ?? null;

export const primeFlashIncident = (game: GameState): CombatIncident | null =>
  flashIncidentIn(game, "furnace", (incident) => incident.phase === "prime");

export const assaultFlashIncident = (game: GameState): CombatIncident | null =>
  flashIncidentIn(
    game,
    "furnace",
    (incident) => incident.phase === "assault" && incident.targets.length > 0
  );

export const assaultFlashKilled = (game: GameState): boolean =>
  Boolean(assaultFlashIncident(game)?.targets.some((target) => target.killed));

const secondChamberIncident = (
  game: GameState,
  predicate: (incident: CombatIncident) => boolean = () => true
): CombatIncident | null =>
  SECOND_CHAMBER_FEEDS.reduce<CombatIncident | null>(
    (found, feed) => found ?? flashIncidentIn(game, feed.roomId, predicate),
    null
  );

export const secondChamberFlashObserved = (game: GameState): boolean =>
  Boolean(secondChamberIncident(game));

export const secondChamberFlashHit = (game: GameState): boolean =>
  Boolean(secondChamberIncident(game, (incident) => incident.targets.length > 0));

export const roundResolved = (game: GameState): boolean =>
  game.phase === "round_result" || game.phase === "level_complete" || game.phase === "victory";

export const levelResolved = (game: GameState): boolean =>
  game.phase === "level_complete" || game.phase === "victory";
