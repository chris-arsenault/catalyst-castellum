import { CirclePower, Gauge } from "lucide-react";
import {
  GAS_BUFFERS,
  LIQUID_BUFFERS,
  REACTION_DEFINITIONS,
  SPECIES_DEFINITIONS,
} from "../../presentation/defaultGame";
import {
  conduitCapacity,
  gasAmountTotal,
  gasConduitPressure,
  liquidAmountTotal,
  liquidConduitFillRatio,
} from "../../game/queries";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import type { LocaleFormatters } from "../../localization/formatters";
import type { Translator } from "../../localization/translator";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type ActuatorKind,
  type ConduitDestinationKind,
  type GameState,
  type FlowCause,
  type GasAmounts,
  type LiquidAmounts,
  type TransportPhase,
  type TransportRunId,
} from "../../game/types";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "../../tutorial/anchors";
import { bufferCopy, speciesCopy, transportCopy } from "../../presentation/entityCopy";
import { roomDefinition } from "../../presentation/defaultGame";
import {
  gasConduitState,
  gasJunctionState,
  liquidConduitState,
  liquidJunctionState,
} from "../../game/world/instances";
import { lineDefinition } from "../../presentation/defaultGame";
import type { ProcessLineView } from "../../game/world/instances";

const MIN_VISIBLE_AMOUNT = 0.005;

const CONDUIT_TUTORIAL_ANCHORS: Partial<
  Record<`${TransportRunId}:${TransportPhase}`, TutorialAnchorId>
> = {
  "cell_furnace:gas": TUTORIAL_ANCHORS.conduitCellFurnaceGas,
  "core_cell:gas": TUTORIAL_ANCHORS.conduitCoreCellGas,
  "core_cell:liquid": TUTORIAL_ANCHORS.conduitCoreCellLiquid,
  "core_furnace:gas": TUTORIAL_ANCHORS.conduitCoreFurnaceGas,
  "core_gallery:gas": TUTORIAL_ANCHORS.conduitCoreGalleryGas,
  "furnace_return:gas": TUTORIAL_ANCHORS.conduitFurnaceReturnGas,
  "return_final:gas": TUTORIAL_ANCHORS.conduitReturnFinalGas,
};

export const conduitTutorialAnchor = (
  runId: TransportRunId,
  phase: TransportPhase
): TutorialAnchorId | null => CONDUIT_TUTORIAL_ANCHORS[`${runId}:${phase}`] ?? null;

const gasMixtureSummary = (
  gas: GasAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const total = gasAmountTotal(gas);
  if (total < MIN_VISIBLE_AMOUNT) return translator.text("ui.process.empty");
  return GAS_TYPES.filter((species) => gas[species] >= MIN_VISIBLE_AMOUNT)
    .sort((left, right) => gas[right] - gas[left])
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${formatters.percent(gas[species] / total, 0)}`
    )
    .join(" · ");
};

const liquidMixtureSummary = (
  liquid: LiquidAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const total = liquidAmountTotal(liquid);
  if (total < MIN_VISIBLE_AMOUNT) return translator.text("ui.process.empty");
  return LIQUID_TYPES.filter((species) => liquid[species] >= MIN_VISIBLE_AMOUNT)
    .sort((left, right) => liquid[right] - liquid[left])
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${formatters.percent(liquid[species] / total, 0)}`
    )
    .join(" · ");
};

const gasFlowSummary = (
  flow: GasAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const entries = GAS_TYPES.filter((species) => Math.abs(flow[species]) >= MIN_VISIBLE_AMOUNT);
  if (entries.length === 0) return translator.text("ui.process.flowThreshold");
  return entries
    .sort((left, right) => Math.abs(flow[right]) - Math.abs(flow[left]))
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${formatters.number(Math.abs(flow[species]), 2)}`
    )
    .join(" · ");
};

const liquidFlowSummary = (
  flow: LiquidAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const entries = LIQUID_TYPES.filter((species) => Math.abs(flow[species]) >= MIN_VISIBLE_AMOUNT);
  if (entries.length === 0) return translator.text("ui.process.flowThreshold");
  return entries
    .sort((left, right) => Math.abs(flow[right]) - Math.abs(flow[left]))
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${formatters.number(Math.abs(flow[species]), 2)}`
    )
    .join(" · ");
};

const dominantGasInLine = (
  gas: GasAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const total = gasAmountTotal(gas);
  if (total < 0.05) return translator.text("ui.process.empty");
  const dominant = GAS_TYPES.reduce((best, type) => (gas[type] > gas[best] ? type : best));
  return `${speciesCopy(SPECIES_DEFINITIONS[dominant], translator).name} ${formatters.percent(gas[dominant] / total, 0)}`;
};

const dominantLiquidInLine = (
  liquid: LiquidAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const total = liquidAmountTotal(liquid);
  if (total < 0.05) return translator.text("ui.process.empty");
  const dominant = LIQUID_TYPES.reduce((best, type) => (liquid[type] > liquid[best] ? type : best));
  return `${speciesCopy(SPECIES_DEFINITIONS[dominant], translator).name} ${formatters.percent(liquid[dominant] / total, 0)}`;
};

const flowReading = (flow: number, formatters: LocaleFormatters): string => {
  if (Math.abs(flow) < MIN_VISIBLE_AMOUNT) return formatters.measurement(0, "mol-eq/s", 2);
  return `${flow >= 0 ? "→" : "←"} ${formatters.measurement(Math.abs(flow), "mol-eq/s", 2)}`;
};

const actuatorLabels = (
  actuator: ActuatorKind,
  destinationKind: ConduitDestinationKind,
  translator: Translator
): [string, string] => {
  if (destinationKind !== "room")
    return [translator.text("ui.process.open"), translator.text("ui.process.sealed")];
  if (actuator === "fan" || actuator === "pump")
    return [translator.text("ui.process.on"), translator.text("ui.process.off")];
  return [translator.text("ui.process.open"), translator.text("ui.process.closed")];
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
  sourceRoomId: keyof GameState["rooms"],
  translator: Translator,
  formatters: LocaleFormatters
): PhaseReadout => {
  if (phase === "gas") {
    return {
      amount: gasAmountTotal(gasConduitState(game, runId).gas),
      junctionMixture: gasMixtureSummary(
        gasJunctionState(game, sourceRoomId).gas,
        translator,
        formatters
      ),
      measuredSpecies: gasFlowSummary(
        gasConduitState(game, runId).lastSpeciesFlow,
        translator,
        formatters
      ),
      mixture: gasMixtureSummary(gasConduitState(game, runId).gas, translator, formatters),
      noun: translator.text("ui.process.duct"),
      physical: formatters.measurement(gasConduitPressure(game, runId), "kPa", 0),
    };
  }
  return {
    amount: liquidAmountTotal(liquidConduitState(game, runId).liquid),
    junctionMixture: liquidMixtureSummary(
      liquidJunctionState(game, sourceRoomId).liquid,
      translator,
      formatters
    ),
    measuredSpecies: liquidFlowSummary(
      liquidConduitState(game, runId).lastSpeciesFlow,
      translator,
      formatters
    ),
    mixture: liquidMixtureSummary(liquidConduitState(game, runId).liquid, translator, formatters),
    noun: translator.text("ui.process.pipe"),
    physical: translator.text("ui.process.primed", {
      percent: formatters.number(liquidConduitFillRatio(game, runId) * 100, 0),
    }),
  };
};

const flowCauseLabel = (cause: FlowCause, translator: Translator): string => {
  const keys = {
    idle: "ui.process.cause.idle",
    priming: "ui.process.cause.priming",
    pressure: "ui.process.cause.pressure",
    buoyancy: "ui.process.cause.buoyancy",
    fan: "ui.process.cause.fan",
    gravity: "ui.process.cause.gravity",
    siphon: "ui.process.cause.siphon",
    pump: "ui.process.cause.pump",
    backpressure: "ui.process.cause.backpressure",
  } as const;
  return translator.text(keys[cause]);
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
  const definition = lineDefinition(runId, phase);
  if (!definition) return null;
  return <InstalledConduitActuator definition={definition} phase={phase} runId={runId} />;
};

const InstalledConduitActuator = ({
  definition,
  phase,
  runId,
}: {
  definition: ProcessLineView;
  phase: TransportPhase;
  runId: TransportRunId;
}) => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const conduit = phase === "gas" ? gasConduitState(game, runId) : liquidConduitState(game, runId);
  const active = conduit.enabled;
  const command = { type: "set_conduit", runId, phase, enabled: !active } as const;
  const decision = selectors.commandDecision(game, command);
  const toggle = () => dispatch({ type: "set_conduit", runId, phase, enabled: !active });

  const [activeLabel, inactiveLabel] = actuatorLabels(
    definition.actuator,
    definition.destinationKind,
    translator
  );
  const from = roomDefinition(definition.direction[0]).code;
  const to = roomDefinition(definition.direction[1]).code;
  const capacity = conduitCapacity(game, runId, phase);
  const readout = phaseReadout(game, runId, phase, definition.direction[0], translator, formatters);

  return (
    <div className={`actuator-row ${conduit.blocked ? "blocked" : ""}`}>
      <div className="actuator-copy">
        <strong>{transportCopy(runId, phase, translator).name}</strong>
        <small>
          {translator.text("ui.process.conduitSummary", {
            from,
            to,
            noun: readout.noun,
            rate: formatters.measurement(definition.maxFlow, "mol-eq/s", 2),
          })}
        </small>
        <span>
          {translator.text("ui.process.conduitReading", {
            flow: flowReading(conduit.lastFlow, formatters),
            amount: formatters.number(readout.amount, 1),
            capacity: formatters.number(capacity, 1),
            physical: readout.physical,
            state: conduit.blocked
              ? translator.text("ui.process.stalled")
              : flowCauseLabel(conduit.flowCause, translator),
          })}
        </span>
        <small>{translator.text("ui.process.conduitMixture", { mixture: readout.mixture })}</small>
        <small>
          {translator.text("ui.process.upstreamJunction", { mixture: readout.junctionMixture })}
        </small>
        <small>
          {translator.text("ui.process.measuredFlow", { flow: readout.measuredSpecies })}
        </small>
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
  const { formatters, limitingFactorCopy: factorCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const anode = game.gasBuffers.anode_header.gas;
  const cathode = game.gasBuffers.cathode_header.gas;
  const liquor = game.liquidBuffers.cell_liquor.liquid;
  const process = game.processes.chlor_alkali_cell;
  const entries = [
    {
      id: "anode",
      name: bufferCopy(GAS_BUFFERS.anode_header, translator).name,
      amount: gasAmountTotal(anode),
      capacity: GAS_BUFFERS.anode_header.capacity,
      composition: dominantGasInLine(anode, translator, formatters),
      contaminated: anode.hydrogen > 0.01,
    },
    {
      id: "cathode",
      name: bufferCopy(GAS_BUFFERS.cathode_header, translator).name,
      amount: gasAmountTotal(cathode),
      capacity: GAS_BUFFERS.cathode_header.capacity,
      composition: dominantGasInLine(cathode, translator, formatters),
      contaminated: cathode.chlorine > 0.01,
    },
    {
      id: "liquor",
      name: bufferCopy(LIQUID_BUFFERS.cell_liquor, translator).name,
      amount: liquidAmountTotal(liquor),
      capacity: LIQUID_BUFFERS.cell_liquor.capacity,
      composition: dominantLiquidInLine(liquor, translator, formatters),
      contaminated: false,
    },
  ];
  return (
    <div className="outlet-buffer-panel" data-tutorial-anchor={TUTORIAL_ANCHORS.lowerIntakeOutlets}>
      <div className="control-kind-heading">
        <Gauge size={14} /> {translator.text("ui.process.outlets")}
      </div>
      <div className="outlet-buffer-grid">
        {entries.map((entry) => (
          <div className={entry.contaminated ? "contaminated" : ""} key={entry.id}>
            <span>{entry.name}</span>
            <strong>
              {formatters.number(entry.amount, 1)} / {formatters.number(entry.capacity, 1)}
            </strong>
            <small>
              {entry.contaminated ? translator.text("ui.process.contaminated") : entry.composition}
            </small>
          </div>
        ))}
      </div>
      <div className="equipment-process-readout">
        <span>{REACTION_DEFINITIONS.chlor_alkali_electrolysis.equation}</span>
        <strong>{formatters.measurement(process.lastRate, "mol-eq/s", 2)}</strong>
        <small>
          {translator.text("ui.process.limiting", {
            power: formatters.number(process.powerDraw, 0),
            factor: factorCopy(process.limitingFactor),
          })}
        </small>
      </div>
    </div>
  );
};
