import {
  ROOM_DEFINITIONS,
  SPECIES_DEFINITIONS,
  TRANSPORT_RUNS,
} from "../../presentation/defaultGame";
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
  type GasConduitState,
  type LiquidConduitState,
  type SpeciesId,
  type TransportPhase,
  type TransportRunId,
} from "../../game/types";
import { transportCopy } from "../../presentation/entityCopy";

const FLOW_EPSILON = 0.005;

const rateLabel = (rate: number): string =>
  rate >= FLOW_EPSILON ? `${rate.toFixed(2)} mol-eq/s` : "0.00 mol-eq/s";

const flowSpeciesSummary = (channel: TransportChannelTelemetry | null): string => {
  if (!channel || channel.speciesRates.length === 0) return "Flow below measurement threshold";
  return channel.speciesRates
    .map(({ species, rate }) => `${SPECIES_DEFINITIONS[species].formula} ${rate.toFixed(2)}`)
    .join(" · ");
};

const phaseConduit = (
  game: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): GasConduitState | LiquidConduitState =>
  phase === "gas" ? game.gasConduits[runId] : game.liquidConduits[runId];

const phaseAmount = (game: GameState, runId: TransportRunId, phase: TransportPhase): number => {
  if (phase === "gas") return gasAmountTotal(game.gasConduits[runId].gas);
  return liquidAmountTotal(game.liquidConduits[runId].liquid);
};

const phaseName = (phase: TransportPhase): string => (phase === "gas" ? "Gas duct" : "Liquid pipe");

const conduitStateLabel = (conduit: GasConduitState | LiquidConduitState): string => {
  if (!conduit.installed) return "BUILD READY";
  if (conduit.blocked) return "STALLED";
  if (!conduit.enabled) return "OFF";
  return conduit.flowCause.toUpperCase();
};

const conduitMixtureSummary = (
  game: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): string => {
  if (phase === "gas") {
    const gas = game.gasConduits[runId].gas;
    const entries = GAS_TYPES.filter((species) => gas[species] >= FLOW_EPSILON);
    return entries.length > 0
      ? entries
          .sort((left, right) => gas[right] - gas[left])
          .map((species) => `${SPECIES_DEFINITIONS[species].formula} ${gas[species].toFixed(1)}`)
          .join(" · ")
      : "Empty";
  }
  const liquid = game.liquidConduits[runId].liquid;
  const entries = LIQUID_TYPES.filter((species) => liquid[species] >= FLOW_EPSILON);
  return entries.length > 0
    ? entries
        .sort((left, right) => liquid[right] - liquid[left])
        .map((species) => `${SPECIES_DEFINITIONS[species].formula} ${liquid[species].toFixed(1)}`)
        .join(" · ")
    : "Empty";
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
  runId: TransportRunId;
}) => {
  const definition = TRANSPORT_RUNS[runId][phase];
  if (!definition || !transportPhaseAvailable(game, runId, phase)) return null;
  const conduit = phaseConduit(game, runId, phase);
  const amount = phaseAmount(game, runId, phase);
  const capacity = conduitCapacity(game, runId, phase);
  const fill = capacity > 0 ? amount / capacity : 0;
  return (
    <section className={`transport-phase transport-phase-${phase}`}>
      <header>
        <span>{phaseName(phase)}</span>
        <small>PHYSICAL CONDUIT · {conduitStateLabel(conduit)}</small>
      </header>
      <div className={`transport-channel ${conduit.blocked ? "blocked" : ""}`}>
        <div>
          <strong>{transportCopy(runId, phase).name}</strong>
          <small>
            {ROOM_DEFINITIONS[definition.direction[0]].code} →{" "}
            {ROOM_DEFINITIONS[definition.direction[1]].code} · {definition.actuator}
          </small>
        </div>
        <div>
          <b>{rateLabel(channel?.rate ?? 0)}</b>
          <small>
            {amount.toFixed(1)} / {capacity.toFixed(1)} retained · {Math.round(fill * 100)}% full
          </small>
        </div>
      </div>
      <div className="transport-channel">
        <div>
          <strong>Conserved mixture</strong>
          <small>{conduitMixtureSummary(game, runId, phase)}</small>
        </div>
        <div>
          <b>Measured flow</b>
          <small>{flowSpeciesSummary(channel)}</small>
        </div>
      </div>
    </section>
  );
};

interface TransportTooltipProps {
  game: GameState;
  runId: TransportRunId | null;
  selectedSpecies: SpeciesId | null;
}

export const TransportTooltip = ({ game, runId, selectedSpecies }: TransportTooltipProps) => {
  if (!runId) return null;
  const run = TRANSPORT_RUNS[runId];
  const channels = transportRunChannels(game, runId);
  const [fromRoom, toRoom] = run.rooms;
  return (
    <aside className="transport-tooltip" data-testid="transport-tooltip">
      <header>
        <div>
          <span>Physical transport</span>
          <strong>
            {ROOM_DEFINITIONS[fromRoom].code} ⇄ {ROOM_DEFINITIONS[toRoom].code}
          </strong>
        </div>
        {selectedSpecies && (
          <em style={{ color: SPECIES_DEFINITIONS[selectedSpecies].color }}>
            {SPECIES_DEFINITIONS[selectedSpecies].formula} overlay
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
      <footer>Every listed species shares this conduit’s capacity and actuator.</footer>
    </aside>
  );
};
