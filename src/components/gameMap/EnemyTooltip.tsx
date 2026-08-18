import { ENEMY_DEFINITIONS } from "../../presentation/defaultGame";
import { enemyGasZone, enemyRoomId } from "../../game/queries";
import type { EnemyState, GameState } from "../../game/types";
import type { WorldMap } from "../../game/world/map";
import { dominantDamageChannel } from "../../presentation/damageCopy";
import { enemyCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import type { Translator } from "../../localization/translator";
import { roomDefinition } from "../../presentation/defaultGame";

const enemyPositionCopy = (
  map: WorldMap,
  roomId: ReturnType<typeof enemyRoomId>,
  zone: ReturnType<typeof enemyGasZone>,
  translator: Translator
): string => {
  if (!roomId) return translator.text("ui.map.enemy.position.transit");
  return translator.text("ui.map.enemy.position.room", {
    room: roomDefinition({ map }, roomId).code,
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

const EnemyBehavior = ({ enemy }: { enemy: EnemyState }) => {
  const { formatters, translator } = useGamePresentation();
  const definition = ENEMY_DEFINITIONS[enemy.type];
  switch (enemy.behavior.kind) {
    case "standard":
      return null;
    case "ladder_runner": {
      if (definition.behavior.kind !== "ladder_runner") return null;
      const multiplier = definition.behavior.locomotionMultipliers[enemy.mode];
      return (
        <section className="enemy-behavior-detail">
          <strong>{translator.text("ui.map.enemy.behavior.ladder")}</strong>
          <p>
            {translator.text("ui.map.enemy.behavior.speedMultiplier", {
              multiplier: formatters.number(multiplier, 2),
            })}
          </p>
        </section>
      );
    }
    case "armored_molt": {
      const armor = Math.max(0, enemy.health - enemy.behavior.transitionHealth);
      return (
        <section className="enemy-behavior-detail">
          <strong>
            {translator.text(
              enemy.behavior.phase === "armored"
                ? "ui.map.enemy.behavior.carapace"
                : "ui.map.enemy.behavior.exposed"
            )}
          </strong>
          <p>
            {translator.text("ui.map.enemy.behavior.armorRemaining", {
              health: formatters.number(armor, 1),
            })}
          </p>
        </section>
      );
    }
    case "shared_field":
      return (
        <section className="enemy-behavior-detail">
          <strong>
            {translator.text(
              enemy.behavior.active
                ? "ui.map.enemy.behavior.fieldActive"
                : "ui.map.enemy.behavior.fieldRecharging"
            )}
          </strong>
          <p>
            {translator.text("ui.map.enemy.behavior.fieldCharge", {
              charge: formatters.number(enemy.behavior.charge, 1),
              capacity: formatters.number(enemy.behavior.maximumCharge, 0),
            })}
          </p>
        </section>
      );
    case "gas_emitter":
      return (
        <section className="enemy-behavior-detail">
          <strong>{translator.text("ui.map.enemy.behavior.hydrogenFeed")}</strong>
          <p>
            {translator.text("ui.map.enemy.behavior.reservoir", {
              amount: formatters.number(enemy.behavior.reservoir, 1),
              capacity: formatters.number(enemy.behavior.initialReservoir, 0),
            })}
          </p>
        </section>
      );
  }
};

export const EnemyTooltip = ({ enemyId, game }: { enemyId: number | null; game: GameState }) => {
  const { formatters, translator } = useGamePresentation();
  if (enemyId === null) return null;
  const enemy = game.enemies.find((candidate) => candidate.id === enemyId);
  if (!enemy) return null;
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const roomId = enemyRoomId(enemy, game);
  const zone = enemyGasZone(enemy, game);
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
          <dt>{translator.text("ui.map.enemy.level")}</dt>
          <dd>{formatters.number(enemy.level, 0)}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.enemy.health")}</dt>
          <dd>
            {formatters.number(enemy.health, 1)} / {formatters.number(enemy.maxHealth, 0)}
          </dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.enemy.position")}</dt>
          <dd>{enemyPositionCopy(game.map, roomId, zone, translator)}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.enemy.movement")}</dt>
          <dd>{movementCopy(enemy, translator)}</dd>
        </div>
      </dl>
      <EnemyBehavior enemy={enemy} />
      <EnemyLastDamage enemy={enemy} />
      <small>{translator.text("ui.map.enemy.footer")}</small>
    </aside>
  );
};
