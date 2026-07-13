import { Crosshair, Layers3, LockKeyhole, Pause, RadioTower } from "lucide-react";
import { EventLog } from "./components/EventLog";
import { FeedstockStrip } from "./components/FeedstockStrip";
import { GameMap } from "./components/GameMap";
import { BriefingModal } from "./components/BriefingModal";
import { CampaignProgressModal, HelpModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { PhaseBanner } from "./components/PhaseBanner";
import { RoomInspector } from "./components/RoomInspector";
import { RoomRail } from "./components/RoomRail";
import { TopBar } from "./components/TopBar";
import { useSimulationClock } from "./game/hooks";
import { useGameStore } from "./game/store";
import { e2eModeEnabled } from "./testing/e2eMode";
import { GuidedTutorial } from "./tutorial/GuidedTutorial";

const SIMULATION_CLOCK_MODE = e2eModeEnabled() ? "frozen-test" : "live";

export default function App() {
  useSimulationClock();
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);

  return (
    <div className="app-shell" data-simulation-clock={SIMULATION_CLOCK_MODE}>
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

            <div className="map-stage-wrap">
              <GameMap game={game} selectedRoomId={selectedRoomId} onSelectRoom={selectRoom} />
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
      <GuidedTutorial />
    </div>
  );
}
