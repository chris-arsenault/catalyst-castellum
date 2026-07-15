import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { RoomId, ConnectionId } from "../../game/types";
import type { EquipmentHover } from "./EquipmentLayer";
import type { CellOutletId } from "./cellOutletRenderModel";

const NO_HOVER = () => undefined;
const TOOLTIP_INTENT_MS = 200;

/** Where an open tooltip is pinned: the cursor position captured when it committed. */
export interface TooltipAnchor {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

type AnchorProbe = () => TooltipAnchor | null;

/** Tracks the cursor over the map wrapper so tooltip commits can pin themselves to it. */
export const usePointerProbe = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const trackPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
  }, []);
  const probePointer = useCallback((): TooltipAnchor | null => {
    const bounds = wrapperRef.current?.getBoundingClientRect();
    const point = pointerRef.current;
    if (!bounds || !point) return null;
    const x = point.x - bounds.left;
    const y = point.y - bounds.top;
    return { x, y, flipX: x > bounds.width * 0.55, flipY: y > bounds.height * 0.45 };
  }, []);
  return { wrapperRef, trackPointer, probePointer };
};

/**
 * Commits a hover target only after the cursor has rested on it briefly; leaving
 * clears immediately. The anchor snapshot freezes the tooltip where it opened.
 */
const useHoverIntent = <T>(
  probe: AnchorProbe,
  onAnchor: (anchor: TooltipAnchor | null) => void
): [T | null, (value: T | null) => void] => {
  const [committed, setCommitted] = useState<T | null>(null);
  const timer = useRef<number | null>(null);
  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => cancel, []);
  const intend = useCallback(
    (value: T | null) => {
      cancel();
      if (value === null) {
        setCommitted(null);
        return;
      }
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setCommitted(value);
        onAnchor(probe());
      }, TOOLTIP_INTENT_MS);
    },
    [onAnchor, probe]
  );
  return [committed, intend];
};

/** Map hover state; while the pipe board is open only rooms and runs stay hoverable. */
export const useMapHover = (pipeMode: boolean, probe: AnchorProbe) => {
  // Lane glow responds instantly; only the tooltips wait for hover intent.
  const [glowRunId, setGlowRunId] = useState<ConnectionId | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor | null>(null);
  const [hoveredRunId, intendRun] = useHoverIntent<ConnectionId>(probe, setTooltipAnchor);
  const [hoveredCellOutletId, intendOutlet] = useHoverIntent<CellOutletId>(probe, setTooltipAnchor);
  const [hoveredRoomId, intendRoom] = useHoverIntent<RoomId>(probe, setTooltipAnchor);
  const [hoveredEquipment, intendEquipment] = useHoverIntent<EquipmentHover>(
    probe,
    setTooltipAnchor
  );
  const [hoveredEnemyId, intendEnemy] = useHoverIntent<number>(probe, setTooltipAnchor);
  const onHoverRun = useCallback(
    (runId: ConnectionId | null) => {
      setGlowRunId(runId);
      intendRun(runId);
    },
    [intendRun]
  );
  return {
    glowRunId,
    tooltipAnchor,
    hoveredRunId,
    hoveredCellOutletId: pipeMode ? null : hoveredCellOutletId,
    hoveredRoomId: pipeMode ? null : hoveredRoomId,
    hoveredEquipment: pipeMode ? null : hoveredEquipment,
    hoveredEnemyId: pipeMode ? null : hoveredEnemyId,
    onHoverRun,
    onHoverCellOutlet: pipeMode ? NO_HOVER : intendOutlet,
    onHoverRoom: intendRoom,
    onHoverEquipment: pipeMode ? NO_HOVER : intendEquipment,
    onHoverEnemy: pipeMode ? NO_HOVER : intendEnemy,
  };
};
