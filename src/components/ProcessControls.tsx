import { Activity, ArrowDownToLine, Beaker, Gauge, LockKeyhole } from "lucide-react";
import { ROOM_DEFINITIONS, TRANSPORT_RUNS, roomRing, roomVolume } from "../game/config";
import {
  roomEquipmentVolume,
  roomRingDescription,
  roomSocketIds,
  transportPhaseAvailable,
} from "../game/simulation";
import { useGameStore } from "../game/store";
import { TRANSPORT_RUN_IDS } from "../game/types";
import { OutletBuffers } from "./processControls/ActuatorControls";
import { EquipmentSocket } from "./processControls/EquipmentControls";
import { TransportRunPanel } from "./processControls/TransportControls";

const phaseLabel = (phase: string): string => {
  if (phase === "build") return "PLANNING";
  if (phase === "prime") return "LIVE";
  return "LOCKED";
};

export const ProcessControls = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const roomDefinition = ROOM_DEFINITIONS[roomId];
  const ring = roomRing(roomId);
  const socketIds = roomSocketIds(roomId);
  const runs = TRANSPORT_RUN_IDS.filter(
    (runId) =>
      TRANSPORT_RUNS[runId].rooms.includes(roomId) &&
      (transportPhaseAvailable(game, runId, "gas") ||
        transportPhaseAvailable(game, runId, "liquid"))
  );
  const locked = !["build", "prime"].includes(game.phase);
  const hasCell = Object.values(room.equipment).some(
    (instance) => instance?.equipmentId === "membrane_cell"
  );
  return (
    <section className="inspector-section process-controls">
      <div className="section-title-row">
        <h3>Build & operate</h3>
        <span>
          {locked && <LockKeyhole size={12} />} {phaseLabel(game.phase)}
        </span>
      </div>
      <div className="ring-rule">
        <Gauge size={15} />
        <div>
          <strong>
            {ring.toUpperCase()} RING ·{" "}
            {Math.max(0, roomVolume(roomId) - roomEquipmentVolume(room)).toFixed(0)} FREE VOLUME
          </strong>
          <small>{roomRingDescription(roomId)}</small>
        </div>
      </div>
      {socketIds.length > 0 ? (
        <>
          <div className="control-kind-heading">
            <Beaker size={14} /> Equipment sockets
          </div>
          <div className="equipment-socket-list">
            {socketIds.map((socketId) => (
              <EquipmentSocket key={socketId} roomId={roomId} socketId={socketId} />
            ))}
          </div>
        </>
      ) : (
        <div className="passive-room-note">
          <Beaker size={18} />
          <p>{roomDefinition.blurb}</p>
        </div>
      )}
      {hasCell && <OutletBuffers />}
      {runs.length > 0 && (
        <div className="control-kind-heading">
          <Activity size={14} /> Physical service conduits
        </div>
      )}
      <div className="transport-run-list">
        {runs.map((runId) => (
          <TransportRunPanel key={runId} runId={runId} />
        ))}
      </div>
      {runs.length === 0 && socketIds.length === 0 && (
        <div className="passive-room-note">
          <ArrowDownToLine size={18} />
          <p>Structural chamber · atmosphere and path monitoring</p>
        </div>
      )}
    </section>
  );
};
