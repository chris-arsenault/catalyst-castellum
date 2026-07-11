import { Crosshair, Layers3, LockKeyhole, Pause, RadioTower } from "lucide-react";
import { EventLog } from "./components/EventLog";
import { GameMap } from "./components/GameMap";
import { BriefingModal, HelpModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { PhaseBanner } from "./components/PhaseBanner";
import { RoomInspector } from "./components/RoomInspector";
import { RoomRail } from "./components/RoomRail";
import { TopBar } from "./components/TopBar";
import { useSimulationClock } from "./game/hooks";
import { useGameStore } from "./game/store";

export default function App() {
  useSimulationClock();
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="workspace">
        <section className="defense-board">
          <PhaseBanner />

          <section className="map-module">
            <div className="map-module-heading">
              <div>
                <span>
                  <RadioTower size={14} /> Base topology
                </span>
                <small>Dual-service conduits · flow direction marked</small>
              </div>
              <div className="map-legend" aria-label="Map legend">
                <span>
                  <i className="legend-spawn" /> Intake
                </span>
                <span>
                  <i className="legend-chamber" /> Chamber
                </span>
                <span>
                  <i className="legend-hostile" /> Hostile
                </span>
                <span>
                  <LockKeyhole size={12} /> Sealed
                </span>
              </div>
            </div>

            <RoomRail />

            <div className="map-stage-wrap">
              <GameMap game={game} selectedRoomId={selectedRoomId} onSelectRoom={selectRoom} />
              {game.paused && (
                <div className="paused-overlay">
                  <Pause size={20} />
                  <strong>Simulation paused</strong>
                  <span>Room controls are interlocked</span>
                </div>
              )}
              <div className="map-corner-readout left-readout">
                <Crosshair size={12} /> LIVE FACILITY MODEL
              </div>
              <div className="map-corner-readout right-readout">
                <Layers3 size={12} /> PERSISTENT STATE
              </div>
            </div>
          </section>

          <EventLog />
        </section>

        <RoomInspector />
      </main>

      <BriefingModal />
      <HelpModal />
      <OutcomeModal />
      <NoticeToast />
    </div>
  );
}
