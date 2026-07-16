import { Spline, X } from "lucide-react";
import { useCallback } from "react";
import { transportPhaseAvailable } from "../game/queries";

import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { TransportRunPanel } from "./processControls/TransportControls";
import { gasConduitState, liquidConduitState } from "../game/world/instances";

export const PipeBoard = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
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
        {runs.length === 0 && (
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
