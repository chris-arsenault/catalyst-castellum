import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import type { GameSessionSlice, GameStoreDependencies, StoreGet, StoreSet } from "./storeTypes";

export const createGameSessionActions = (
  set: StoreSet,
  get: StoreGet,
  dependencies: GameStoreDependencies
): Pick<GameSessionSlice, "dispatch" | "tick"> => ({
  dispatch: (command) => {
    const slotId = get().activeSlotId;
    if (!slotId) {
      set({ notice: "Choose a save slot before issuing plant commands." });
      return false;
    }
    const current = get().game;
    const result = DEFAULT_GAME_RUNTIME.execute(current, command);
    if (!result.accepted) {
      set({ notice: result.reason ?? "Command rejected." });
      return false;
    }
    const game = result.state;
    dependencies.scheduleSave(slotId, game, get().dismissedGuideIds);
    const levelChanged = current.campaign.levelId !== game.campaign.levelId;
    const checkpointRestarted = command.type === "retry_level";
    set({
      game,
      notice: null,
      ...(levelChanged || checkpointRestarted
        ? { selectedRoomId: DEFAULT_GAME_RUNTIME.level(game).focusRoomId }
        : {}),
    });
    return true;
  },
  tick: (dt) => {
    const slotId = get().activeSlotId;
    if (!get().initialized || !slotId) return;
    const current = get().game;
    const game = DEFAULT_GAME_RUNTIME.step(current, dt);
    if (game !== current) {
      dependencies.scheduleSave(slotId, game, get().dismissedGuideIds);
      set({ game });
    }
  },
});
