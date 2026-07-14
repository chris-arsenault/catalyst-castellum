import { CirclePower, Gauge } from "lucide-react";
import { useCallback } from "react";
import {
  GAS_BUFFERS,
  GAS_LABELS,
  LIQUID_BUFFERS,
  LIQUID_LABELS,
  REACTION_DEFINITIONS,
  ROOM_DEFINITIONS,
  SPECIES_DEFINITIONS,
  TRANSPORT_RUNS,
} from "../../presentation/defaultGame";
import {
  conduitCapacity,
  gasAmountTotal,
  gasConduitPressure,
  liquidAmountTotal,
  liquidConduitFillRatio,
} from "../../game/queries";
import { commandDecision as evaluateCommand } from "../../presentation/selectors";
import { limitingFactorCopy } from "../../presentation/limitingFactorCopy";
import { useGameStore } from "../../application/store";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type ActuatorKind,
  type ConduitDestinationKind,
  type GameState,
  type GasAmounts,
  type LiquidAmounts,
  type TransportPhase,
  type TransportRunId,
} from "../../game/types";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "../../tutorial/anchors";
import { bufferCopy, transportCopy } from "../../presentation/entityCopy";

const MIN_VISIBLE_AMOUNT = 0.005;

const CONDUIT_TUTORIAL_ANCHORS: Partial<
  Record<`${TransportRunId}:${TransportPhase}`, TutorialAnchorId>
> = {
  "cell_furnace:gas": TUTORIAL_ANCHORS.conduitCellFurnaceGas,
  "core_cell:gas": TUTORIAL_ANCHORS.conduitCoreCellGas,
  "core_cell:liquid": TUTORIAL_ANCHORS.conduitCoreCellLiquid,
  "core_furnace:gas": TUTORIAL_ANCHORS.conduitCoreFurnaceGas,
  "furnace_return:gas": TUTORIAL_ANCHORS.conduitFurnaceReturnGas,
  "return_final:gas": TUTORIAL_ANCHORS.conduitReturnFinalGas,
};

const conduitTutorialAnchor = (
  runId: TransportRunId,
  phase: TransportPhase
): TutorialAnchorId | null => CONDUIT_TUTORIAL_ANCHORS[`${runId}:${phase}`] ?? null;

const gasMixtureSummary = (gas: GasAmounts): string => {
  const total = gasAmountTotal(gas);
  if (total < MIN_VISIBLE_AMOUNT) return "empty";
  return GAS_TYPES.filter((species) => gas[species] >= MIN_VISIBLE_AMOUNT)
    .sort((left, right) => gas[right] - gas[left])
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${Math.round((gas[species] / total) * 100)}%`
    )
    .join(" · ");
};

const liquidMixtureSummary = (liquid: LiquidAmounts): string => {
  const total = liquidAmountTotal(liquid);
  if (total < MIN_VISIBLE_AMOUNT) return "empty";
  return LIQUID_TYPES.filter((species) => liquid[species] >= MIN_VISIBLE_AMOUNT)
    .sort((left, right) => liquid[right] - liquid[left])
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${Math.round((liquid[species] / total) * 100)}%`
    )
    .join(" · ");
};

const gasFlowSummary = (flow: GasAmounts): string => {
  const entries = GAS_TYPES.filter((species) => Math.abs(flow[species]) >= MIN_VISIBLE_AMOUNT);
  if (entries.length === 0) return "flow below measurement threshold";
  return entries
    .sort((left, right) => Math.abs(flow[right]) - Math.abs(flow[left]))
    .map(
      (species) => `${SPECIES_DEFINITIONS[species].formula} ${Math.abs(flow[species]).toFixed(2)}`
    )
    .join(" · ");
};

const liquidFlowSummary = (flow: LiquidAmounts): string => {
  const entries = LIQUID_TYPES.filter((species) => Math.abs(flow[species]) >= MIN_VISIBLE_AMOUNT);
  if (entries.length === 0) return "flow below measurement threshold";
  return entries
    .sort((left, right) => Math.abs(flow[right]) - Math.abs(flow[left]))
    .map(
      (species) => `${SPECIES_DEFINITIONS[species].formula} ${Math.abs(flow[species]).toFixed(2)}`
    )
    .join(" · ");
};

const dominantGasInLine = (gas: GasAmounts): string => {
  const total = gasAmountTotal(gas);
  if (total < 0.05) return "empty";
  const dominant = GAS_TYPES.reduce((best, type) => (gas[type] > gas[best] ? type : best));
  return `${GAS_LABELS[dominant]} ${Math.round((gas[dominant] / total) * 100)}%`;
};

const dominantLiquidInLine = (liquid: LiquidAmounts): string => {
  const total = liquidAmountTotal(liquid);
  if (total < 0.05) return "empty";
  const dominant = LIQUID_TYPES.reduce((best, type) => (liquid[type] > liquid[best] ? type : best));
  return `${LIQUID_LABELS[dominant]} ${Math.round((liquid[dominant] / total) * 100)}%`;
};

const flowReading = (flow: number): string => {
  if (Math.abs(flow) < MIN_VISIBLE_AMOUNT) return "0.00 mol-eq/s";
  return `${flow >= 0 ? "→" : "←"} ${Math.abs(flow).toFixed(2)} mol-eq/s`;
};

const actuatorLabels = (
  actuator: ActuatorKind,
  destinationKind: ConduitDestinationKind
): [string, string] => {
  if (destinationKind !== "room") return ["OPEN", "SEALED"];
  if (actuator === "fan" || actuator === "pump") return ["ON", "OFF"];
  return ["OPEN", "CLOSED"];
};

interface PhaseReadout {
  amount: number;
  junctionMixture: string;
  measuredSpecies: string;
  mixture: string;
  noun: string;
  physical: string;
}

const phaseReadout = (
  game: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  sourceRoomId: keyof GameState["rooms"]
): PhaseReadout => {
  if (phase === "gas") {
    return {
      amount: gasAmountTotal(game.gasConduits[runId].gas),
      junctionMixture: gasMixtureSummary(game.gasJunctions[sourceRoomId].gas),
      measuredSpecies: gasFlowSummary(game.gasConduits[runId].lastSpeciesFlow),
      mixture: gasMixtureSummary(game.gasConduits[runId].gas),
      noun: "duct",
      physical: `${Math.round(gasConduitPressure(game, runId))} kPa`,
    };
  }
  return {
    amount: liquidAmountTotal(game.liquidConduits[runId].liquid),
    junctionMixture: liquidMixtureSummary(game.liquidJunctions[sourceRoomId].liquid),
    measuredSpecies: liquidFlowSummary(game.liquidConduits[runId].lastSpeciesFlow),
    mixture: liquidMixtureSummary(game.liquidConduits[runId].liquid),
    noun: "pipe",
    physical: `${Math.round(liquidConduitFillRatio(game, runId) * 100)}% primed`,
  };
};

interface BinaryControlProps {
  active: boolean;
  activeLabel: string;
  disabled: boolean;
  inactiveLabel: string;
  onClick: () => void;
  testId: string;
  tutorialAnchor: TutorialAnchorId | null;
}

export const BinaryControl = ({
  active,
  activeLabel,
  disabled,
  inactiveLabel,
  onClick,
  testId,
  tutorialAnchor,
}: BinaryControlProps) => (
  <button
    className={`binary-control ${active ? "active" : "inactive"}`}
    type="button"
    disabled={disabled}
    data-testid={testId}
    data-tutorial-anchor={tutorialAnchor ?? undefined}
    aria-pressed={active}
    onClick={onClick}
  >
    <CirclePower size={14} /> {active ? activeLabel : inactiveLabel}
  </button>
);

export const ConduitActuator = ({
  phase,
  runId,
}: {
  phase: TransportPhase;
  runId: TransportRunId;
}) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = TRANSPORT_RUNS[runId][phase];
  const conduit = phase === "gas" ? game.gasConduits[runId] : game.liquidConduits[runId];
  const active = conduit.enabled;
  const command = { type: "set_conduit", runId, phase, enabled: !active } as const;
  const decision = evaluateCommand(game, command);
  const toggle = useCallback(
    () => dispatch({ type: "set_conduit", runId, phase, enabled: !active }),
    [active, dispatch, phase, runId]
  );
  if (!definition) return null;

  const [activeLabel, inactiveLabel] = actuatorLabels(
    definition.actuator,
    definition.destinationKind
  );
  const from = ROOM_DEFINITIONS[definition.direction[0]].code;
  const to = ROOM_DEFINITIONS[definition.direction[1]].code;
  const capacity = conduitCapacity(game, runId, phase);
  const readout = phaseReadout(game, runId, phase, definition.direction[0]);

  return (
    <div className={`actuator-row ${conduit.blocked ? "blocked" : ""}`}>
      <div className="actuator-copy">
        <strong>{transportCopy(runId, phase).name}</strong>
        <small>
          {from} → {to} · physical {readout.noun} · rated {definition.maxFlow.toFixed(2)}
        </small>
        <span>
          {flowReading(conduit.lastFlow)} · {readout.amount.toFixed(1)} / {capacity.toFixed(1)}{" "}
          mol-eq · {readout.physical} · {conduit.blocked ? "stalled" : conduit.flowCause}
        </span>
        <small>Conduit mixture: {readout.mixture}</small>
        <small>Upstream junction: {readout.junctionMixture}</small>
        <small>Measured flow: {readout.measuredSpecies}</small>
      </div>
      <BinaryControl
        active={active}
        activeLabel={activeLabel}
        disabled={!decision.allowed}
        inactiveLabel={inactiveLabel}
        testId={`conduit-control-${runId}-${phase}`}
        tutorialAnchor={conduitTutorialAnchor(runId, phase)}
        onClick={toggle}
      />
    </div>
  );
};

export const OutletBuffers = () => {
  const game = useGameStore((state) => state.game);
  const anode = game.gasBuffers.anode_header.gas;
  const cathode = game.gasBuffers.cathode_header.gas;
  const liquor = game.liquidBuffers.cell_liquor.liquid;
  const process = game.processes.chlor_alkali_cell;
  const entries = [
    {
      id: "anode",
      name: bufferCopy(GAS_BUFFERS.anode_header).name,
      amount: gasAmountTotal(anode),
      capacity: GAS_BUFFERS.anode_header.capacity,
      composition: dominantGasInLine(anode),
      contaminated: anode.hydrogen > 0.01,
    },
    {
      id: "cathode",
      name: bufferCopy(GAS_BUFFERS.cathode_header).name,
      amount: gasAmountTotal(cathode),
      capacity: GAS_BUFFERS.cathode_header.capacity,
      composition: dominantGasInLine(cathode),
      contaminated: cathode.chlorine > 0.01,
    },
    {
      id: "liquor",
      name: bufferCopy(LIQUID_BUFFERS.cell_liquor).name,
      amount: liquidAmountTotal(liquor),
      capacity: LIQUID_BUFFERS.cell_liquor.capacity,
      composition: dominantLiquidInLine(liquor),
      contaminated: false,
    },
  ];
  return (
    <div className="outlet-buffer-panel" data-tutorial-anchor={TUTORIAL_ANCHORS.lowerIntakeOutlets}>
      <div className="control-kind-heading">
        <Gauge size={14} /> Separated equipment outlets
      </div>
      <div className="outlet-buffer-grid">
        {entries.map((entry) => (
          <div className={entry.contaminated ? "contaminated" : ""} key={entry.id}>
            <span>{entry.name}</span>
            <strong>
              {entry.amount.toFixed(1)} / {entry.capacity}
            </strong>
            <small>{entry.contaminated ? "CROSS-CONTAMINATED" : entry.composition}</small>
          </div>
        ))}
      </div>
      <div className="equipment-process-readout">
        <span>{REACTION_DEFINITIONS.chlor_alkali_electrolysis.equation}</span>
        <strong>{process.lastRate.toFixed(2)} mol-eq/s</strong>
        <small>
          {process.powerDraw.toFixed(0)} kW-eq · limiting:{" "}
          {limitingFactorCopy(process.limitingFactor)}
        </small>
      </div>
    </div>
  );
};
