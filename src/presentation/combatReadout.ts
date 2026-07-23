import type { GameState, RoomId } from "../game/types";

export interface RoomRoundCombat {
  damage: number;
  kills: number;
}

/** Damage dealt and kills scored in one room during the current round. */
export const roomRoundCombat = (game: GameState, roomId: RoomId): RoomRoundCombat => {
  let damage = 0;
  let kills = 0;
  for (const incident of game.incidents) {
    if (incident.roomId !== roomId || incident.round !== game.campaign.roundIndex) continue;
    for (const value of Object.values(incident.damageByChannel)) damage += value;
    for (const target of incident.targets) {
      if (target.killed) kills += 1;
    }
  }
  return { damage, kills };
};
