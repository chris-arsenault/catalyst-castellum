import { tutorialSessionOf } from "./guidanceSession";
import {
  accumulateSimulationTicks,
  isSimulationControl,
  simulationControlDecision,
} from "./simulationClock";
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
    if (isSimulationControl(command)) {
      const decision = simulationControlDecision(current);
      if (!decision.allowed) {
        set({ notice: dependencies.presentation.commandCopy(decision) });
        return false;
      }
      set({
        notice: null,
        ...(command.type === "set_speed"
          ? { speed: command.speed }
          : { paused: command.type === "set_pause" ? command.paused : !get().paused }),
      });
      return true;
    }
    const result = dependencies.runtime.execute(current, command);
    if (!result.accepted) {
      set({ notice: dependencies.presentation.commandCopy(result) });
      return false;
    }
    const game = result.state;
    const levelChanged = current.campaign.levelId !== game.campaign.levelId;
    const checkpointRestarted = command.type === "retry_level";
    set({
      game,
      notice: null,
      ...(current.phase !== game.phase ? { paused: false, simulationRemainder: 0 } : {}),
      ...(levelChanged || checkpointRestarted
        ? {
            selectedRoomId: dependencies.runtime.level(game).focusRoomId,
            selectedTowerId: null,
            towerBuildSelection: null,
            movingTowerId: null,
          }
        : {}),
    });
    dependencies.scheduleSave(slotId, game, tutorialSessionOf(get()));
    return true;
  },
  tick: (dt) => {
    const session = get();
    const slotId = session.activeSlotId;
    if (!session.initialized || !slotId || session.paused || !Number.isFinite(dt) || dt <= 0)
      return;
    const current = session.game;
    if (current.phase !== "assault") return;
    const clock = accumulateSimulationTicks(session.simulationRemainder, dt, session.speed);
    const game =
      clock.ticks > 0 ? dependencies.runtime.advanceTicks(current, clock.ticks) : current;
    set({ game, simulationRemainder: game.phase === "assault" ? clock.remainder : 0 });
    if (game !== current) {
      dependencies.scheduleSave(slotId, game, tutorialSessionOf(get()));
    }
  },
});
