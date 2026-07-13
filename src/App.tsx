import { Pause } from "lucide-react";
import { lazy, Suspense } from "react";
import { EventLog } from "./components/EventLog";
import { FeedstockStrip } from "./components/FeedstockStrip";
import { BriefingModal } from "./components/BriefingModal";
import { CampaignProgressModal, HelpModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { PhaseBanner } from "./components/PhaseBanner";
import { RoomInspector } from "./components/RoomInspector";
import { TopBar } from "./components/TopBar";
import { SaveSlotScreen } from "./components/SaveSlotScreen";
import {
  useApplicationInitialization,
  useAudioDirector,
  useSimulationClock,
} from "./application/hooks";
import { useGameStore } from "./application/store";

const GameMap = lazy(async () => ({ default: (await import("./components/GameMap")).GameMap }));
const GuidedTutorial = lazy(async () => ({
  default: (await import("./tutorial/GuidedTutorial")).GuidedTutorial,
}));

const MapStage = () => {
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);
  return (
    <div className="map-stage-wrap">
      <Suspense fallback={<div className="game-map-canvas" data-testid="game-map-loading" />}>
        <GameMap game={game} selectedRoomId={selectedRoomId} onSelectRoom={selectRoom} />
      </Suspense>
      <FeedstockStrip />
      <EventLog />
      {game.paused && (
        <div className="paused-overlay">
          <Pause size={20} />
          <strong>Simulation paused</strong>
          <span>Continuous process state is frozen</span>
        </div>
      )}
    </div>
  );
};

const ActiveGame = () => {
  return (
    <div className="app-shell" data-simulation-clock="live">
      <TopBar />
      <main className="workspace">
        <section className="defense-board">
          <PhaseBanner />
          <section className="map-module">
            <MapStage />
          </section>
        </section>

        <RoomInspector />
      </main>

      <BriefingModal />
      <CampaignProgressModal />
      <HelpModal />
      <OutcomeModal />
      <NoticeToast />
      <div className="tutorial-coach-anchor" data-tutorial="coach-anchor" aria-hidden="true" />
      <Suspense fallback={null}>
        <GuidedTutorial />
      </Suspense>
    </div>
  );
};

export default function App() {
  useApplicationInitialization();
  useAudioDirector();
  useSimulationClock();
  const initialized = useGameStore((state) => state.initialized);
  const activeSlotId = useGameStore((state) => state.activeSlotId);

  if (!initialized) {
    return <div className="save-selection-loading">Reading local operations archive…</div>;
  }
  if (!activeSlotId) return <SaveSlotScreen />;
  return <ActiveGame />;
}
