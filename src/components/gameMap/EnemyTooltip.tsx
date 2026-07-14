import { ENEMY_DEFINITIONS, ROOM_DEFINITIONS } from "../../presentation/defaultGame";
import {
  enemyGasZone,
  enemyRoomId,
  enemyWorldPosition,
  liquidSurfaceElevation,
  roomHazards,
} from "../../game/queries";
import type { EnemyState, GameState, HazardChannels } from "../../game/types";
import { DAMAGE_CHANNELS, dominantDamageChannel } from "../../presentation/damageCopy";
import { enemyCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import type { Translator } from "../../localization/translator";

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

const enemyPositionCopy = (
  roomId: ReturnType<typeof enemyRoomId>,
  zone: ReturnType<typeof enemyGasZone>,
  translator: Translator
): string => {
  if (!roomId) return translator.text("ui.map.enemy.position.transit");
  return translator.text("ui.map.enemy.position.room", {
    room: ROOM_DEFINITIONS[roomId].code,
    zone: translator.text(zone === "upper" ? "ui.map.enemy.zone.upper" : "ui.map.enemy.zone.lower"),
  });
};

const movementCopy = (enemy: EnemyState, translator: Translator): string =>
  translator.text(
    (
      {
        walking: "ui.map.enemy.mode.walking",
        climbing: "ui.map.enemy.mode.climbing",
        falling: "ui.map.enemy.mode.falling",
        door: "ui.map.enemy.mode.door",
        flying: "ui.map.enemy.mode.flying",
      } as const
    )[enemy.mode]
  );

const EnemyExposure = ({ exposure }: { exposure: HazardChannels | null }) => {
  const { damage, formatters, translator } = useGamePresentation();
  const active = exposure ? DAMAGE_CHANNELS.filter((channel) => exposure[channel] > 0.01) : [];
  return (
    <section className="enemy-exposure-detail">
      <strong>{translator.text("ui.map.enemy.exposure")}</strong>
      {active.length > 0 ? (
        active.map((channel) => (
          <div key={channel}>
            <span style={{ color: damage.channelStyle[channel].color }}>
              {damage.channelStyle[channel].label}
            </span>
            <b>
              {translator.text("ui.map.enemy.exposureRate", {
                rate: formatters.number(exposure?.[channel] ?? 0, 1),
              })}
            </b>
            <small>{damage.channelDetail[channel]}</small>
          </div>
        ))
      ) : (
        <p>{translator.text("ui.map.enemy.exposureClear")}</p>
      )}
    </section>
  );
};

const damagePrecision = (amount: number): number => {
  if (amount >= 10) return 0;
  if (amount >= 1) return 1;
  return 2;
};

const EnemyLastDamage = ({ enemy }: { enemy: EnemyState }) => {
  const { damage, formatters, translator } = useGamePresentation();
  if (!enemy.lastDamage) return null;
  const channel = dominantDamageChannel(enemy.lastDamage.channels);
  if (!channel) return null;
  return (
    <section className="enemy-last-damage">
      <span style={{ color: damage.channelStyle[channel].color }}>
        {translator.text("ui.map.enemy.lastDamage", {
          damage: formatters.number(
            enemy.lastDamage.amount,
            damagePrecision(enemy.lastDamage.amount)
          ),
          channel: damage.channelStyle[channel].label,
        })}
      </span>
      <strong>{damage.sourceLabel[enemy.lastDamage.sourceId]}</strong>
      <small>{damage.sourceDetail[enemy.lastDamage.sourceId]}</small>
    </section>
  );
};

export const EnemyTooltip = ({ enemyId, game }: { enemyId: number | null; game: GameState }) => {
  const { formatters, translator } = useGamePresentation();
  if (enemyId === null) return null;
  const enemy = game.enemies.find((candidate) => candidate.id === enemyId);
  if (!enemy) return null;
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const roomId = enemyRoomId(enemy);
  const zone = enemyGasZone(enemy);
  return (
    <aside className="room-map-tooltip enemy-map-tooltip" data-testid="enemy-map-tooltip">
      <header>
        <span>{translator.text("ui.map.enemy.hostile", { id: enemy.id })}</span>
        <strong>{enemyCopy(definition, translator).name}</strong>
        <em>
          {translator.text("ui.map.enemy.healthPercent", {
            percent: formatters.number(Math.ceil((enemy.health / enemy.maxHealth) * 100), 0),
          })}
        </em>
      </header>
      <div className="enemy-health-detail">
        <span style={{ width: `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%` }} />
      </div>
      <dl>
        <div>
          <dt>{translator.text("ui.map.enemy.health")}</dt>
          <dd>
            {formatters.number(enemy.health, 1)} / {formatters.number(enemy.maxHealth, 0)}
          </dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.enemy.position")}</dt>
          <dd>{enemyPositionCopy(roomId, zone, translator)}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.enemy.movement")}</dt>
          <dd>{movementCopy(enemy, translator)}</dd>
        </div>
      </dl>
      <EnemyExposure exposure={enemyExposure(game, enemy)} />
      <EnemyLastDamage enemy={enemy} />
      <small>{translator.text("ui.map.enemy.footer")}</small>
    </aside>
  );
};
