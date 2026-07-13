import { Crosshair, Layers3, LockKeyhole, Pause, RadioTower } from "lucide-react";
import { lazy, Suspense } from "react";
import { EventLog } from "./components/EventLog";
import { FeedstockStrip } from "./components/FeedstockStrip";
import { BriefingModal } from "./components/BriefingModal";
import { CampaignProgressModal, HelpModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { PhaseBanner } from "./components/PhaseBanner";
import { RoomInspector } from "./components/RoomInspector";
import { RoomRail } from "./components/RoomRail";
import { TopBar } from "./components/TopBar";
import { SaveSlotScreen } from "./components/SaveSlotScreen";
import { useApplicationInitialization, useSimulationClock } from "./application/hooks";
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
      {game.paused && (
        <div className="paused-overlay">
          <Pause size={20} />
          <strong>Simulation paused</strong>
          <span>Continuous process state is frozen</span>
        </div>
      )}
      <div className="map-corner-readout left-readout">
        <Crosshair size={12} /> WORLD DISTANCE IS AUTHORITATIVE
      </div>
      <div className="map-corner-readout right-readout">
        <Layers3 size={12} /> HOVER RUNS FOR MEASURED TRANSFER
      </div>
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
            <div className="map-module-heading">
              <div>
                <span>
                  <RadioTower size={14} /> Castellum vertical cross-section
                </span>
                <small>World distance · shared physical conduits · material flow overlay</small>
              </div>
              <div className="map-legend" aria-label="Map legend">
                <span>
                  <i className="legend-spawn" /> Monster route
                </span>
                <span>
                  <i className="legend-chamber" /> Gas run
                </span>
                <span>
                  <i className="legend-liquid" /> Liquid run
                </span>
                <span>
                  <LockKeyhole size={12} /> Assault lock
                </span>
              </div>
            </div>

            <RoomRail />
            <FeedstockStrip />

            <MapStage />
          </section>

          <EventLog />
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
  useSimulationClock();
  const initialized = useGameStore((state) => state.initialized);
  const activeSlotId = useGameStore((state) => state.activeSlotId);

  if (!initialized) {
    return <div className="save-selection-loading">Reading local operations archive…</div>;
  }
  if (!activeSlotId) return <SaveSlotScreen />;
  return <ActiveGame />;
}
