import { ArrowRightLeft, Droplets, Plus, Trash2, Wind } from "lucide-react";
import { useCallback } from "react";
import { ROOM_DEFINITIONS, TRANSPORT_RUNS } from "../../presentation/defaultGame";
import { transportPhaseAvailable } from "../../game/queries";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import type { GameState, TransportPhase, TransportRunId } from "../../game/types";
import { ConduitActuator } from "./ActuatorControls";
import { roomCopy } from "../../presentation/entityCopy";

interface PhaseModel {
  installed: boolean;
}

const phaseModel = (
  game: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): PhaseModel | null => {
  const definition = TRANSPORT_RUNS[runId][phase];
  if (!definition || !transportPhaseAvailable(game, runId, phase)) return null;
  const installed =
    phase === "gas" ? game.gasConduits[runId].installed : game.liquidConduits[runId].installed;
  return {
    installed,
  };
};

const PhaseIcon = ({ phase }: { phase: TransportPhase }) =>
  phase === "gas" ? <Wind size={14} /> : <Droplets size={14} />;

const PhaseAction = ({
  installed,
  phase,
  runId,
}: {
  installed: boolean;
  phase: TransportPhase;
  runId: TransportRunId;
}) => {
  const { commandCopy, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const command = installed
    ? ({ type: "dismantle_transport", runId, phase } as const)
    : ({ type: "build_transport", runId, phase } as const);
  const decision = selectors.commandDecision(game, command);
  const dismantle = useCallback(
    () => dispatch({ type: "dismantle_transport", runId, phase }),
    [dispatch, phase, runId]
  );
  const build = useCallback(
    () => dispatch({ type: "build_transport", runId, phase }),
    [dispatch, phase, runId]
  );
  if (installed) {
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
  }
  return (
    <button
      type="button"
      disabled={!decision.allowed}
      title={commandCopy(decision) ?? undefined}
      data-testid={`build-${runId}-${phase}`}
      onClick={build}
    >
      <Plus size={12} /> {translator.text("ui.process.buildCost", { cost: decision.cost })}
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
  if (!model) return null;
  const installationClass = model.installed ? "installed" : "unbuilt";
  return (
    <div
      className={`transport-phase-control ${phase} ${installationClass}`}
      data-testid={`conduit-panel-${runId}-${phase}`}
    >
      <header>
        <span>
          <PhaseIcon phase={phase} />
        </span>
        <strong>
          {translator.text(phase === "gas" ? "ui.process.gasDuct" : "ui.process.liquidPipe")}
        </strong>
        <em>{translator.text(model.installed ? "ui.process.ready" : "ui.process.buildReady")}</em>
        <PhaseAction installed={model.installed} phase={phase} runId={runId} />
      </header>
      {model.installed ? (
        <div className="actuator-list">
          <ConduitActuator phase={phase} runId={runId} />
        </div>
      ) : null}
    </div>
  );
};

export const TransportRunPanel = ({ runId }: { runId: TransportRunId }) => {
  const { translator } = useGamePresentation();
  const roomId = useGameStore((state) => state.selectedRoomId);
  const run = TRANSPORT_RUNS[runId];
  const otherRoom = run.rooms[0] === roomId ? run.rooms[1] : run.rooms[0];
  return (
    <article className="transport-run-control">
      <div className="transport-run-heading">
        <ArrowRightLeft size={14} />
        <div>
          <strong>
            {ROOM_DEFINITIONS[roomId].code} ⇄ {ROOM_DEFINITIONS[otherRoom].code}
          </strong>
          <small>{roomCopy(ROOM_DEFINITIONS[otherRoom], translator).name}</small>
        </div>
      </div>
      <TransportPhasePanel phase="gas" runId={runId} />
      <TransportPhasePanel phase="liquid" runId={runId} />
    </article>
  );
};
