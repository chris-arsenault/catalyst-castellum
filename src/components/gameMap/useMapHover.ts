import { useState } from "react";
import type { RoomId, TransportRunId } from "../../game/types";
import type { EquipmentHover } from "./EquipmentLayer";
import type { CellOutletId } from "./cellOutletRenderModel";

const NO_HOVER = () => undefined;

/** Map hover state; while the pipe board is open only rooms and runs stay hoverable. */
export const useMapHover = (pipeMode: boolean) => {
  const [hoveredRunId, setHoveredRunId] = useState<TransportRunId | null>(null);
  const [hoveredCellOutletId, setHoveredCellOutletId] = useState<CellOutletId | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<RoomId | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<EquipmentHover | null>(null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<number | null>(null);
  return {
    hoveredRunId,
    hoveredCellOutletId: pipeMode ? null : hoveredCellOutletId,
    hoveredRoomId: pipeMode ? null : hoveredRoomId,
    hoveredEquipment: pipeMode ? null : hoveredEquipment,
    hoveredEnemyId: pipeMode ? null : hoveredEnemyId,
    onHoverRun: setHoveredRunId,
    onHoverCellOutlet: pipeMode ? NO_HOVER : setHoveredCellOutletId,
    onHoverRoom: setHoveredRoomId,
    onHoverEquipment: pipeMode ? NO_HOVER : setHoveredEquipment,
    onHoverEnemy: pipeMode ? NO_HOVER : setHoveredEnemyId,
  };
};
