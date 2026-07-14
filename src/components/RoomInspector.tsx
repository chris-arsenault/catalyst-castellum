import { Activity, Droplets, FlaskConical, Gauge, Info, Thermometer, X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  GAS_COLORS,
  GAS_LABELS,
  GAS_NAMES,
  LIQUID_COLORS,
  LIQUID_LABELS,
  REACTION_DEFINITIONS,
  ROOM_DEFINITIONS,
  roomVolume,
} from "../game/config";
import { gasPercent, liquidPercent } from "../game/queries";
import { limitingFactorCopy } from "../presentation/limitingFactorCopy";
import { roomAnalysis } from "../presentation/selectors";
import { useGameStore } from "../application/store";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";
import { GAS_TYPES, LIQUID_TYPES, ROOM_REACTION_IDS } from "../game/types";
import type { GasZone } from "../game/types";
import { ArchitecturalConnections } from "./ArchitecturalConnections";
import { HydrogenChlorineGate } from "./HydrogenChlorineGate";
import { OxidizerIgnitionGate } from "./OxidizerIgnitionGate";
import { ProcessControls } from "./ProcessControls";

const formatPercent = (value: number): string => {
  if (value > 0 && value < 0.001) return "<0.1%";
  if (value < 0.1) return `${(value * 100).toFixed(1)}%`;
  return `${Math.round(value * 100)}%`;
};

const GasLayerComposition = ({ zone }: { zone: GasZone }) => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const analysis = roomAnalysis(room);
  const isLower = zone === "lower";
  const total = isLower ? analysis.lowerGasTotal : analysis.upperGasTotal;
  const density = isLower ? analysis.lowerGasDensity : analysis.upperGasDensity;
  const temperature = isLower ? analysis.lowerGasTemperature : analysis.upperGasTemperature;
  return (
    <div className={`gas-layer gas-layer-${zone}`}>
      <div className="composition-heading">
        <span>{isLower ? "↓ Lower · ground sample" : "↑ Upper · flying sample"}</span>
        <strong>
          {total.toFixed(1)} mol-eq · {temperature.toFixed(0)}°C · ρ{density.toFixed(2)}
        </strong>
      </div>
      <div className="stacked-bar" aria-label={`${zone} gas composition`}>
        {GAS_TYPES.map((gas) => {
          const amount = gasPercent(room, gas, zone);
          return amount > 0.002 ? (
            <span
              key={gas}
              title={`${GAS_NAMES[gas]} ${formatPercent(amount)}`}
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
              <span>{GAS_LABELS[gas]}</span>
              <strong>{formatPercent(amount)}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GasComposition = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const analysis = roomAnalysis(game.rooms[roomId]);
  return (
    <div className="composition-group gas-layers">
      <div className="atmosphere-summary">
        <span>Shared room pressure</span>
        <strong>
          {Math.round(analysis.pressure)} kPa
          {analysis.pressurePulse > 1 && (
            <small> · +{Math.round(analysis.pressurePulse)} shock</small>
          )}
        </strong>
      </div>
      <GasLayerComposition zone="upper" />
      <GasLayerComposition zone="lower" />
    </div>
  );
};

const LiquidComposition = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const analysis = roomAnalysis(room);
  const fill = Math.min(1, analysis.liquidTotal / roomVolume(roomId));
  const presentLiquids = LIQUID_TYPES.filter((liquid) => room.liquid[liquid] > 0.05);
  return (
    <div className="composition-group liquid-group">
      <div className="composition-heading">
        <span>Liquid inventory</span>
        <strong>{formatPercent(fill)} fill</strong>
      </div>
      <div className="stacked-bar liquid-bar" aria-label="Liquid composition">
        {analysis.liquidTotal <= 0.1 && <span className="empty-liquid">DRY</span>}
        {analysis.liquidTotal > 0.1 &&
          presentLiquids.map((liquid) => {
            const amount = liquidPercent(room, liquid);
            return (
              <span
                key={liquid}
                title={`${LIQUID_LABELS[liquid]} ${formatPercent(amount)}`}
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
              <span>{LIQUID_LABELS[liquid]}</span>
              <strong>{formatPercent(liquidPercent(room, liquid))}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Composition = () => (
  <section className="inspector-section composition-section">
    <div className="section-title-row">
      <h3>Room composition</h3>
      <span>LIVE SAMPLE</span>
    </div>
    <GasComposition />
    <LiquidComposition />
  </section>
);

const RoomMetrics = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const analysis = roomAnalysis(room);
  const fill = Math.min(1, analysis.liquidTotal / roomVolume(roomId));

  return (
    <section className="metric-grid" aria-label="Room metrics">
      <div>
        <Gauge size={15} />
        <span>Pressure</span>
        <strong title={`Static ${Math.round(analysis.staticPressure)} kPa`}>
          {Math.round(analysis.pressure)}
          <small> kPa</small>
        </strong>
      </div>
      <div>
        <Thermometer size={15} />
        <span>Temperature</span>
        <strong>
          {Math.round(analysis.upperGasTemperature)}°
          <small> / {Math.round(analysis.lowerGasTemperature)}°C</small>
        </strong>
      </div>
      <div>
        <Droplets size={15} />
        <span>Liquid</span>
        <strong>
          {Math.round(fill * 100)}
          <small>%</small>
        </strong>
      </div>
    </section>
  );
};

const EffectsPanel = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const analysis = roomAnalysis(game.rooms[roomId]);

  return (
    <section className="effects-panel">
      <div className="section-title-row">
        <h3>Current exposure effect</h3>
        <Activity size={15} />
      </div>
      <ul>
        {analysis.effects.map((effect) => (
          <li key={effect} className={effect.startsWith("Enemy exposure below") ? "neutral" : ""}>
            <span /> {effect}
          </li>
        ))}
      </ul>
    </section>
  );
};

const ReactionPanel = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const telemetry = room.reactions;
  const active = ROOM_REACTION_IDS.filter((reactionId) => telemetry[reactionId].lastRate > 0.001);

  return (
    <section
      className="effects-panel reaction-readout"
      data-tutorial={`${roomId}-reaction-readout`}
      data-tutorial-anchor={
        roomId === "furnace" ? TUTORIAL_ANCHORS.furnaceReactionReadout : undefined
      }
    >
      <div className="section-title-row">
        <h3>Measured room chemistry</h3>
        <FlaskConical size={15} />
      </div>
      {roomId === "furnace" && game.campaign.levelId === "flash_point" && <OxidizerIgnitionGate />}
      {roomId === "furnace" && game.campaign.levelId === "acid_line" && <HydrogenChlorineGate />}
      {active.length === 0 ? (
        <p className="no-reaction">Reaction rate idle in this sample.</p>
      ) : (
        <div className="reaction-rate-list">
          {active.map((reactionId) => {
            const reaction = REACTION_DEFINITIONS[reactionId];
            const reading = telemetry[reactionId];
            return (
              <div key={reactionId}>
                <span>{reaction.code}</span>
                <strong>{reaction.name}</strong>
                <em>{reading.lastRate.toFixed(2)} mol-eq/s</em>
                <small>limiting: {limitingFactorCopy(reading.limitingFactor)}</small>
              </div>
            );
          })}
        </div>
      )}
      {room.combustionCount > 0 && (
        <p className="flash-counter">
          OX-1 batch flashes recorded <strong>{room.combustionCount}</strong>
        </p>
      )}
    </section>
  );
};

const RecentIncidents = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const incidents = game.incidents.filter((incident) => incident.roomId === roomId).slice(0, 1);
  return (
    <section
      className="effects-panel recent-incidents"
      data-testid={`recent-incidents-${roomId}`}
      data-tutorial-anchor={roomId === "furnace" ? TUTORIAL_ANCHORS.furnaceIncidents : undefined}
    >
      <div className="section-title-row">
        <h3>Recent incidents</h3>
        <Activity size={15} />
      </div>
      {incidents.length === 0 ? (
        <p className="no-reaction">Incident log clear for this chamber.</p>
      ) : (
        <div className="recent-incident-list">
          {incidents.map((incident) => {
            const killed = incident.targets.filter((target) => target.killed).length;
            return (
              <article key={incident.id}>
                <strong>
                  OX-1 #{incident.id} · {incident.targets.length} hit · {killed} killed
                </strong>
                <span>
                  {Math.round(incident.pressureImpulse)} kPa impulse ·{` `}
                  {Math.round(incident.damageByChannel.pressure)} pressure +{` `}
                  {Math.round(incident.damageByChannel.heat)} heat damage
                </span>
                <small>
                  {incident.phase.toUpperCase()} · recorded at {incident.elapsed.toFixed(1)}s
                </small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

const RoomDetailsModal = ({ onClose }: { onClose: () => void }) => {
  const roomId = useGameStore((state) => state.selectedRoomId);
  const definition = ROOM_DEFINITIONS[roomId];
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
            <span>{definition.code} · Room details</span>
            <h2 id="room-details-title">{definition.name}</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close room details"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="room-details-scroll">
          <p className="room-details-blurb">{definition.blurb}</p>
          <Composition />
          <EffectsPanel />
          <ReactionPanel />
          <ArchitecturalConnections />
        </div>
        <footer>
          <button type="button" className="secondary-action wide" onClick={onClose}>
            Back to the map
          </button>
        </footer>
      </section>
    </div>
  );
};

export const RoomInspector = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const definition = ROOM_DEFINITIONS[roomId];
  const analysis = roomAnalysis(game.rooms[roomId]);
  const [showDetails, setShowDetails] = useState(false);
  const closeDetails = useCallback(() => setShowDetails(false), [setShowDetails]);

  return (
    <aside className="room-inspector" data-testid="room-inspector">
      <div className="inspector-header">
        <div className="inspector-room-code">
          <span>{definition.code}</span>
          <em>Selected room</em>
        </div>
        <div
          className={`hazard-badge hazard-${analysis.hazardLabel.toLowerCase()}`}
          data-testid="hazard-rating"
        >
          <span>{analysis.hazardLabel}</span>
          <strong>{Math.round(analysis.hazard)}</strong>
        </div>
        <h2 data-testid="room-name">{definition.name}</h2>
        <button className="room-details-button" type="button" onClick={() => setShowDetails(true)}>
          <Info size={14} /> Room details
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
