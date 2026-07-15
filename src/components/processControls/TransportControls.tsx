import { ArrowRightLeft, Droplets, Trash2, Wind } from "lucide-react";
import { useCallback } from "react";
import { transportPhaseAvailable } from "../../game/queries";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import type { GameState, TransportPhase, TransportRunId } from "../../game/types";
import { ConduitActuator } from "./ActuatorControls";
import { roomCopy } from "../../presentation/entityCopy";
import { gasConduitState, liquidConduitState } from "../../game/world/instances";
import { roomDefinition, transportRunDefinition } from "../../presentation/defaultGame";

interface PhaseModel {
  installed: boolean;
}

const phaseModel = (
  game: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): PhaseModel | null => {
  const definition = transportRunDefinition(runId)[phase];
  if (!definition || !transportPhaseAvailable(game, runId, phase)) return null;
  const installed =
    phase === "gas"
      ? gasConduitState(game, runId).installed
      : liquidConduitState(game, runId).installed;
  return {
    installed,
  };
};

const PhaseIcon = ({ phase }: { phase: TransportPhase }) =>
  phase === "gas" ? <Wind size={14} /> : <Droplets size={14} />;

const DismantleAction = ({ phase, runId }: { phase: TransportPhase; runId: TransportRunId }) => {
  const { commandCopy, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const decision = selectors.commandDecision(game, {
    type: "dismantle_transport",
    runId,
    phase,
  });
  const dismantle = useCallback(
    () => dispatch({ type: "dismantle_transport", runId, phase }),
    [dispatch, phase, runId]
  );
  return (
    <button
      type="button"
      disabled={!decision.allowed}
      title={commandCopy(decision) ?? undefined}
      aria-label={translator.text("ui.process.dismantleConduit", {
        phase: translator.text(
          phase === "gas" ? "ui.process.gasConduit" : "ui.process.liquidConduit"
        ),
      })}
      onClick={dismantle}
    >
      <Trash2 size={12} /> +{decision.refund} M
    </button>
  );
};

const TransportPhasePanel = ({
  phase,
  runId,
}: {
  phase: TransportPhase;
  runId: TransportRunId;
}) => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const model = phaseModel(game, runId, phase);
  if (!model?.installed) return null;
  return (
    <div
      className={`transport-phase-control ${phase} installed`}
      data-testid={`conduit-panel-${runId}-${phase}`}
    >
      <header>
        <span>
          <PhaseIcon phase={phase} />
        </span>
        <strong>
          {translator.text(phase === "gas" ? "ui.process.gasDuct" : "ui.process.liquidPipe")}
        </strong>
        <em>{translator.text("ui.process.ready")}</em>
        <DismantleAction phase={phase} runId={runId} />
      </header>
      <div className="actuator-list">
        <ConduitActuator phase={phase} runId={runId} />
      </div>
    </div>
  );
};

export const TransportRunPanel = ({ runId }: { runId: TransportRunId }) => {
  const { translator } = useGamePresentation();
  const run = transportRunDefinition(runId);
  const [leftRoom, rightRoom] = run.rooms;
  return (
    <article className="transport-run-control" data-testid={`pipe-run-${runId}`}>
      <div className="transport-run-heading">
        <ArrowRightLeft size={14} />
        <div>
          <strong>
            {roomDefinition(leftRoom).code} ⇄ {roomDefinition(rightRoom).code}
          </strong>
          <small>
            {roomCopy(roomDefinition(leftRoom), translator).name} ·{" "}
            {roomCopy(roomDefinition(rightRoom), translator).name}
          </small>
        </div>
      </div>
      <TransportPhasePanel phase="gas" runId={runId} />
      <TransportPhasePanel phase="liquid" runId={runId} />
    </article>
  );
};
