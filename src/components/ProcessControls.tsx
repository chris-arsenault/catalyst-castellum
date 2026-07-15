import { ArrowDownToLine, Beaker, LockKeyhole, Spline } from "lucide-react";
import { TRANSPORT_RUNS } from "../presentation/defaultGame";
import { roomSocketIds, transportPhaseAvailable } from "../game/queries";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { TRANSPORT_RUN_IDS } from "../game/types";
import type { Translator } from "../localization/translator";
import { OutletBuffers } from "./processControls/ActuatorControls";
import { EquipmentSocket } from "./processControls/EquipmentControls";

const localizedPhaseLabel = (phase: string, translator: Translator): string => {
  if (phase === "build") return translator.text("ui.process.phase.planning");
  if (phase === "prime") return translator.text("ui.process.phase.live");
  return translator.text("ui.process.phase.locked");
};

export const ProcessControls = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const setPipeMode = useGameStore((state) => state.setPipeMode);
  const room = game.rooms[roomId];
  const socketIds = roomSocketIds(roomId);
  const connectedRuns = TRANSPORT_RUN_IDS.filter(
    (runId) =>
      TRANSPORT_RUNS[runId].rooms.includes(roomId) &&
      (transportPhaseAvailable(game, runId, "gas") ||
        transportPhaseAvailable(game, runId, "liquid"))
  );
  const locked = !["build", "prime"].includes(game.phase);
  const hasCell = Object.values(room.equipment).some(
    (instance) => instance?.equipmentId === "membrane_cell"
  );
  const phaseLabel = localizedPhaseLabel(game.phase, translator);
  return (
    <section className="inspector-section process-controls">
      <div className="section-title-row">
        <h3>{translator.text("ui.process.title")}</h3>
        <span>
          {locked && <LockKeyhole size={12} />} {phaseLabel}
        </span>
      </div>
      {socketIds.length > 0 ? (
        <>
          <div className="control-kind-heading">
            <Beaker size={14} /> {translator.text("ui.process.build")}
          </div>
          <div className="equipment-socket-list">
            {socketIds.map((socketId) => (
              <EquipmentSocket key={socketId} roomId={roomId} socketId={socketId} />
            ))}
          </div>
        </>
      ) : null}
      {hasCell && <OutletBuffers />}
      {connectedRuns.length > 0 && (
        <button
          type="button"
          className="open-pipe-board"
          data-testid="open-pipe-board"
          onClick={() => setPipeMode(true)}
        >
          <Spline size={14} />
          {translator.text("ui.process.openPipeBoard", { count: connectedRuns.length })}
        </button>
      )}
      {connectedRuns.length === 0 && socketIds.length === 0 && (
        <div className="passive-room-note">
          <ArrowDownToLine size={18} />
          <p>{translator.text("ui.process.passive")}</p>
        </div>
      )}
    </section>
  );
};
