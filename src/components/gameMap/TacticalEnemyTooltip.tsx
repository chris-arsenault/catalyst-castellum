import { useEncounterControls } from "../../application/encounterSurface";
import { enemyCopy } from "../../presentation/entityCopy";

export const TacticalEnemyTooltip = ({ enemyId }: { enemyId: number }) => {
  const { encounter, presentation } = useEncounterControls();
  const { translator, formatters, enemyDefinition } = presentation;
  const enemy = encounter.enemies.find((candidate) => candidate.id === enemyId);
  if (!enemy) return null;
  const definition = enemyDefinition(enemy.type);
  return (
    <aside className="room-map-tooltip enemy-map-tooltip" data-testid="enemy-map-tooltip">
      <h3>
        {translator.text("catalyst.selectedEnemy", {
          id: enemy.id,
          name: enemyCopy(definition, translator).name,
        })}
      </h3>
      <p>
        {translator.text("catalyst.health", {
          health: formatters.number(enemy.health),
          maximum: enemy.maxHealth,
        })}
      </p>
      <p>
        {translator.text("catalyst.enemyLayer", {
          layer: translator.text(definition.flying ? "catalyst.flying" : "catalyst.ground"),
          route: enemy.routeId,
        })}
      </p>
      <EnemyChargeDetail enemyId={enemyId} />
    </aside>
  );
};

const EnemyChargeDetail = ({ enemyId }: { enemyId: number }) => {
  const { encounter, presentation } = useEncounterControls();
  const { translator, formatters, context } = presentation;
  const enemy = encounter.enemies.find((entry) => entry.id === enemyId);
  const mechanics = context.combat.mechanics;
  if (!enemy || mechanics.kind !== "catalyst") return null;
  const charge = encounter.catalyst?.chargeByEnemy[String(enemy.id)];
  const amount = charge?.amount ?? 0;
  return (
    <>
      <label>
        {translator.text("catalyst.charge", {
          amount: formatters.number(amount),
          capacity: mechanics.rules.chargeCapacity,
        })}
        <meter min={0} max={mechanics.rules.chargeCapacity} value={amount} />
      </label>
      <p>
        {translator.text("catalyst.susceptibility", {
          amount: mechanics.susceptibility[enemy.type] ?? 1,
        })}
      </p>
      <p>
        {translator.text("catalyst.decay", {
          amount: mechanics.rules.chargeDecayPerSecond,
          delay: mechanics.rules.chargeDecayDelaySeconds,
        })}
      </p>
      <p>
        {translator.text("catalyst.contributors", {
          count: Object.keys(charge?.contributions ?? {}).length,
        })}
      </p>
    </>
  );
};
