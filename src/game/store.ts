import { create } from "zustand";
import type { DeviceKey, GameCommand, GameState, RoomId } from "./types";
import { createInitialGame, executeCommand, stepGame } from "./simulation";
import { clearSavedGame, loadSavedGame, scheduleGameSave } from "./save";

const restoredGame = loadSavedGame();

interface GameStore {
  game: GameState;
  selectedRoomId: RoomId;
  previewDevice: DeviceKey | null;
  showBriefing: boolean;
  showHelp: boolean;
  notice: string | null;
  dispatch: (command: GameCommand) => boolean;
  tick: (dt: number) => void;
  selectRoom: (roomId: RoomId) => void;
  setPreviewDevice: (device: DeviceKey | null) => void;
  dismissBriefing: () => void;
  setShowHelp: (show: boolean) => void;
  clearNotice: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: restoredGame ?? createInitialGame(),
  selectedRoomId: "switchyard",
  previewDevice: "gas_toxic",
  showBriefing: restoredGame === null,
  showHelp: false,
  notice: null,

  dispatch: (command) => {
    const result = executeCommand(get().game, command);
    if (!result.accepted) {
      set({ notice: result.reason ?? "Command rejected." });
      return false;
    }
    scheduleGameSave(result.state);
    set({ game: result.state, notice: null });
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

  selectRoom: (roomId) => {
    const firstDevice = get().game.rooms[roomId].devices[0] ?? null;
    set({ selectedRoomId: roomId, previewDevice: firstDevice, notice: null });
  },

  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  dismissBriefing: () => set({ showBriefing: false }),
  setShowHelp: (showHelp) => set({ showHelp }),
  clearNotice: () => set({ notice: null }),

  reset: () => {
    clearSavedGame();
    const game = createInitialGame();
    scheduleGameSave(game);
    set({
      game,
      selectedRoomId: "switchyard",
      previewDevice: "gas_toxic",
      showBriefing: false,
      showHelp: false,
      notice: null,
    });
  },
}));
