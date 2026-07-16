import { Wind, Droplets, X } from "lucide-react";
import { useCallback } from "react";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import type { PipePreviewOption } from "../../application/storeTypes";
import { roomDefinition } from "../../presentation/defaultGame";

/**
 * The pipe-build confirm, at the cursor where the drag ended (M3 preview-then-confirm):
 * "Confirm A ⇄ B" with Cancel and one button per buildable phase. Confirming builds and
 * opens the line so it flows immediately.
 */
export const PipePreviewPopup = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const preview = useGameStore((state) => state.pipePreview);
  const dispatch = useGameStore((state) => state.dispatch);
  const setPipePreview = useGameStore((state) => state.setPipePreview);
  const cancel = useCallback(() => setPipePreview(null), [setPipePreview]);
  const select = useCallback(
    (option: PipePreviewOption) => {
      if (preview?.selectedKind !== option.kind)
        setPipePreview(preview ? { ...preview, selectedKind: option.kind } : null);
    },
    [preview, setPipePreview]
  );
  const build = useCallback(
    (option: PipePreviewOption) => {
      if (!preview) return;
      dispatch({
        type: "build_connection",
        kind: option.kind,
        fromRoomId: preview.fromRoomId,
        toRoomId: preview.toRoomId,
      });
      // Building opens the line so the feed flows without a second, hidden step.
      dispatch({ type: "set_conduit", connectionId: option.connectionId, enabled: true });
      setPipePreview(null);
    },
    [dispatch, preview, setPipePreview]
  );
  if (!preview) return null;
  return (
    <div
      className="pipe-confirm-popup"
      data-testid="pipe-confirm-popup"
      style={{ left: preview.anchor.x, top: preview.anchor.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="pipe-confirm-title">
        {translator.text("ui.pipes.confirm.title", {
          from: roomDefinition(game, preview.fromRoomId).code,
          to: roomDefinition(game, preview.toRoomId).code,
        })}
      </span>
      <div className="pipe-confirm-actions">
        <button
          type="button"
          className="pipe-confirm-button cancel"
          data-testid="pipe-confirm-cancel"
          onClick={cancel}
        >
          <X size={13} /> {translator.text("ui.pipes.confirm.cancel")}
        </button>
        {preview.options.map((option) => (
          <button
            key={option.kind}
            type="button"
            className={`pipe-confirm-button ${option.kind === "gas_line" ? "gas" : "liquid"} ${preview.selectedKind === option.kind ? "selected" : ""}`}
            data-testid={`pipe-confirm-${option.kind}`}
            disabled={!option.buildable}
            onFocus={() => select(option)}
            onPointerEnter={() => select(option)}
            onClick={() => build(option)}
          >
            {option.kind === "gas_line" ? <Wind size={13} /> : <Droplets size={13} />}{" "}
            {translator.text(
              option.kind === "gas_line" ? "ui.pipes.confirm.gas" : "ui.pipes.confirm.liquid"
            )}{" "}
            · {translator.text("ui.pipes.confirm.cost", { cost: String(option.cost) })}
          </button>
        ))}
      </div>
    </div>
  );
};
