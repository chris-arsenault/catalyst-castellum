import { Pause } from "lucide-react";
import { lazy, Suspense, useCallback } from "react";
import { EventLog } from "./components/EventLog";
import { FeedstockStrip } from "./components/FeedstockStrip";
import { BriefingModal } from "./components/BriefingModal";
import { CampaignProgressModal, NoticeToast, OutcomeModal } from "./components/Modals";
import { FacilityManual } from "./components/manual/FacilityManual";
import { PhaseBanner } from "./components/PhaseBanner";
import { PipeBoard } from "./components/PipeBoard";
import { RoomInspector } from "./components/RoomInspector";
import { TopBar } from "./components/TopBar";
import { SaveSlotScreen } from "./components/SaveSlotScreen";
import { GameMap } from "./components/GameMap";
import { ROOM_DEFINITIONS, TRANSPORT_RUNS } from "./presentation/defaultGame";
import { transportPhaseAvailable } from "./game/queries";
import { TRANSPORT_PHASES, TRANSPORT_RUN_IDS, type RoomId } from "./game/types";
import {
  useApplicationInitialization,
  useAudioDirector,
  useSimulationClock,
} from "./application/hooks";
import { useGameStore } from "./application/store";
import { useGamePresentation } from "./application/presentationContext";

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
  const dispatch = useGameStore((state) => state.dispatch);
  const showNotice = useGameStore((state) => state.showNotice);
  const togglePipeMode = useCallback(() => setPipeMode(!pipeMode), [pipeMode, setPipeMode]);
  const connectRooms = useCallback(
    (from: RoomId, to: RoomId) => {
      const runId = TRANSPORT_RUN_IDS.find((id) => {
        const rooms = TRANSPORT_RUNS[id].rooms;
        return (rooms[0] === from && rooms[1] === to) || (rooms[0] === to && rooms[1] === from);
      });
      const buildablePhases = runId
        ? TRANSPORT_PHASES.filter(
            (phase) =>
              transportPhaseAvailable(game, runId, phase) &&
              !(phase === "gas" ? game.gasConduits[runId] : game.liquidConduits[runId]).installed
          )
        : [];
      if (!runId || buildablePhases.length === 0) {
        const parameters = {
          from: ROOM_DEFINITIONS[from].code,
          to: ROOM_DEFINITIONS[to].code,
        };
        showNotice(
          runId
            ? translator.text("ui.pipes.alreadyRouted", parameters)
            : translator.text("ui.pipes.noRoute", parameters)
        );
        return;
      }
      for (const phase of buildablePhases) dispatch({ type: "build_transport", runId, phase });
    },
    [dispatch, game, showNotice, translator]
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

const ActiveGame = () => {
  const pipeMode = useGameStore((state) => state.pipeMode);
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

        {pipeMode ? <PipeBoard /> : <RoomInspector />}
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
