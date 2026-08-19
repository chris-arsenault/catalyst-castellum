import { Pause } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";
import { EventLog } from "./components/EventLog";
import { FeedstockStrip } from "./components/FeedstockStrip";
import { CampaignProgressModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { VesselManual } from "./components/manual/VesselManual";
import { PhaseBanner } from "./components/PhaseBanner";
import { PipeBoard } from "./components/PipeBoard";
import { Logbook } from "./components/logbook/Logbook";
import { RoomInspector } from "./components/RoomInspector";
import { TowerPanel } from "./components/TowerPanel";
import { TopBar } from "./components/TopBar";
import { SaveSlotScreen } from "./components/SaveSlotScreen";
import { GameMap } from "./components/GameMap";
import { type GamePhase, type RoomId } from "./game/types";
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
  const { translator } = useGamePresentation();
  const pipeMode = useGameStore((state) => state.pipeMode);
  const [panel, setPanel] = useState<"towers" | "room">("towers");
  if (pipeMode) return <PipeBoard />;
  return (
    <div className="side-panel-shell">
      <nav className="side-panel-tabs" aria-label={translator.text("ui.sidePanel.title")}>
        <button
          type="button"
          className={panel === "towers" ? "selected" : ""}
          data-testid="side-panel-towers"
          aria-pressed={panel === "towers"}
          onClick={() => setPanel("towers")}
        >
          {translator.text("ui.sidePanel.towers")}
        </button>
        <button
          type="button"
          className={panel === "room" ? "selected" : ""}
          data-testid="side-panel-room"
          aria-pressed={panel === "room"}
          onClick={() => setPanel("room")}
        >
          {translator.text("ui.sidePanel.room")}
        </button>
      </nav>
      {panel === "towers" ? <TowerPanel /> : <RoomInspector />}
    </div>
  );
};

/** Between sites the captain's log owns the screen; play surfaces stay put away. */
const logbookOwnsPhase = (phase: GamePhase): boolean =>
  phase === "level_briefing" || phase === "level_complete" || phase === "travel";

const ActiveGame = () => {
  const phase = useGameStore((state) => state.game.phase);
  if (logbookOwnsPhase(phase)) return <Logbook />;
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

      <CampaignProgressModal />
      <VesselManual />
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
