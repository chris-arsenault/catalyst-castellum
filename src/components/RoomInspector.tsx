import { facilityModelForMap } from "../game/world/derivedModel";
import { Activity, Droplets, FlaskConical, Gauge, Info, Thermometer, X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  GAS_COLORS,
  LIQUID_COLORS,
  LEVEL_DEFINITIONS,
  REACTION_DEFINITIONS,
  SPECIES_DEFINITIONS,
} from "../presentation/defaultGame";
import { gasPercent, liquidPercent } from "../game/queries";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";
import { GAS_TYPES, LIQUID_TYPES } from "../game/types";
import type { GasZone, ReactionId, RoomId, RoomReactionId } from "../game/types";
import { ArchitecturalConnections } from "./ArchitecturalConnections";
import { HydrogenChlorineGate } from "./HydrogenChlorineGate";
import { OxidizerIgnitionGate } from "./OxidizerIgnitionGate";
import { ProcessControls } from "./ProcessControls";
import { reactionCopy, roomCopy, speciesCopy } from "../presentation/entityCopy";
import type { LocaleFormatters } from "../localization/formatters";
import type { Translator } from "../localization/translator";
import type { HazardLabel } from "../presentation/roomCopy";
import { RecentIncidents } from "./roomInspector/RecentIncidents";
import { roomState } from "../game/world/instances";
import { roomDefinition } from "../presentation/defaultGame";

const formatPercent = (value: number, formatters: LocaleFormatters): string => {
  if (value > 0 && value < 0.001) return `<${formatters.percent(0.001, 1)}`;
  return formatters.percent(value, value < 0.1 ? 1 : 0);
};

const localizedHazard = (hazard: HazardLabel, translator: Translator): string => {
  const keys = {
    CLEAR: "ui.room.hazard.clear",
    LOW: "ui.room.hazard.low",
    HOSTILE: "ui.room.hazard.hostile",
    LETHAL: "ui.room.hazard.lethal",
  } as const;
  return translator.text(keys[hazard]);
};

const GasLayerComposition = ({ zone }: { zone: GasZone }) => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = roomState(game, roomId);
  const analysis = selectors.roomAnalysis(room);
  const isLower = zone === "lower";
  const total = isLower ? analysis.lowerGasTotal : analysis.upperGasTotal;
  const density = isLower ? analysis.lowerGasDensity : analysis.upperGasDensity;
  const temperature = isLower ? analysis.lowerGasTemperature : analysis.upperGasTemperature;
  return (
    <div className={`gas-layer gas-layer-${zone}`}>
      <div className="composition-heading">
        <span>{translator.text(isLower ? "ui.room.lowerSample" : "ui.room.upperSample")}</span>
        <strong>
          {formatters.measurement(total, "mol-eq", 1)} ·{" "}
          {formatters.measurement(temperature, "°C", 0)} · ρ{formatters.number(density, 2)}
        </strong>
      </div>
      <div
        className="stacked-bar"
        aria-label={translator.text("ui.room.gasComposition", {
          zone: translator.text(zone === "upper" ? "ui.gate.upperLayer" : "ui.gate.lowerLayer"),
        })}
      >
        {GAS_TYPES.map((gas) => {
          const amount = gasPercent(room, gas, zone);
          return amount > 0.002 ? (
            <span
              key={gas}
              title={`${speciesCopy(SPECIES_DEFINITIONS[gas], translator).name} ${formatPercent(amount, formatters)}`}
              style={{
                "--segment-width": `${amount * 100}%`,
                "--segment-color": GAS_COLORS[gas],
              }}
            />
          ) : null;
        })}
      </div>
      <div className="composition-list">
        {GAS_TYPES.map((gas) => {
          const amount = gasPercent(room, gas, zone);
          return (
            <div
              key={gas}
              className={amount < 0.005 ? "trace-amount" : ""}
              data-testid={`gas-${zone}-${gas}`}
            >
              <span className="color-dot" style={{ "--dot-color": GAS_COLORS[gas] }} />
              <span>{speciesCopy(SPECIES_DEFINITIONS[gas], translator).name}</span>
              <strong>{formatPercent(amount, formatters)}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GasComposition = () => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const analysis = selectors.roomAnalysis(roomState(game, roomId));
  return (
    <div className="composition-group gas-layers">
      <div className="atmosphere-summary">
        <span>{translator.text("ui.room.sharedPressure")}</span>
        <strong>
          {formatters.measurement(analysis.pressure, "kPa", 0)}
          {analysis.pressurePulse > 1 && (
            <small>
              {translator.text("ui.room.shock", {
                pressure: formatters.number(analysis.pressurePulse, 0),
              })}
            </small>
          )}
        </strong>
      </div>
      <GasLayerComposition zone="upper" />
      <GasLayerComposition zone="lower" />
    </div>
  );
};

const LiquidComposition = () => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = roomState(game, roomId);
  const analysis = selectors.roomAnalysis(room);
  const fill = Math.min(1, analysis.liquidTotal / facilityModelForMap(game.map).roomVolume(roomId));
  const presentLiquids = LIQUID_TYPES.filter((liquid) => room.liquid[liquid] > 0.05);
  return (
    <div className="composition-group liquid-group">
      <div className="composition-heading">
        <span>{translator.text("ui.room.liquidInventory")}</span>
        <strong>
          {translator.text("ui.room.fill", { percent: formatPercent(fill, formatters) })}
        </strong>
      </div>
      <div
        className="stacked-bar liquid-bar"
        aria-label={translator.text("ui.room.liquidComposition")}
      >
        {analysis.liquidTotal <= 0.1 && (
          <span className="empty-liquid">{translator.text("ui.room.dry")}</span>
        )}
        {analysis.liquidTotal > 0.1 &&
          presentLiquids.map((liquid) => {
            const amount = liquidPercent(room, liquid);
            return (
              <span
                key={liquid}
                title={`${speciesCopy(SPECIES_DEFINITIONS[liquid], translator).name} ${formatPercent(amount, formatters)}`}
                style={{
                  "--segment-width": `${amount * 100}%`,
                  "--segment-color": LIQUID_COLORS[liquid],
                }}
              />
            );
          })}
      </div>
      {analysis.liquidTotal > 0.1 && (
        <div className="composition-list liquid-list">
          {presentLiquids.map((liquid) => (
            <div key={liquid}>
              <span className="color-dot" style={{ "--dot-color": LIQUID_COLORS[liquid] }} />
              <span>{speciesCopy(SPECIES_DEFINITIONS[liquid], translator).name}</span>
              <strong>{formatPercent(liquidPercent(room, liquid), formatters)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Composition = () => {
  const { translator } = useGamePresentation();
  return (
    <section className="inspector-section composition-section">
      <div className="section-title-row">
        <h3>{translator.text("ui.room.composition")}</h3>
        <span>{translator.text("ui.room.liveSample")}</span>
      </div>
      <GasComposition />
      <LiquidComposition />
    </section>
  );
};

const RoomMetrics = () => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = roomState(game, roomId);
  const analysis = selectors.roomAnalysis(room);
  const fill = Math.min(1, analysis.liquidTotal / facilityModelForMap(game.map).roomVolume(roomId));

  return (
    <section className="metric-grid" aria-label={translator.text("ui.room.metrics")}>
      <div>
        <Gauge size={15} />
        <span>{translator.text("ui.room.pressure")}</span>
        <strong
          title={translator.text("ui.room.staticPressure", {
            pressure: formatters.measurement(analysis.staticPressure, "kPa", 0),
          })}
        >
          {formatters.number(analysis.pressure, 0)}
          <small>{translator.text("ui.room.pressureUnit")}</small>
        </strong>
      </div>
      <div>
        <Thermometer size={15} />
        <span>{translator.text("ui.room.temperature")}</span>
        <strong>
          {formatters.number(analysis.upperGasTemperature, 0)}°
          <small>
            {translator.text("ui.room.lowerTemperature", {
              temperature: formatters.number(analysis.lowerGasTemperature, 0),
            })}
          </small>
        </strong>
      </div>
      <div>
        <Droplets size={15} />
        <span>{translator.text("ui.room.liquid")}</span>
        <strong>
          {formatters.number(fill * 100, 0)}
          <small>{translator.text("ui.room.percentUnit")}</small>
        </strong>
      </div>
    </section>
  );
};

const EffectsPanel = () => {
  const { selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const analysis = selectors.roomAnalysis(roomState(game, roomId));

  return (
    <section className="effects-panel">
      <div className="section-title-row">
        <h3>{translator.text("ui.room.exposure")}</h3>
        <Activity size={15} />
      </div>
      <ul>
        {analysis.effects.map((effect) => (
          <li key={effect} className={analysis.hazard < 0.1 ? "neutral" : ""}>
            <span /> {effect}
          </li>
        ))}
      </ul>
    </section>
  );
};

const ReactionGate = ({ reactionId, roomId }: { reactionId: ReactionId; roomId: RoomId }) => {
  const behavior = REACTION_DEFINITIONS[reactionId].behavior;
  if (behavior.kind === "flash") return <OxidizerIgnitionGate roomId={roomId} />;
  if (behavior.kind === "gas_recombination") return <HydrogenChlorineGate roomId={roomId} />;
  return null;
};

const ReactionPanel = () => {
  const { formatters, limitingFactorCopy: factorCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = roomState(game, roomId);
  const telemetry = room.reactions;
  const active = Object.entries(telemetry) as [
    RoomReactionId,
    (typeof telemetry)[RoomReactionId],
  ][];
  const activeReactionIds = active
    .filter(([, reading]) => reading.lastRate > 0.001)
    .map(([reactionId]) => reactionId);
  const level = LEVEL_DEFINITIONS[game.campaign.levelId];
  const featured = roomId === level.focusRoomId ? level.featuredReactionIds : [];

  return (
    <section
      className="effects-panel reaction-readout"
      data-tutorial={`${roomId}-reaction-readout`}
      data-tutorial-anchor={
        roomId === "furnace" ? TUTORIAL_ANCHORS.furnaceReactionReadout : undefined
      }
    >
      <div className="section-title-row">
        <h3>{translator.text("ui.room.chemistry")}</h3>
        <FlaskConical size={15} />
      </div>
      {featured.map((reactionId) => (
        <ReactionGate key={reactionId} reactionId={reactionId} roomId={roomId} />
      ))}
      {activeReactionIds.length === 0 ? (
        <p className="no-reaction">{translator.text("ui.room.reactionIdle")}</p>
      ) : (
        <div className="reaction-rate-list">
          {activeReactionIds.map((reactionId) => {
            const reaction = REACTION_DEFINITIONS[reactionId];
            const reading = telemetry[reactionId];
            return (
              <div key={reactionId}>
                <span>{reaction.code}</span>
                <strong>{reactionCopy(reaction, translator).name}</strong>
                <em>{formatters.measurement(reading.lastRate, "mol-eq/s", 2)}</em>
                <small>
                  {translator.text("ui.room.limiting", {
                    factor: factorCopy(reading.limitingFactor),
                  })}
                </small>
              </div>
            );
          })}
        </div>
      )}
      {room.combustionCount > 0 && (
        <p className="flash-counter">
          {translator.text("ui.room.flashCount", { count: room.combustionCount })}
        </p>
      )}
    </section>
  );
};

const RoomDetailsModal = ({ onClose }: { onClose: () => void }) => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const definition = roomDefinition(game, roomId);
  return (
    <div className="modal-backdrop room-details-backdrop">
      <section
        className="room-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-details-title"
      >
        <header>
          <div>
            <span>{translator.text("ui.room.details.kicker", { code: definition.code })}</span>
            <h2 id="room-details-title">{roomCopy(definition, translator).name}</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label={translator.text("ui.room.details.close")}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="room-details-scroll">
          <p className="room-details-blurb">{roomCopy(definition, translator).description}</p>
          <Composition />
          <EffectsPanel />
          <ReactionPanel />
          <ArchitecturalConnections />
        </div>
        <footer>
          <button type="button" className="secondary-action wide" onClick={onClose}>
            {translator.text("ui.room.details.back")}
          </button>
        </footer>
      </section>
    </div>
  );
};

export const RoomInspector = () => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const definition = roomDefinition(game, roomId);
  const analysis = selectors.roomAnalysis(roomState(game, roomId));
  const [showDetails, setShowDetails] = useState(false);
  const closeDetails = useCallback(() => setShowDetails(false), [setShowDetails]);

  return (
    <aside className="room-inspector" data-testid="room-inspector">
      <div className="inspector-header">
        <div className="inspector-room-code">
          <span>{definition.code}</span>
          <em>{translator.text("ui.room.selected")}</em>
        </div>
        <div
          className={`hazard-badge hazard-${analysis.hazardLabel.toLowerCase()}`}
          data-testid="hazard-rating"
        >
          <span>{localizedHazard(analysis.hazardLabel, translator)}</span>
          <strong>{formatters.number(analysis.hazard, 0)}</strong>
        </div>
        <h2 data-testid="room-name">{roomCopy(definition, translator).name}</h2>
        <button className="room-details-button" type="button" onClick={() => setShowDetails(true)}>
          <Info size={14} /> {translator.text("ui.room.details.open")}
        </button>
      </div>

      <div className="inspector-scroll">
        <RoomMetrics />
        <ProcessControls />
        <RecentIncidents />
      </div>
      {showDetails && <RoomDetailsModal onClose={closeDetails} />}
    </aside>
  );
};
