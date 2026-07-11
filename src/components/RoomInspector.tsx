import { Activity, Biohazard, Droplets, Gauge, Thermometer } from "lucide-react";
import {
  GAS_COLORS,
  GAS_LABELS,
  GAS_NAMES,
  LIQUID_COLORS,
  LIQUID_LABELS,
  ROOM_DEFINITIONS,
} from "../game/config";
import { analyzeRoom, gasPercent, liquidPercent } from "../game/simulation";
import { useGameStore } from "../game/store";
import { GAS_TYPES, LIQUID_TYPES } from "../game/types";
import { DeviceSection } from "./RoomDevices";

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const GasComposition = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const analysis = analyzeRoom(room);
  return (
    <div className="composition-group">
      <div className="composition-heading">
        <span>Atmosphere</span>
        <strong>{Math.round(analysis.pressure)} kPa</strong>
      </div>
      <div className="stacked-bar" aria-label="Gas composition">
        {GAS_TYPES.map((gas) => {
          const amount = gasPercent(room, gas);
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
          const amount = gasPercent(room, gas);
          return (
            <div
              key={gas}
              className={amount < 0.005 ? "trace-amount" : ""}
              data-testid={`gas-${gas}`}
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

const LiquidComposition = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const analysis = analyzeRoom(room);
  const presentLiquids = LIQUID_TYPES.filter((liquid) => room.liquid[liquid] > 0.05);
  return (
    <div className="composition-group liquid-group">
      <div className="composition-heading">
        <span>Floor contents</span>
        <strong>{Math.round(analysis.liquidTotal)}% fill</strong>
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
  const analysis = analyzeRoom(room);

  return (
    <section className="metric-grid" aria-label="Room metrics">
      <div>
        <Gauge size={15} />
        <span>Pressure</span>
        <strong>
          {Math.round(analysis.pressure)}
          <small> kPa</small>
        </strong>
      </div>
      <div>
        <Thermometer size={15} />
        <span>Temperature</span>
        <strong>
          {Math.round(room.temperature)}
          <small>°C</small>
        </strong>
      </div>
      <div>
        <Droplets size={15} />
        <span>Liquid fill</span>
        <strong>
          {Math.round(analysis.liquidTotal)}
          <small>%</small>
        </strong>
      </div>
      <div>
        <Biohazard size={15} />
        <span>Residue</span>
        <strong>
          {Math.round(room.residue)}
          <small>%</small>
        </strong>
      </div>
    </section>
  );
};

const EffectsPanel = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const analysis = analyzeRoom(game.rooms[roomId]);

  return (
    <section className="effects-panel">
      <div className="section-title-row">
        <h3>Expected enemy effect</h3>
        <Activity size={15} />
      </div>
      <ul>
        {analysis.effects.map((effect) => (
          <li key={effect} className={effect.startsWith("No meaningful") ? "neutral" : ""}>
            <span /> {effect}
          </li>
        ))}
      </ul>
    </section>
  );
};

export const RoomInspector = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const definition = ROOM_DEFINITIONS[roomId];
  const analysis = analyzeRoom(game.rooms[roomId]);

  return (
    <aside className="room-inspector" data-testid="room-inspector">
      <div className="inspector-header">
        <div className="inspector-room-code">
          <span>{definition.code}</span>
          <em>{definition.kind}</em>
        </div>
        <div
          className={`hazard-badge hazard-${analysis.hazardLabel.toLowerCase()}`}
          data-testid="hazard-rating"
        >
          <span>{analysis.hazardLabel}</span>
          <strong>{Math.round(analysis.hazard)}</strong>
        </div>
        <h2 data-testid="room-name">{definition.name}</h2>
        <p>{definition.blurb}</p>
      </div>

      <div className="inspector-scroll">
        <RoomMetrics />
        <Composition />
        <EffectsPanel />
        <DeviceSection />
        <div className="inspector-end-mark">
          <span /> END CHAMBER RECORD <span />
        </div>
      </div>
    </aside>
  );
};
