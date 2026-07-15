import { Check, Spline, X } from "lucide-react";
import { useCallback } from "react";
import { transportPhaseAvailable } from "../game/queries";

import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { PipePreview, PipePreviewOption } from "../application/storeTypes";
import { roomDefinition } from "../presentation/defaultGame";
import { TransportRunPanel } from "./processControls/TransportControls";
import { gasConduitState, liquidConduitState } from "../game/world/instances";

const PreviewOptionRow = ({
  option,
  onBuild,
}: {
  option: PipePreviewOption;
  onBuild: (option: PipePreviewOption) => void;
}) => {
  const { commandCopy, translator } = useGamePresentation();
  const kindLabel = translator.text(
    option.kind === "gas_line" ? "ui.pipes.preview.gasLine" : "ui.pipes.preview.liquidLine"
  );
  return (
    <div className="pipe-preview-option" data-testid={`pipe-preview-option-${option.kind}`}>
      <div>
        <strong>{kindLabel}</strong>
        <small>
          {translator.text("ui.pipes.preview.length", { cells: String(option.route.length) })} ·{" "}
          {translator.text("ui.pipes.preview.cost", { cost: String(option.cost) })}
        </small>
      </div>
      <button
        type="button"
        className="room-details-button"
        data-testid={`pipe-preview-build-${option.kind}`}
        disabled={!option.buildable}
        title={
          option.buildable
            ? undefined
            : (commandCopy({ code: option.reason, cost: option.cost }) ?? undefined)
        }
        onClick={() => onBuild(option)}
      >
        <Check size={13} /> {translator.text("ui.pipes.preview.build")}
      </button>
    </div>
  );
};

const PipePreviewCard = ({ preview }: { preview: PipePreview }) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const setPipePreview = useGameStore((state) => state.setPipePreview);
  const build = useCallback(
    (option: PipePreviewOption) => {
      dispatch({
        type: "build_connection",
        kind: option.kind,
        fromRoomId: preview.fromRoomId,
        toRoomId: preview.toRoomId,
      });
      setPipePreview(null);
    },
    [dispatch, preview.fromRoomId, preview.toRoomId, setPipePreview]
  );
  const cancel = useCallback(() => setPipePreview(null), [setPipePreview]);
  return (
    <article className="pipe-preview" data-testid="pipe-preview">
      <header>
        <strong>
          {roomDefinition(preview.fromRoomId).code} ⇄ {roomDefinition(preview.toRoomId).code}
        </strong>
        <button
          type="button"
          className="room-details-button"
          data-testid="pipe-preview-cancel"
          onClick={cancel}
        >
          <X size={13} /> {translator.text("ui.pipes.preview.cancel")}
        </button>
      </header>
      <p className="pipe-board-intro">{translator.text("ui.pipes.preview.hint")}</p>
      {preview.options.map((option) => (
        <PreviewOptionRow key={option.kind} option={option} onBuild={build} />
      ))}
    </article>
  );
};

export const PipeBoard = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const pipePreview = useGameStore((state) => state.pipePreview);
  const setPipeMode = useGameStore((state) => state.setPipeMode);
  const close = useCallback(() => setPipeMode(false), [setPipeMode]);
  const runs = game.world.connections.filter(
    (runId) =>
      (transportPhaseAvailable(game, runId, "gas") && gasConduitState(game, runId).installed) ||
      (transportPhaseAvailable(game, runId, "liquid") && liquidConduitState(game, runId).installed)
  );
  return (
    <aside className="room-inspector pipe-board" data-testid="pipe-board">
      <div className="inspector-header">
        <div className="inspector-room-code">
          <span>
            <Spline size={14} />
          </span>
          <em>{translator.text("ui.pipes.subtitle")}</em>
        </div>
        <h2>{translator.text("ui.pipes.title")}</h2>
        <button
          className="room-details-button"
          type="button"
          data-testid="pipe-board-close"
          onClick={close}
        >
          <X size={14} /> {translator.text("ui.pipes.close")}
        </button>
      </div>
      <div className="inspector-scroll">
        <p className="pipe-board-intro">{translator.text("ui.pipes.intro")}</p>
        {pipePreview && <PipePreviewCard preview={pipePreview} />}
        {runs.length === 0 && !pipePreview && (
          <p className="pipe-board-intro" data-testid="pipe-board-empty">
            {translator.text("ui.pipes.empty")}
          </p>
        )}
        <div className="transport-run-list">
          {runs.map((runId) => (
            <TransportRunPanel key={runId} runId={runId} />
          ))}
        </div>
      </div>
    </aside>
  );
};
