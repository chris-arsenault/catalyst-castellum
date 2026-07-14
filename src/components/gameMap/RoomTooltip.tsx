import {
  DEFAULT_GAME_DEFINITION,
  ROOM_DEFINITIONS,
  SPECIES_DEFINITIONS,
  roomVolume,
} from "../../game/config";
import { roomHazards, STANDARD_PRESSURE } from "../../game/queries";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GasAmounts,
  type GasZone,
  type GameState,
  type HazardChannels,
  type LiquidAmounts,
  type RoomId,
} from "../../game/types";
import {
  DAMAGE_CHANNELS,
  damageChannelStyle,
  type DamageChannel,
} from "../../presentation/damageCopy";
import { activeRoomGasPortals, roomGasInflow } from "../../presentation/roomFlow";
import { roomAnalysis } from "../../presentation/selectors";

const percentage = (value: number): string => {
  if (value >= 10) return `${Math.round(value)}%`;
  if (value >= 1) return `${value.toFixed(1)}%`;
  return `${value.toFixed(2)}%`;
};

const amount = (value: number): string =>
  value >= 10 ? Math.round(value).toString() : value.toFixed(1);

const GasComposition = ({
  gas,
  zone,
  temperature,
}: {
  gas: GasAmounts;
  zone: GasZone;
  temperature: number;
}) => {
  const total = GAS_TYPES.reduce((sum, species) => sum + gas[species], 0);
  const present = GAS_TYPES.filter((species) => gas[species] > 0.001).sort(
    (left, right) => gas[right] - gas[left]
  );
  return (
    <section className="room-composition">
      <div className="room-composition-heading">
        <strong>{zone === "upper" ? "Upper gas" : "Lower gas"}</strong>
        <span>
          {amount(total)} mol-eq · {Math.round(temperature)} °C
        </span>
      </div>
      <div className="room-species-list">
        {present.length > 0 ? (
          present.map((species) => {
            const definition = SPECIES_DEFINITIONS[species];
            return (
              <span key={species} style={{ "--species": definition.color } as React.CSSProperties}>
                <b>{definition.formula}</b>
                <em>{percentage((gas[species] / total) * 100)}</em>
              </span>
            );
          })
        ) : (
          <small>Empty layer</small>
        )}
      </div>
    </section>
  );
};

const hazardEntries = (hazards: HazardChannels): [DamageChannel, number][] =>
  DAMAGE_CHANNELS.flatMap((channel) =>
    hazards[channel] > 0.01 ? [[channel, hazards[channel]]] : []
  );

const Exposure = ({ hazards, label }: { hazards: HazardChannels; label: string }) => {
  const entries = hazardEntries(hazards);
  if (entries.length === 0) return null;
  return (
    <div className="room-exposure-row">
      <strong>{label}</strong>
      <span>
        {entries.map(([channel, rate]) => (
          <em key={channel} style={{ color: damageChannelStyle[channel].color }}>
            {damageChannelStyle[channel].label} {rate.toFixed(1)}/s
          </em>
        ))}
      </span>
    </div>
  );
};

const liquidSummary = (liquid: LiquidAmounts, total: number): string => {
  if (total <= 0.001) return "empty";
  return LIQUID_TYPES.filter((species) => liquid[species] > 0.001)
    .sort((left, right) => liquid[right] - liquid[left])
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${percentage((liquid[species] / total) * 100)}`
    )
    .join(" · ");
};

export const RoomTooltip = ({ game, roomId }: { game: GameState; roomId: RoomId | null }) => {
  if (!roomId) return null;
  const definition = ROOM_DEFINITIONS[roomId];
  const room = game.rooms[roomId];
  const analysis = roomAnalysis(room);
  const liquidFill = Math.min(1, analysis.liquidTotal / roomVolume(roomId));
  const gasInflow = roomGasInflow(game, roomId);
  const openGasPortals = activeRoomGasPortals(game, roomId);
  const lowerHazards = roomHazards(room, true, true, "lower");
  const upperHazards = roomHazards(room, false, true, "upper");
  const pressureThreshold =
    STANDARD_PRESSURE * DEFAULT_GAME_DEFINITION.environmentHazards.staticPressure.ratioThreshold;
  const passageLabel = openGasPortals.length === 1 ? "passage" : "passages";
  const pressureExplanation =
    openGasPortals.length > 0
      ? `${openGasPortals.length} open ${passageLabel} connect to enclosed rooms and equalize gas at finite flow rates.`
      : "Gas inventory and temperature set the chamber’s static pressure.";
  return (
    <aside className="room-map-tooltip room-detail-tooltip" data-testid="room-map-tooltip">
      <header>
        <span>{definition.code}</span>
        <strong>{definition.name}</strong>
        <em className={`hazard-${analysis.hazardLabel.toLowerCase()}`}>{analysis.hazardLabel}</em>
      </header>
      <GasComposition gas={room.gas.upper} zone="upper" temperature={room.gasTemperature.upper} />
      <GasComposition gas={room.gas.lower} zone="lower" temperature={room.gasTemperature.lower} />
      <dl className="room-detail-readout">
        <div>
          <dt>Static pressure</dt>
          <dd>{analysis.staticPressure.toFixed(1)} kPa</dd>
        </div>
        <div>
          <dt>OX-1 pulse</dt>
          <dd>+{analysis.pressurePulse.toFixed(1)} kPa</dd>
        </div>
        <div>
          <dt>Liquid</dt>
          <dd>
            {Math.round(liquidFill * 100)}% full ·{" "}
            {liquidSummary(room.liquid, analysis.liquidTotal)}
          </dd>
        </div>
        {gasInflow.rate > 0.002 && (
          <div>
            <dt>Powered feed</dt>
            <dd>+{gasInflow.rate.toFixed(1)} mol-eq/s</dd>
          </div>
        )}
      </dl>
      <div className="room-pressure-explanation">{pressureExplanation}</div>
      <div className="room-exposure-detail">
        <Exposure label="Upper exposure" hazards={upperHazards} />
        <Exposure label="Lower exposure" hazards={lowerHazards} />
        <small>
          Thermal exposure begins above{" "}
          {DEFAULT_GAME_DEFINITION.environmentHazards.gasTemperature.threshold} °C. Static pressure
          exposure begins above {Math.round(pressureThreshold)} kPa.
        </small>
      </div>
      <small>Click to select {definition.code}</small>
    </aside>
  );
};
