/* eslint-disable max-lines-per-function -- The builder controller keeps one coherent edit session. */
import { ArrowLeft, ArrowRight, Blocks, Check, Coins, Eraser, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { GraftPreview, GraftPreviewOption } from "../application/storeTypes";
import type { GridCell, RoomId } from "../game/types";
import { DEFAULT_GAME_DEFINITION as PACK } from "../game/definition";
import { plannedGraft } from "../game/world/graft";
import { hullPlanningMap } from "../game/world/hullFragment";
import { plannedHullConnection } from "../game/world/mapEdits";
import { planGraftPreview } from "../presentation/graftPlanning";
import { HullBuilderCanvas, type HullBuildTool } from "./HullBuilderCanvas";
import { GraftPortalPalette, GraftToolPalette } from "./GraftBuilderPalettes";

interface PreviewCardProps {
  preview: GraftPreview;
  selectedModuleId: string | null;
  onSelect: (moduleId: string) => void;
  onClose: () => void;
}

const GraftPreviewCard = ({ preview, selectedModuleId, onSelect, onClose }: PreviewCardProps) => {
  const { commandCopy, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const setGraftPreview = useGameStore((state) => state.setGraftPreview);
  const graft = useCallback(
    (option: GraftPreviewOption) => {
      if (
        dispatch({
          type: "graft_module",
          hostRoomId: preview.hostRoomId,
          hardpointId: preview.hardpointId,
          moduleId: option.moduleId,
        })
      ) {
        setGraftPreview(null);
        onClose();
      }
    },
    [dispatch, onClose, preview.hardpointId, preview.hostRoomId, setGraftPreview]
  );
  return (
    <section className="graft-module-palette" data-testid="graft-preview">
      <header>
        <div>
          <strong>{translator.text("ui.graft.preview.title")}</strong>
          <small>{translator.text("ui.graft.preview.hint")}</small>
        </div>
        <button
          type="button"
          className="graft-icon-button"
          data-testid="graft-preview-cancel"
          onClick={onClose}
        >
          <Eraser size={14} /> {translator.text("ui.graft.preview.cancel")}
        </button>
      </header>
      <div className="graft-module-options">
        {preview.options.map((option) => (
          <article
            key={option.moduleId}
            className={selectedModuleId === option.moduleId ? "selected" : ""}
            data-testid={`graft-preview-option-${option.moduleId}`}
          >
            <button
              type="button"
              className="graft-module-select"
              disabled={!option.buildable}
              onClick={() => onSelect(option.moduleId)}
            >
              <strong>{option.label}</strong>
              <small>
                {translator.text("ui.graft.preview.footprint", {
                  width: String(option.footprint.width),
                  height: String(option.footprint.height),
                })}
              </small>
            </button>
            <button
              type="button"
              className="graft-build-button"
              data-testid={`graft-preview-build-${option.moduleId}`}
              disabled={!option.buildable || selectedModuleId !== option.moduleId}
              title={
                option.buildable
                  ? undefined
                  : (commandCopy({ code: option.reason, cost: option.cost }) ?? undefined)
              }
              onClick={() => graft(option)}
            >
              <Check size={13} />
              {translator.text("ui.graft.preview.cost", { cost: String(option.cost) })}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};

const RoomPalette = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const rooms = Object.values(game.map.rooms).filter((room) => room.id.startsWith("graft:"));
  if (rooms.length === 0) return null;
  return (
    <section className="graft-room-palette">
      <strong>{translator.text("ui.graft.rooms.title")}</strong>
      {rooms.map((room) => (
        <button
          key={room.id}
          type="button"
          data-testid={`graft-dismantle-${room.id}`}
          onClick={() => dispatch({ type: "dismantle_module", roomId: room.id })}
        >
          <span>{room.code}</span>
          <Trash2 size={13} /> {translator.text("ui.graft.dismantle")}
        </button>
      ))}
    </section>
  );
};

const GraftHeader = ({ matter, onClose }: { matter: number; onClose: () => void }) => {
  const { translator } = useGamePresentation();
  return (
    <header className="graft-screen-header">
      <button
        className="graft-back-button"
        type="button"
        data-testid="graft-board-close"
        onClick={onClose}
      >
        <ArrowLeft size={16} /> {translator.text("ui.graft.close")}
      </button>
      <div className="graft-title">
        <span>
          <Blocks size={22} />
        </span>
        <div>
          <em>{translator.text("ui.graft.subtitle")}</em>
          <h1>{translator.text("ui.graft.title")}</h1>
        </div>
      </div>
      <div className="graft-matter">
        <Coins size={17} />
        <strong>{translator.text("ui.graft.matter", { matter: String(matter) })}</strong>
      </div>
    </header>
  );
};

export const GraftBoard = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const graftPreview = useGameStore((state) => state.graftPreview);
  const setGraftMode = useGameStore((state) => state.setGraftMode);
  const setGraftPreview = useGameStore((state) => state.setGraftPreview);
  const [tool, setTool] = useState<HullBuildTool>("select");
  const [connectionStartRoomId, setConnectionStartRoomId] = useState<RoomId | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const planningMap = useMemo(() => hullPlanningMap(game.map), [game.map]);
  const previewPlan = useMemo(
    () =>
      graftPreview && selectedModuleId
        ? plannedGraft(
            PACK,
            game.map,
            graftPreview.hostRoomId,
            graftPreview.hardpointId,
            selectedModuleId
          )
        : null,
    [game.map, graftPreview, selectedModuleId]
  );
  const displayMap = tool === "select" && previewPlan ? previewPlan.map : planningMap;
  const connectionTargetRoomIds = useMemo(
    () =>
      connectionStartRoomId
        ? Object.keys(planningMap.rooms).filter(
            (roomId) =>
              roomId !== connectionStartRoomId &&
              plannedHullConnection(planningMap, connectionStartRoomId, roomId) !== null
          )
        : Object.keys(planningMap.rooms),
    [connectionStartRoomId, planningMap]
  );
  const closePreview = useCallback(() => {
    setGraftPreview(null);
    setSelectedModuleId(null);
  }, [setGraftPreview]);
  const close = useCallback(() => {
    closePreview();
    setGraftMode(false);
  }, [closePreview, setGraftMode]);
  const travel = useCallback(() => {
    closePreview();
    setGraftMode(false);
    dispatch({ type: "start_next_level" });
  }, [closePreview, dispatch, setGraftMode]);
  const chooseTool = useCallback(
    (nextTool: HullBuildTool) => {
      closePreview();
      setConnectionStartRoomId(null);
      setTool(nextTool);
    },
    [closePreview]
  );
  const chooseHardpoint = useCallback(
    (roomId: RoomId, hardpointId: string) => {
      const preview = planGraftPreview(game, roomId, hardpointId);
      setTool("select");
      setGraftPreview(preview);
      setSelectedModuleId(preview.options.find((option) => option.buildable)?.moduleId ?? null);
    },
    [game, setGraftPreview]
  );
  const editCells = useCallback(
    (roomId: RoomId, cells: readonly GridCell[]) => {
      if (tool === "select" || tool === "connection") return;
      dispatch({
        type: "edit_hull_cells",
        roomId,
        cells,
        terrain: tool === "erase" ? "clear" : tool,
      });
    },
    [dispatch, tool]
  );
  const chooseConnectionRoom = useCallback(
    (roomId: RoomId) => {
      if (tool !== "connection") return;
      if (!connectionStartRoomId || connectionStartRoomId === roomId) {
        setConnectionStartRoomId(connectionStartRoomId === roomId ? null : roomId);
        return;
      }
      if (
        dispatch({
          type: "connect_hull_rooms",
          fromRoomId: connectionStartRoomId,
          toRoomId: roomId,
        })
      )
        setConnectionStartRoomId(null);
    },
    [connectionStartRoomId, dispatch, tool]
  );

  return (
    <main className="graft-stage" data-testid="graft-board">
      <section className="graft-screen">
        <GraftHeader matter={game.matter} onClose={close} />
        <div className="graft-builder-workspace">
          <section className="graft-blueprint">
            <HullBuilderCanvas
              game={game}
              map={displayMap}
              candidateRoomId={previewPlan?.room.id ?? null}
              tool={tool}
              connectionStartRoomId={connectionStartRoomId}
              connectionTargetRoomIds={connectionTargetRoomIds}
              onStroke={editCells}
              onRoom={chooseConnectionRoom}
              onHardpoint={chooseHardpoint}
            />
            {graftPreview && (
              <GraftPreviewCard
                preview={graftPreview}
                selectedModuleId={selectedModuleId}
                onSelect={setSelectedModuleId}
                onClose={closePreview}
              />
            )}
          </section>
          <aside className="graft-builder-sidebar">
            <GraftToolPalette tool={tool} onTool={chooseTool} />
            <GraftPortalPalette />
            <RoomPalette />
          </aside>
        </div>
        <footer className="graft-footer">
          <span>{translator.text("ui.graft.footer")}</span>
          <button
            type="button"
            className="travel-choice compact"
            data-testid="graft-travel-to-next-site"
            onClick={travel}
          >
            {translator.text("ui.intermission.travel.action")}
            <ArrowRight size={18} />
          </button>
        </footer>
      </section>
    </main>
  );
};
