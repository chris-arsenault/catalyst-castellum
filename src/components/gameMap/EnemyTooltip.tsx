import { ENEMY_DEFINITIONS, ROOM_DEFINITIONS } from "../../game/config";
import {
  enemyGasZone,
  enemyRoomId,
  enemyWorldPosition,
  liquidSurfaceElevation,
  roomHazards,
} from "../../game/queries";
import type { EnemyState, GameState, HazardChannels } from "../../game/types";
import {
  DAMAGE_CHANNELS,
  damageChannelDetail,
  damageChannelStyle,
  damageSourceDetail,
  damageSourceLabel,
  dominantDamageChannel,
  formatDamageAmount,
} from "../../presentation/damageCopy";

const enemyExposure = (game: GameState, enemy: EnemyState): HazardChannels | null => {
  const roomId = enemyRoomId(enemy);
  if (!roomId) return null;
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const footElevation = enemyWorldPosition(enemy).elevation - 0.5;
  const floorContact =
    !definition.flying &&
    enemy.mode !== "climbing" &&
    enemy.mode !== "falling" &&
    liquidSurfaceElevation(game.rooms[roomId]) > footElevation;
  const base = roomHazards(
    game.rooms[roomId],
    floorContact,
    definition.needsOxygen,
    enemyGasZone(enemy)
  );
  return {
    atmosphere: base.atmosphere * definition.hazardMultipliers.atmosphere,
    corrosion: base.corrosion * definition.hazardMultipliers.corrosion,
    heat: base.heat * definition.hazardMultipliers.heat,
    pressure: base.pressure * definition.hazardMultipliers.pressure,
    radiation: base.radiation * definition.hazardMultipliers.radiation,
  };
};

export const EnemyTooltip = ({ enemyId, game }: { enemyId: number | null; game: GameState }) => {
  if (enemyId === null) return null;
  const enemy = game.enemies.find((candidate) => candidate.id === enemyId);
  if (!enemy) return null;
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const roomId = enemyRoomId(enemy);
  const zone = enemyGasZone(enemy);
  const exposure = enemyExposure(game, enemy);
  const activeExposure = exposure
    ? DAMAGE_CHANNELS.filter((channel) => exposure[channel] > 0.01)
    : [];
  const lastChannel = enemy.lastDamage ? dominantDamageChannel(enemy.lastDamage.channels) : null;
  return (
    <aside className="room-map-tooltip enemy-map-tooltip" data-testid="enemy-map-tooltip">
      <header>
        <span>HOSTILE #{enemy.id}</span>
        <strong>{definition.name}</strong>
        <em>{Math.ceil((enemy.health / enemy.maxHealth) * 100)}% HP</em>
      </header>
      <div className="enemy-health-detail">
        <span style={{ width: `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%` }} />
      </div>
      <dl>
        <div>
          <dt>Health</dt>
          <dd>
            {enemy.health.toFixed(1)} / {enemy.maxHealth}
          </dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>{roomId ? `${ROOM_DEFINITIONS[roomId].code} · ${zone} gas` : "Transit passage"}</dd>
        </div>
        <div>
          <dt>Movement</dt>
          <dd>{enemy.mode}</dd>
        </div>
      </dl>
      <section className="enemy-exposure-detail">
        <strong>Current exposure</strong>
        {activeExposure.length > 0 ? (
          activeExposure.map((channel) => (
            <div key={channel}>
              <span style={{ color: damageChannelStyle[channel].color }}>
                {damageChannelStyle[channel].label}
              </span>
              <b>{exposure?.[channel].toFixed(1)} HP/s</b>
              <small>{damageChannelDetail[channel]}</small>
            </div>
          ))
        ) : (
          <p>Current room conditions apply 0 HP/s.</p>
        )}
      </section>
      {enemy.lastDamage && lastChannel && (
        <section className="enemy-last-damage">
          <span style={{ color: damageChannelStyle[lastChannel].color }}>
            Last tick · −{formatDamageAmount(enemy.lastDamage.amount)}{" "}
            {damageChannelStyle[lastChannel].label}
          </span>
          <strong>{damageSourceLabel[enemy.lastDamage.sourceId]}</strong>
          <small>{damageSourceDetail[enemy.lastDamage.sourceId]}</small>
        </section>
      )}
      <small>Hover detail · health bars track continuous exposure</small>
    </aside>
  );
};
