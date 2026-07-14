import { Bird, Bug, Shield, Snail, Wind } from "lucide-react";
import { useState } from "react";
import { ENEMY_DEFINITIONS } from "../../presentation/defaultGame";
import { ENEMY_TYPES, type EnemyManualIcon, type EnemyType } from "../../game/types";
import { DAMAGE_CHANNELS } from "../../presentation/damageCopy";
import { enemyCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import type { Translator } from "../../localization/translator";

const ENEMY_ICONS: Record<EnemyManualIcon, typeof Bug> = {
  bug: Bug,
  wind: Wind,
  bird: Bird,
  shield: Shield,
  snail: Snail,
};

const movement = (enemyType: EnemyType, translator: Translator): string => {
  const definition = ENEMY_DEFINITIONS[enemyType];
  if (definition.flying) return translator.text("ui.manual.threats.movement.airborne");
  if (definition.speed >= 0.16) return translator.text("ui.manual.threats.movement.rapid");
  if (definition.speed <= 0.08) return translator.text("ui.manual.threats.movement.armored");
  return translator.text("ui.manual.threats.movement.ground");
};

const responseLabel = (multiplier: number, translator: Translator): string => {
  if (multiplier > 1.05) return translator.text("ui.manual.threats.response.amplified");
  if (multiplier < 0.95) return translator.text("ui.manual.threats.response.reduced");
  return translator.text("ui.manual.threats.response.standard");
};

const ThreatIndex = ({
  onSelect,
  selectedType,
}: {
  onSelect: (enemyType: EnemyType) => void;
  selectedType: EnemyType;
}) => {
  const { translator } = useGamePresentation();
  return (
    <aside className="manual-threat-index">
      <span>{translator.text("ui.manual.threats.observed")}</span>
      {ENEMY_TYPES.map((enemyType) => {
        const EnemyIcon = ENEMY_ICONS[ENEMY_DEFINITIONS[enemyType].presentation.manualIcon];
        return (
          <button
            key={enemyType}
            type="button"
            className={selectedType === enemyType ? "selected" : ""}
            onClick={() => onSelect(enemyType)}
          >
            <EnemyIcon size={18} />
            <span>
              <strong>{enemyCopy(ENEMY_DEFINITIONS[enemyType], translator).name}</strong>
              <small>{movement(enemyType, translator)}</small>
            </span>
          </button>
        );
      })}
    </aside>
  );
};

const ExposureResponses = ({ enemyType }: { enemyType: EnemyType }) => {
  const { damage, formatters, translator } = useGamePresentation();
  const definition = ENEMY_DEFINITIONS[enemyType];
  return (
    <section className="manual-entry-section">
      <h3>{translator.text("ui.manual.threats.exposure")}</h3>
      <div className="manual-threat-multipliers">
        {DAMAGE_CHANNELS.map((channel) => {
          const multiplier = definition.hazardMultipliers[channel];
          return (
            <div key={channel} style={{ "--channel": damage.channelStyle[channel].color }}>
              <span>{damage.channelStyle[channel].label}</span>
              <strong>{formatters.number(multiplier, 2)}×</strong>
              <small>{responseLabel(multiplier, translator)}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const ThreatCatalog = () => {
  const { formatters, manual, translator } = useGamePresentation();
  const [selectedType, setSelectedType] = useState<EnemyType>(ENEMY_TYPES[0]);
  const definition = ENEMY_DEFINITIONS[selectedType];
  const copy = enemyCopy(definition, translator);
  const Icon = ENEMY_ICONS[definition.presentation.manualIcon];
  return (
    <section className="manual-page manual-threat-page" data-testid="manual-threat-page">
      <ThreatIndex onSelect={setSelectedType} selectedType={selectedType} />
      <article className="manual-threat-entry" data-testid={`enemy-entry-${selectedType}`}>
        <header style={{ "--enemy": definition.color }}>
          <div>
            <Icon size={42} />
          </div>
          <span>
            <small>
              {translator.text("ui.manual.threats.hostile", {
                movement: movement(selectedType, translator),
              })}
            </small>
            <h2>{copy.name}</h2>
            <p>{copy.description}</p>
          </span>
        </header>
        <blockquote>{manual.enemyFlavor[selectedType]}</blockquote>
        <dl className="manual-threat-stats">
          <div>
            <dt>{translator.text("ui.manual.threats.health")}</dt>
            <dd>{formatters.number(definition.health, 0)}</dd>
          </div>
          <div>
            <dt>{translator.text("ui.manual.threats.speed")}</dt>
            <dd>{formatters.number(definition.speed, 3)}</dd>
          </div>
          <div>
            <dt>{translator.text("ui.manual.threats.coreImpact")}</dt>
            <dd>{formatters.number(definition.coreDamage, 0)}</dd>
          </div>
          <div>
            <dt>{translator.text("ui.manual.threats.matter")}</dt>
            <dd>{formatters.number(definition.matterYield, 0)}</dd>
          </div>
        </dl>
        <ExposureResponses enemyType={selectedType} />
      </article>
    </section>
  );
};
