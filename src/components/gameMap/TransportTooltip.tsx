import { SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import {
  conduitCapacity,
  gasAmountTotal,
  liquidAmountTotal,
  transportPhaseAvailable,
  transportRunChannels,
  type TransportChannelTelemetry,
} from "../../game/queries";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type FlowCause,
  type GasConduitState,
  type LiquidConduitState,
  type SpeciesId,
  type TransportPhase,
  type ConnectionId,
} from "../../game/types";
import { transportCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import type { LocaleFormatters } from "../../localization/formatters";
import type { Translator } from "../../localization/translator";
import { gasConduitState, liquidConduitState } from "../../game/world/instances";
import { connectionRoomPair, lineDefinition, roomDefinition } from "../../presentation/defaultGame";

const FLOW_EPSILON = 0.005;

const rateLabel = (rate: number, formatters: LocaleFormatters): string =>
  formatters.measurement(rate >= FLOW_EPSILON ? rate : 0, "mol-eq/s", 2);

const flowSpeciesSummary = (
  channel: TransportChannelTelemetry | null,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  if (!channel || channel.speciesRates.length === 0)
    return translator.text("ui.map.transport.flowThreshold");
  return channel.speciesRates
    .map(
      ({ species, rate }) => `${SPECIES_DEFINITIONS[species].formula} ${formatters.number(rate, 2)}`
    )
    .join(" · ");
};

const phaseConduit = (
  game: GameState,
  runId: ConnectionId,
  phase: TransportPhase
): GasConduitState | LiquidConduitState =>
  phase === "gas" ? gasConduitState(game, runId) : liquidConduitState(game, runId);

const phaseAmount = (game: GameState, runId: ConnectionId, phase: TransportPhase): number => {
  if (phase === "gas") return gasAmountTotal(gasConduitState(game, runId).gas);
  return liquidAmountTotal(liquidConduitState(game, runId).liquid);
};

const phaseName = (phase: TransportPhase, translator: Translator): string =>
  translator.text(phase === "gas" ? "ui.process.gasDuct" : "ui.process.liquidPipe");

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
  return translator.text(keys[cause]).toLocaleUpperCase(translator.locale);
};

const conduitStateLabel = (
  conduit: GasConduitState | LiquidConduitState,
  translator: Translator
): string => {
  if (!conduit.installed) return translator.text("ui.process.buildReady");
  if (conduit.blocked) return translator.text("ui.map.transport.state.stalled");
  if (!conduit.enabled) return translator.text("ui.map.transport.state.off");
  return flowCauseLabel(conduit.flowCause, translator);
};

const conduitMixtureSummary = (
  game: GameState,
  runId: ConnectionId,
  phase: TransportPhase,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  if (phase === "gas") {
    const gas = gasConduitState(game, runId).gas;
    const entries = GAS_TYPES.filter((species) => gas[species] >= FLOW_EPSILON);
    return entries.length > 0
      ? entries
          .sort((left, right) => gas[right] - gas[left])
          .map(
            (species) =>
              `${SPECIES_DEFINITIONS[species].formula} ${formatters.number(gas[species], 1)}`
          )
          .join(" · ")
      : translator.text("ui.map.transport.empty");
  }
  const liquid = liquidConduitState(game, runId).liquid;
  const entries = LIQUID_TYPES.filter((species) => liquid[species] >= FLOW_EPSILON);
  return entries.length > 0
    ? entries
        .sort((left, right) => liquid[right] - liquid[left])
        .map(
          (species) =>
            `${SPECIES_DEFINITIONS[species].formula} ${formatters.number(liquid[species], 1)}`
        )
        .join(" · ")
    : translator.text("ui.map.transport.empty");
};

const PhaseSection = ({
  channel,
  game,
  phase,
  runId,
}: {
  channel: TransportChannelTelemetry | null;
  game: GameState;
  phase: TransportPhase;
  runId: ConnectionId;
}) => {
  const { formatters, translator } = useGamePresentation();
  const definition = lineDefinition(game, runId, phase);
  if (!definition || !transportPhaseAvailable(game, runId, phase)) return null;
  const conduit = phaseConduit(game, runId, phase);
  const amount = phaseAmount(game, runId, phase);
  const capacity = conduitCapacity(game, runId, phase);
  const fill = capacity > 0 ? amount / capacity : 0;
  return (
    <section className={`transport-phase transport-phase-${phase}`}>
      <header>
        <span>{phaseName(phase, translator)}</span>
        <small>
          {translator.text("ui.map.transport.physical", {
            state: conduitStateLabel(conduit, translator),
          })}
        </small>
      </header>
      <div className={`transport-channel ${conduit.blocked ? "blocked" : ""}`}>
        <div>
          <strong>{transportCopy(game, runId, translator).name}</strong>
          <small>
            {roomDefinition(definition.direction[0]).code} →{" "}
            {roomDefinition(definition.direction[1]).code} ·{" "}
            {translator.text(
              (
                {
                  fan: "ui.map.transport.actuator.fan",
                  pump: "ui.map.transport.actuator.pump",
                  passive: "ui.map.transport.actuator.passive",
                } as const
              )[definition.actuator]
            )}
          </small>
        </div>
        <div>
          <b>{rateLabel(channel?.rate ?? 0, formatters)}</b>
          <small>
            {translator.text("ui.map.transport.retained", {
              amount: formatters.number(amount, 1),
              capacity: formatters.number(capacity, 1),
              percent: formatters.percent(fill, 0),
            })}
          </small>
        </div>
      </div>
      <div className="transport-channel">
        <div>
          <strong>{translator.text("ui.map.transport.mixture")}</strong>
          <small>{conduitMixtureSummary(game, runId, phase, translator, formatters)}</small>
        </div>
        <div>
          <b>{translator.text("ui.map.transport.measured")}</b>
          <small>{flowSpeciesSummary(channel, translator, formatters)}</small>
        </div>
      </div>
    </section>
  );
};

interface TransportTooltipProps {
  game: GameState;
  runId: ConnectionId | null;
  selectedSpecies: SpeciesId | null;
}

export const TransportTooltip = ({ game, runId, selectedSpecies }: TransportTooltipProps) => {
  const { translator } = useGamePresentation();
  if (!runId) return null;
  const channels = transportRunChannels(game, runId);
  const [fromRoom, toRoom] = connectionRoomPair(game, runId);
  return (
    <aside className="transport-tooltip" data-testid="transport-tooltip">
      <header>
        <div>
          <span>{translator.text("ui.map.transport.title")}</span>
          <strong>
            {roomDefinition(fromRoom).code} ⇄ {roomDefinition(toRoom).code}
          </strong>
        </div>
        {selectedSpecies && (
          <em style={{ color: SPECIES_DEFINITIONS[selectedSpecies].color }}>
            {translator.text("ui.map.transport.overlay", {
              formula: SPECIES_DEFINITIONS[selectedSpecies].formula,
            })}
          </em>
        )}
      </header>
      <PhaseSection
        channel={channels.find((channel) => channel.phase === "gas") ?? null}
        game={game}
        phase="gas"
        runId={runId}
      />
      <PhaseSection
        channel={channels.find((channel) => channel.phase === "liquid") ?? null}
        game={game}
        phase="liquid"
        runId={runId}
      />
      <footer>{translator.text("ui.map.transport.footer")}</footer>
    </aside>
  );
};
