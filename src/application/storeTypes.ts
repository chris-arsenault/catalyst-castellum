import type { ProcessLineKind } from "../game/world/map";
import type { StoreApi } from "zustand";
import type {
  CommandRejectionCode,
  ConnectionId,
  EquipmentSocketId,
  GameCommand,
  GameState,
  GridCell,
  RoomId,
} from "../game/types";
import type { SaveSlotCatalog, SaveSlotId } from "./saveSlots";
import type { GameRuntime } from "../game/runtime";
import type { GamePresentation } from "../presentation/services";

export interface ApplicationLifecycleSlice {
  initialized: boolean;
  activeSlotId: SaveSlotId | null;
  saveSlots: SaveSlotCatalog;
  initialize: () => void;
  selectSaveSlot: (slotId: SaveSlotId) => void;
  startNewGame: (slotId: SaveSlotId) => void;
  deleteSaveSlot: (slotId: SaveSlotId) => void;
  returnToMainMenu: () => void;
  reset: () => void;
}

export interface GameSessionSlice {
  game: GameState;
  dispatch: (command: GameCommand) => boolean;
  tick: (dt: number) => void;
}

export type ManualSection = "operations" | "build" | "encyclopedia" | "threats";

export interface EquipmentBuildTarget {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}

/** A drag's routed proposal: nothing is built until the player confirms an option. */
export interface PipePreviewOption {
  kind: ProcessLineKind;
  connectionId: ConnectionId;
  route: readonly GridCell[];
  cost: number;
  buildable: boolean;
  reason: CommandRejectionCode | null;
}

export interface PipePreview {
  fromRoomId: RoomId;
  toRoomId: RoomId;
  options: PipePreviewOption[];
}

/** A candidate module for a chosen hardpoint; nothing grafts until confirmed. */
export interface GraftPreviewOption {
  moduleId: string;
  label: string;
  footprint: { width: number; height: number };
  cost: number;
  buildable: boolean;
  reason: CommandRejectionCode | null;
}

export interface GraftPreview {
  hostRoomId: RoomId;
  hardpointId: string;
  options: GraftPreviewOption[];
}

export interface UiSlice {
  selectedRoomId: RoomId;
  acknowledgedStageIntroIds: string[];
  showHelp: boolean;
  manualSection: ManualSection;
  equipmentBuildTarget: EquipmentBuildTarget | null;
  notice: string | null;
  dismissedGuideIds: string[];
  tutorialSessionRevision: number;
  pipeMode: boolean;
  pipePreview: PipePreview | null;
  graftMode: boolean;
  graftPreview: GraftPreview | null;
  acknowledgeStageIntro: (guideId: string) => void;
  selectRoom: (roomId: RoomId) => void;
  setPipeMode: (pipeMode: boolean) => void;
  setPipePreview: (preview: PipePreview | null) => void;
  setGraftMode: (graftMode: boolean) => void;
  setGraftPreview: (preview: GraftPreview | null) => void;
  showNotice: (notice: string) => void;
  setShowHelp: (show: boolean) => void;
  openManual: (section?: ManualSection) => void;
  openEquipmentBuild: (roomId: RoomId, socketId: EquipmentSocketId) => void;
  setManualSection: (section: ManualSection) => void;
  closeManual: () => void;
  dismissTutorialGuide: () => void;
  restartTutorialGuide: () => void;
  clearNotice: () => void;
}

export type GameStore = ApplicationLifecycleSlice & GameSessionSlice & UiSlice;

export interface GameStoreDependencies {
  runtime: GameRuntime;
  presentation: GamePresentation;
  loadSlots: () => SaveSlotCatalog;
  clearSlot: (slotId: SaveSlotId) => void;
  scheduleSave: (slotId: SaveSlotId, game: GameState, dismissedGuideIds: string[]) => void;
  cancelSave: (slotId: SaveSlotId) => void;
  flushSave: () => void;
}

export type StoreSet = StoreApi<GameStore>["setState"];
export type StoreGet = StoreApi<GameStore>["getState"];
