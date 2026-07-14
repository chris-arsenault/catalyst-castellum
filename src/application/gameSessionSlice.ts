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
    const result = dependencies.runtime.execute(current, command);
    if (!result.accepted) {
      set({ notice: dependencies.presentation.commandCopy(result) });
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
        ? { selectedRoomId: dependencies.runtime.level(game).focusRoomId }
        : {}),
    });
    return true;
  },
  tick: (dt) => {
    const slotId = get().activeSlotId;
    if (!get().initialized || !slotId) return;
    const current = get().game;
    const game = dependencies.runtime.step(current, dt);
    if (game !== current) {
      dependencies.scheduleSave(slotId, game, get().dismissedGuideIds);
      set({ game });
    }
  },
});
