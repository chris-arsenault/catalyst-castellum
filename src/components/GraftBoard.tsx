import { ArrowLeft, ArrowRight, Blocks, Check, Coins, Trash2, X } from "lucide-react";
import { useCallback } from "react";

import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { GraftPreview, GraftPreviewOption } from "../application/storeTypes";
import { hullHardpoints, planGraftPreview, type HardpointRef } from "../presentation/graftPlanning";
import { roomDefinition } from "../presentation/defaultGame";

const GraftPreviewCard = ({ preview }: { preview: GraftPreview }) => {
  const { commandCopy, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const setGraftPreview = useGameStore((state) => state.setGraftPreview);
  const graft = useCallback(
    (option: GraftPreviewOption) => {
      dispatch({
        type: "graft_module",
        hostRoomId: preview.hostRoomId,
        hardpointId: preview.hardpointId,
        moduleId: option.moduleId,
      });
      setGraftPreview(null);
    },
    [dispatch, preview.hostRoomId, preview.hardpointId, setGraftPreview]
  );
  const cancel = useCallback(() => setGraftPreview(null), [setGraftPreview]);
  return (
    <article className="pipe-preview" data-testid="graft-preview">
      <header>
        <strong>{translator.text("ui.graft.preview.title")}</strong>
        <button
          type="button"
          className="room-details-button"
          data-testid="graft-preview-cancel"
          onClick={cancel}
        >
          <X size={13} /> {translator.text("ui.graft.preview.cancel")}
        </button>
      </header>
      <p className="pipe-board-intro">{translator.text("ui.graft.preview.hint")}</p>
      {preview.options.map((option) => (
        <div
          key={option.moduleId}
          className="pipe-preview-option"
          data-testid={`graft-preview-option-${option.moduleId}`}
        >
          <div>
            <strong>{option.label}</strong>
            <small>
              {translator.text("ui.graft.preview.footprint", {
                width: String(option.footprint.width),
                height: String(option.footprint.height),
              })}{" "}
              · {translator.text("ui.graft.preview.cost", { cost: String(option.cost) })}
            </small>
          </div>
          <button
            type="button"
            className="room-details-button"
            data-testid={`graft-preview-build-${option.moduleId}`}
            disabled={!option.buildable}
            title={
              option.buildable
                ? undefined
                : (commandCopy({ code: option.reason, cost: option.cost }) ?? undefined)
            }
            onClick={() => graft(option)}
          >
            <Check size={13} /> {translator.text("ui.graft.preview.build")}
          </button>
        </div>
      ))}
    </article>
  );
};

const HardpointRow = ({ hardpoint }: { hardpoint: HardpointRef }) => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const setGraftPreview = useGameStore((state) => state.setGraftPreview);
  const open = useCallback(
    () => setGraftPreview(planGraftPreview(game, hardpoint.hostRoomId, hardpoint.hardpointId)),
    [game, hardpoint.hostRoomId, hardpoint.hardpointId, setGraftPreview]
  );
  const dismantle = useCallback(() => {
    if (hardpoint.occupiedByRoomId)
      dispatch({ type: "dismantle_module", roomId: hardpoint.occupiedByRoomId });
  }, [dispatch, hardpoint.occupiedByRoomId]);
  const label = `${hardpoint.hostCode} · ${hardpoint.hardpointId}`;
  if (hardpoint.occupiedByRoomId) {
    return (
      <div className="transport-run-control" data-testid={`graft-slot-${hardpoint.hardpointId}`}>
        <div className="transport-run-heading">
          <Blocks size={14} />
          <strong>
            {label} → {roomDefinition(game, hardpoint.occupiedByRoomId).code}
          </strong>
        </div>
        <button
          type="button"
          className="room-details-button"
          data-testid={`graft-dismantle-${hardpoint.hardpointId}`}
          onClick={dismantle}
        >
          <Trash2 size={13} /> {translator.text("ui.graft.dismantle")}
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="transport-run-control graft-open"
      data-testid={`graft-hardpoint-${hardpoint.hardpointId}`}
      onClick={open}
    >
      <div className="transport-run-heading">
        <Blocks size={14} />
        <strong>{label}</strong>
      </div>
      <small>{translator.text("ui.graft.available")}</small>
    </button>
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

const GraftWorkspace = ({
  hardpoints,
  preview,
}: {
  hardpoints: HardpointRef[];
  preview: GraftPreview | null;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className="graft-workspace">
      <section className="graft-hardpoints">
        <p>{translator.text("ui.graft.intro")}</p>
        {hardpoints.length === 0 && (
          <p className="pipe-board-intro" data-testid="graft-board-empty">
            {translator.text("ui.graft.empty")}
          </p>
        )}
        <div className="transport-run-list">
          {hardpoints.map((hardpoint) => (
            <HardpointRow
              key={`${hardpoint.hostRoomId}:${hardpoint.hardpointId}`}
              hardpoint={hardpoint}
            />
          ))}
        </div>
      </section>
      <section className="graft-selection">
        {preview ? (
          <GraftPreviewCard preview={preview} />
        ) : (
          <div className="graft-selection-empty">
            <Blocks size={34} />
            <strong>{translator.text("ui.graft.selection.title")}</strong>
            <p>{translator.text("ui.graft.selection.detail")}</p>
          </div>
        )}
      </section>
    </div>
  );
};

const GraftFooter = ({ onTravel }: { onTravel: () => void }) => {
  const { translator } = useGamePresentation();
  return (
    <footer className="graft-footer">
      <span>{translator.text("ui.graft.footer")}</span>
      <button
        type="button"
        className="travel-choice compact"
        data-testid="graft-travel-to-next-site"
        onClick={onTravel}
      >
        {translator.text("ui.intermission.travel.action")} <ArrowRight size={18} />
      </button>
    </footer>
  );
};

export const GraftBoard = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const graftPreview = useGameStore((state) => state.graftPreview);
  const setGraftMode = useGameStore((state) => state.setGraftMode);
  const close = useCallback(() => setGraftMode(false), [setGraftMode]);
  const travel = useCallback(() => {
    setGraftMode(false);
    if (dispatch({ type: "start_next_level" })) dispatch({ type: "dock_at_site" });
  }, [dispatch, setGraftMode]);
  const hardpoints = hullHardpoints(game);
  return (
    <main className="graft-stage" data-testid="graft-board">
      <section className="graft-screen">
        <GraftHeader matter={game.matter} onClose={close} />
        <GraftWorkspace hardpoints={hardpoints} preview={graftPreview} />
        <GraftFooter onTravel={travel} />
      </section>
    </main>
  );
};
