import { facilityModelForMap } from "../../game/world/derivedModel";
import { DEFAULT_GAME_DEFINITION, SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
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
  type RoomState,
} from "../../game/types";
import { DAMAGE_CHANNELS, type DamageChannel } from "../../presentation/damageCopy";
import {
  activeRoomGasPortals,
  roomGasInflow,
  type RoomGasInflow,
} from "../../presentation/roomFlow";
import { roomCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import type { LocaleFormatters } from "../../localization/formatters";
import type { Translator } from "../../localization/translator";
import type { HazardLabel } from "../../presentation/roomCopy";
import type { RoomViewModel } from "../../presentation/selectors";
import { roomState } from "../../game/world/instances";
import { roomDefinition } from "../../presentation/defaultGame";

const percentage = (value: number, formatters: LocaleFormatters): string => {
  if (value >= 10) return `${formatters.number(value, 0)}%`;
  if (value >= 1) return `${formatters.number(value, 1)}%`;
  return `${formatters.number(value, 2)}%`;
};

const hazardText = (hazard: HazardLabel, translator: Translator): string => {
  const keys = {
    CLEAR: "ui.room.hazard.clear",
    LOW: "ui.room.hazard.low",
    HOSTILE: "ui.room.hazard.hostile",
    LETHAL: "ui.room.hazard.lethal",
  } as const;
  return translator.text(keys[hazard]);
};

const GasComposition = ({
  gas,
  zone,
  temperature,
}: {
  gas: GasAmounts;
  zone: GasZone;
  temperature: number;
}) => {
  const { formatters, translator } = useGamePresentation();
  const total = GAS_TYPES.reduce((sum, species) => sum + gas[species], 0);
  const present = GAS_TYPES.filter((species) => gas[species] > 0.001).sort(
    (left, right) => gas[right] - gas[left]
  );
  return (
    <section className="room-composition">
      <div className="room-composition-heading">
        <strong>
          {translator.text(zone === "upper" ? "ui.map.room.upperGas" : "ui.map.room.lowerGas")}
        </strong>
        <span>
          {translator.text("ui.map.room.layerSummary", {
            amount: formatters.measurement(total, "mol-eq", 1),
            temperature: formatters.measurement(temperature, "°C", 0),
          })}
        </span>
      </div>
      <div className="room-species-list">
        {present.length > 0 ? (
          present.map((species) => {
            const definition = SPECIES_DEFINITIONS[species];
            return (
              <span key={species} style={{ "--species": definition.color } as React.CSSProperties}>
                <b>{definition.formula}</b>
                <em>{percentage((gas[species] / total) * 100, formatters)}</em>
              </span>
            );
          })
        ) : (
          <small>{translator.text("ui.map.room.emptyLayer")}</small>
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
  const { damage, formatters } = useGamePresentation();
  const entries = hazardEntries(hazards);
  if (entries.length === 0) return null;
  return (
    <div className="room-exposure-row">
      <strong>{label}</strong>
      <span>
        {entries.map(([channel, rate]) => (
          <em key={channel} style={{ color: damage.channelStyle[channel].color }}>
            {damage.channelStyle[channel].label} {formatters.number(rate, 1)}/s
          </em>
        ))}
      </span>
    </div>
  );
};

const liquidSummary = (
  liquid: LiquidAmounts,
  total: number,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  if (total <= 0.001) return translator.text("ui.map.room.empty");
  return LIQUID_TYPES.filter((species) => liquid[species] > 0.001)
    .sort((left, right) => liquid[right] - liquid[left])
    .map(
      (species) =>
        `${SPECIES_DEFINITIONS[species].formula} ${percentage(
          (liquid[species] / total) * 100,
          formatters
        )}`
    )
    .join(" · ");
};

const RoomReadout = ({
  analysis,
  gasInflow,
  room,
  roomId,
  volume,
}: {
  analysis: RoomViewModel;
  gasInflow: RoomGasInflow;
  room: RoomState;
  roomId: RoomId;
  volume: number;
}) => {
  const { formatters, translator } = useGamePresentation();
  const liquidFill = Math.min(1, analysis.liquidTotal / volume);
  return (
    <dl className="room-detail-readout">
      <div>
        <dt>{translator.text("ui.map.room.pressure")}</dt>
        <dd>{formatters.measurement(analysis.staticPressure, "kPa", 1)}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.map.room.pulse")}</dt>
        <dd>+{formatters.measurement(analysis.pressurePulse, "kPa", 1)}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.map.room.liquid")}</dt>
        <dd>
          {translator.text("ui.map.room.liquidSummary", {
            percent: formatters.percent(liquidFill, 0),
            mixture: liquidSummary(room.liquid, analysis.liquidTotal, translator, formatters),
          })}
        </dd>
      </div>
      {gasInflow.rate > 0.002 && (
        <div>
          <dt>{translator.text("ui.map.room.feed")}</dt>
          <dd>+{formatters.measurement(gasInflow.rate, "mol-eq/s", 1)}</dd>
        </div>
      )}
    </dl>
  );
};

const RoomExposure = ({
  lowerHazards,
  upperHazards,
}: {
  lowerHazards: HazardChannels;
  upperHazards: HazardChannels;
}) => {
  const { formatters, translator } = useGamePresentation();
  const pressureThreshold =
    STANDARD_PRESSURE * DEFAULT_GAME_DEFINITION.environmentHazards.staticPressure.ratioThreshold;
  return (
    <div className="room-exposure-detail">
      <Exposure label={translator.text("ui.map.room.upperExposure")} hazards={upperHazards} />
      <Exposure label={translator.text("ui.map.room.lowerExposure")} hazards={lowerHazards} />
      <small>
        {translator.text("ui.map.room.thresholds", {
          temperature: formatters.measurement(
            DEFAULT_GAME_DEFINITION.environmentHazards.gasTemperature.threshold,
            "°C",
            0
          ),
          pressure: formatters.measurement(pressureThreshold, "kPa", 0),
        })}
      </small>
    </div>
  );
};

export const RoomTooltip = ({ game, roomId }: { game: GameState; roomId: RoomId | null }) => {
  const { selectors, translator } = useGamePresentation();
  if (!roomId) return null;
  const definition = roomDefinition(game, roomId);
  const room = roomState(game, roomId);
  const analysis = selectors.roomAnalysis(room);
  const gasInflow = roomGasInflow(game, roomId);
  const openGasPortals = activeRoomGasPortals(game, roomId);
  const lowerHazards = roomHazards(room, true, true, "lower");
  const upperHazards = roomHazards(room, false, true, "upper");
  const passageLabel = translator.text(
    openGasPortals.length === 1 ? "ui.map.room.passage.one" : "ui.map.room.passage.other"
  );
  const pressureExplanation =
    openGasPortals.length > 0
      ? translator.text("ui.map.room.passages", {
          count: openGasPortals.length,
          passages: passageLabel,
        })
      : translator.text("ui.map.room.pressureExplanation");
  return (
    <aside className="room-map-tooltip room-detail-tooltip" data-testid="room-map-tooltip">
      <header>
        <span>{definition.code}</span>
        <strong>{roomCopy(definition, translator).name}</strong>
        <em className={`hazard-${analysis.hazardLabel.toLowerCase()}`}>
          {hazardText(analysis.hazardLabel, translator)}
        </em>
      </header>
      <GasComposition gas={room.gas.upper} zone="upper" temperature={room.gasTemperature.upper} />
      <GasComposition gas={room.gas.lower} zone="lower" temperature={room.gasTemperature.lower} />
      <RoomReadout
        analysis={analysis}
        gasInflow={gasInflow}
        room={room}
        roomId={roomId}
        volume={facilityModelForMap(game.map).roomVolume(roomId)}
      />
      <div className="room-pressure-explanation">{pressureExplanation}</div>
      <RoomExposure lowerHazards={lowerHazards} upperHazards={upperHazards} />
      <small>{translator.text("ui.map.room.select", { room: definition.code })}</small>
    </aside>
  );
};
