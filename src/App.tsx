import { Pause } from "lucide-react";
import { lazy, Suspense, useCallback } from "react";
import { EventLog } from "./components/EventLog";
import { FeedstockStrip } from "./components/FeedstockStrip";
import { BriefingModal } from "./components/BriefingModal";
import { CampaignProgressModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { FacilityManual } from "./components/manual/FacilityManual";
import { PhaseBanner } from "./components/PhaseBanner";
import { PipeBoard } from "./components/PipeBoard";
import { GraftBoard } from "./components/GraftBoard";
import { RoomInspector } from "./components/RoomInspector";
import { TopBar } from "./components/TopBar";
import { SaveSlotScreen } from "./components/SaveSlotScreen";
import { GameMap } from "./components/GameMap";
import { type RoomId } from "./game/types";
import {
  useApplicationInitialization,
  useAudioDirector,
  useSimulationClock,
} from "./application/hooks";
import { useGameStore } from "./application/store";
import { useGamePresentation } from "./application/presentationContext";
import { roomDefinition } from "./presentation/defaultGame";
import { planPipePreview } from "./presentation/pipePlanning";

const GuidedTutorial = lazy(async () => ({
  default: (await import("./tutorial/GuidedTutorial")).GuidedTutorial,
}));

const MapStage = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);
  const pipeMode = useGameStore((state) => state.pipeMode);
  const setPipeMode = useGameStore((state) => state.setPipeMode);
  const showNotice = useGameStore((state) => state.showNotice);
  const setPipePreview = useGameStore((state) => state.setPipePreview);
  const togglePipeMode = useCallback(() => setPipeMode(!pipeMode), [pipeMode, setPipeMode]);
  const connectRooms = useCallback(
    (from: RoomId, to: RoomId, anchor: { x: number; y: number }) => {
      const preview = planPipePreview(game, from, to, anchor);
      if (!preview) {
        showNotice(
          translator.text("ui.pipes.noRoute", {
            from: roomDefinition(game, from).code,
            to: roomDefinition(game, to).code,
          })
        );
        return;
      }
      setPipePreview(preview);
    },
    [game, setPipePreview, showNotice, translator]
  );
  return (
    <div className="map-stage-wrap">
      <GameMap
        game={game}
        selectedRoomId={selectedRoomId}
        onSelectRoom={selectRoom}
        onConnectRooms={connectRooms}
        onTogglePipeMode={togglePipeMode}
        pipeMode={pipeMode}
      />
      <FeedstockStrip />
      <EventLog />
      {game.paused && (
        <div className="paused-overlay">
          <Pause size={20} />
          <strong>{translator.text("ui.app.paused.title")}</strong>
          <span>{translator.text("ui.app.paused.detail")}</span>
        </div>
      )}
    </div>
  );
};

const SidePanel = () => {
  const pipeMode = useGameStore((state) => state.pipeMode);
  const graftMode = useGameStore((state) => state.graftMode);
  if (graftMode) return <GraftBoard />;
  if (pipeMode) return <PipeBoard />;
  return <RoomInspector />;
};

const ActiveGame = () => {
  return (
    <div className="app-shell" data-simulation-clock="live">
      <TopBar />
      <main className="workspace">
        <section className="defense-board">
          <PhaseBanner />
          <section className="map-module">
            <div className="tutorial-task-slot" data-tutorial="task-slot" />
            <MapStage />
          </section>
        </section>

        <SidePanel />
      </main>

      <BriefingModal />
      <CampaignProgressModal />
      <FacilityManual />
      <OutcomeModal />
      <NoticeToast />
      <Suspense fallback={null}>
        <GuidedTutorial />
      </Suspense>
    </div>
  );
};

export default function App() {
  const { translator } = useGamePresentation();
  useApplicationInitialization();
  useAudioDirector();
  useSimulationClock();
  const initialized = useGameStore((state) => state.initialized);
  const activeSlotId = useGameStore((state) => state.activeSlotId);

  if (!initialized) {
    return <div className="save-selection-loading">{translator.text("ui.app.loading")}</div>;
  }
  if (!activeSlotId) return <SaveSlotScreen />;
  return <ActiveGame />;
}
