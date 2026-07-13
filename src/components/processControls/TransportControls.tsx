import { ArrowRightLeft, Droplets, Plus, Trash2, Wind } from "lucide-react";
import { useCallback } from "react";
import { ROOM_DEFINITIONS, TRANSPORT_RUNS } from "../../game/config";
import { transportPhaseAvailable } from "../../game/queries";
import { commandDecision as evaluateCommand } from "../../presentation/selectors";
import { useGameStore } from "../../application/store";
import type { GameState, TransportPhase, TransportRunId } from "../../game/types";
import { ConduitActuator } from "./ActuatorControls";

interface PhaseModel {
  installed: boolean;
  label: string;
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
    label: phase === "gas" ? "Gas duct" : "Liquid pipe",
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
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const command = installed
    ? ({ type: "dismantle_transport", runId, phase } as const)
    : ({ type: "build_transport", runId, phase } as const);
  const decision = evaluateCommand(game, command);
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
        title={decision.reason ?? undefined}
        aria-label={`Dismantle ${phase} conduit`}
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
      title={decision.reason ?? undefined}
      data-testid={`build-${runId}-${phase}`}
      onClick={build}
    >
      <Plus size={12} /> BUILD · {decision.cost} M
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
        <strong>{model.label}</strong>
        <em>{model.installed ? "PHYSICAL ROUTE" : "AVAILABLE TO BUILD"}</em>
        <PhaseAction installed={model.installed} phase={phase} runId={runId} />
      </header>
      {model.installed ? (
        <div className="actuator-list">
          <ConduitActuator phase={phase} runId={runId} />
        </div>
      ) : (
        <p>
          Build along the fixed spatial route. The conduit begins empty, then carries a mixed
          inventory within its rated capacity.
        </p>
      )}
    </div>
  );
};

export const TransportRunPanel = ({ runId }: { runId: TransportRunId }) => {
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
          <small>{ROOM_DEFINITIONS[otherRoom].name}</small>
        </div>
      </div>
      <TransportPhasePanel phase="gas" runId={runId} />
      <TransportPhasePanel phase="liquid" runId={runId} />
    </article>
  );
};
