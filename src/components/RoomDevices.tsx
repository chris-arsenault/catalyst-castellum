import { Box, Plus, Trash2, Zap } from "lucide-react";
import { DEVICE_CATALOG, DEVICE_ORDER, ROOM_DEFINITIONS } from "../game/config";
import { cooldownKey, previewDevice as forecastDevice } from "../game/simulation";
import { useGameStore } from "../game/store";
import type { DeviceKey, RoomId } from "../game/types";
import { DeviceGlyph } from "./DeviceGlyph";

interface InstalledDeviceCardProps {
  deviceKey: DeviceKey;
  roomId: RoomId;
}

const BuildDeviceCard = ({ deviceKey, roomId }: InstalledDeviceCardProps) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const device = DEVICE_CATALOG[deviceKey];
  return (
    <div className="installed-card" style={{ "--device-accent": device.accent }}>
      <span className="device-icon">
        <DeviceGlyph kind={device.kind} />
      </span>
      <div>
        <strong>{device.name}</strong>
        <small>{device.family}</small>
      </div>
      <button
        type="button"
        aria-label={`Salvage ${device.name}`}
        title={`Salvage for ${device.cost} point${device.cost === 1 ? "" : "s"}`}
        onClick={() => dispatch({ type: "remove_device", roomId, device: deviceKey })}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

const LiveDeviceCard = ({ deviceKey, roomId }: InstalledDeviceCardProps) => {
  const game = useGameStore((state) => state.game);
  const selectedPreview = useGameStore((state) => state.previewDevice);
  const setPreview = useGameStore((state) => state.setPreviewDevice);
  const dispatch = useGameStore((state) => state.dispatch);
  const device = DEVICE_CATALOG[deviceKey];
  const cooldown = game.cooldowns[cooldownKey(roomId, deviceKey)] ?? 0;
  const activePhase = game.phase === "prime" || game.phase === "assault";
  const disabled = !activePhase || game.paused || cooldown > 0 || game.energy < device.energyCost;
  const rechargePercent = cooldown > 0 ? (cooldown / device.cooldown) * 100 : 0;
  return (
    <button
      className={`device-control ${selectedPreview === deviceKey ? "selected" : ""}`}
      style={{ "--device-accent": device.accent }}
      type="button"
      disabled={disabled}
      data-testid={`activate-${deviceKey}`}
      onMouseEnter={() => setPreview(deviceKey)}
      onFocus={() => setPreview(deviceKey)}
      onClick={() => dispatch({ type: "activate_device", roomId, device: deviceKey })}
    >
      <span className="device-control-icon">
        <DeviceGlyph kind={device.kind} size={19} />
      </span>
      <span className="device-control-copy">
        <strong>{cooldown > 0 ? `Recharging ${cooldown.toFixed(1)}s` : device.activeLabel}</strong>
        <small>
          {device.energyCost} pressure · {device.family}
        </small>
      </span>
      <span className="device-control-cost">
        <Zap size={12} />
        {device.energyCost}
      </span>
      {cooldown > 0 && (
        <span className="cooldown-sweep" style={{ "--cooldown-width": `${rechargePercent}%` }} />
      )}
    </button>
  );
};

const InstalledDeviceCard = (props: InstalledDeviceCardProps) => {
  const phase = useGameStore((state) => state.game.phase);
  return phase === "build" ? <BuildDeviceCard {...props} /> : <LiveDeviceCard {...props} />;
};

const DeviceForecast = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const deviceKey = useGameStore((state) => state.previewDevice);
  if (!deviceKey || !game.rooms[roomId].devices.includes(deviceKey)) return null;
  const forecast = forecastDevice(game, roomId, deviceKey);
  return (
    <div
      className={`forecast-panel ${forecast.accepted ? "" : "forecast-blocked"}`}
      data-testid="command-preview"
    >
      <div>
        <span>Command preview</span>
        <strong>{forecast.title}</strong>
        <small>{forecast.summary}</small>
      </div>
      {forecast.changes.length > 0 && (
        <ul>
          {forecast.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const NoSockets = ({ kind }: { kind: "spawn" | "core" }) => (
  <section className="inspector-section no-sockets">
    <Box size={20} />
    <div>
      <strong>No device sockets</strong>
      <p>
        {kind === "core"
          ? "The core cannot host defensive modules."
          : "Spawn rooms cannot be modified."}
      </p>
    </div>
  </section>
);

interface CatalogProps {
  available: DeviceKey[];
  buildPoints: number;
  devicesInstalled: number;
  roomId: RoomId;
  slots: number;
}

const DeviceCatalog = ({
  available,
  buildPoints,
  devicesInstalled,
  roomId,
  slots,
}: CatalogProps) => {
  const dispatch = useGameStore((state) => state.dispatch);
  return (
    <div className="catalog-block">
      <div className="catalog-heading">
        <span>Fabricator catalog</span>
        <strong>{buildPoints} points available</strong>
      </div>
      <div className="catalog-list">
        {available.map((deviceKey) => {
          const device = DEVICE_CATALOG[deviceKey];
          const cannotInstall = devicesInstalled >= slots || buildPoints < device.cost;
          return (
            <button
              key={deviceKey}
              type="button"
              disabled={cannotInstall}
              title={device.description}
              onClick={() => dispatch({ type: "install_device", roomId, device: deviceKey })}
            >
              <span className="catalog-icon" style={{ "--device-accent": device.accent }}>
                <DeviceGlyph kind={device.kind} size={16} />
              </span>
              <span>
                <strong>{device.name}</strong>
                <small>{device.family}</small>
              </span>
              <em>{device.cost}</em>
              <Plus size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DeviceSection = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = game.rooms[roomId];
  const definition = ROOM_DEFINITIONS[roomId];
  const isBuild = game.phase === "build";
  if (definition.kind !== "chamber") return <NoSockets kind={definition.kind} />;
  const available = DEVICE_ORDER.filter((key) => !room.devices.includes(key));
  return (
    <section className="inspector-section device-section">
      <div className="section-title-row">
        <h3>{isBuild ? "Installed modules" : "Live controls"}</h3>
        <span>
          {room.devices.length} / {definition.slots} SOCKETS
        </span>
      </div>
      <div className={isBuild ? "installed-list" : "device-control-list"}>
        {room.devices.length === 0 && (
          <div className="empty-device-state">No modules installed in this chamber.</div>
        )}
        {room.devices.map((device) => (
          <InstalledDeviceCard key={device} deviceKey={device} roomId={roomId} />
        ))}
      </div>
      {!isBuild && <DeviceForecast />}
      {isBuild && (
        <DeviceCatalog
          available={available}
          buildPoints={game.buildPoints}
          devicesInstalled={room.devices.length}
          roomId={roomId}
          slots={definition.slots}
        />
      )}
    </section>
  );
};
