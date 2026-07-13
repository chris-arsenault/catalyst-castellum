import { create } from "zustand";
import type { GameCommand, GameState, RoomId } from "./types";
import { createInitialGame, executeCommand, levelDefinitionFor, stepGame } from "./simulation";
import { clearSavedGame, loadSavedGame, scheduleGameSave } from "./save";
import { guideDefinitionFor } from "../tutorial/guideModel";
import { loadDismissedGuideIds, saveDismissedGuideIds } from "../tutorial/guideProgress";
import { applyE2ETutorialEvidence } from "../testing/e2eMode";

const restoredGame = loadSavedGame();
const initialGame = restoredGame ?? createInitialGame();

interface GameStore {
  game: GameState;
  selectedRoomId: RoomId;
  showHelp: boolean;
  notice: string | null;
  dismissedGuideIds: string[];
  dispatch: (command: GameCommand) => boolean;
  tick: (dt: number) => void;
  selectRoom: (roomId: RoomId) => void;
  setShowHelp: (show: boolean) => void;
  dismissTutorialGuide: () => void;
  restartTutorialGuide: () => void;
  clearNotice: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: initialGame,
  selectedRoomId: levelDefinitionFor(initialGame).focusRoomId,
  showHelp: false,
  notice: null,
  dismissedGuideIds: loadDismissedGuideIds(),

  dispatch: (command) => {
    const current = get().game;
    const result = executeCommand(current, command);
    if (!result.accepted) {
      set({ notice: result.reason ?? "Command rejected." });
      return false;
    }
    const game = applyE2ETutorialEvidence(result.state, command);
    scheduleGameSave(game);
    const levelChanged = current.campaign.levelId !== game.campaign.levelId;
    const checkpointRestarted = command.type === "retry_level";
    set({
      game,
      notice: null,
      ...(levelChanged || checkpointRestarted
        ? { selectedRoomId: levelDefinitionFor(game).focusRoomId }
        : {}),
    });
    return true;
  },

  tick: (dt) => {
    const current = get().game;
    const game = stepGame(current, dt);
    if (game !== current) {
      scheduleGameSave(game);
      set({ game });
    }
  },

  selectRoom: (selectedRoomId) => set({ selectedRoomId, notice: null }),
  setShowHelp: (showHelp) => set({ showHelp }),
  dismissTutorialGuide: () => {
    const guide = guideDefinitionFor(get().game);
    if (!guide) return;
    const dismissedGuideIds = [...new Set([...get().dismissedGuideIds, guide.id])];
    saveDismissedGuideIds(dismissedGuideIds);
    set({ dismissedGuideIds });
  },
  restartTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide) return;
    const dismissedGuideIds = state.dismissedGuideIds.filter((id) => id !== guide.id);
    saveDismissedGuideIds(dismissedGuideIds);
    set({
      dismissedGuideIds,
      selectedRoomId: levelDefinitionFor(state.game).focusRoomId,
      showHelp: false,
      notice: null,
    });
  },
  clearNotice: () => set({ notice: null }),

  reset: () => {
    clearSavedGame();
    const game = createInitialGame();
    scheduleGameSave(game);
    set({
      game,
      selectedRoomId: levelDefinitionFor(game).focusRoomId,
      showHelp: false,
      notice: null,
    });
  },
}));
