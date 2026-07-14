import { Bird, Bug, Shield, Snail, Wind } from "lucide-react";
import { useState } from "react";
import { ENEMY_DEFINITIONS } from "../../presentation/defaultGame";
import { ENEMY_TYPES, type EnemyManualIcon, type EnemyType } from "../../game/types";
import { damageChannelStyle, DAMAGE_CHANNELS } from "../../presentation/damageCopy";
import { ENEMY_MANUAL_FLAVOR } from "../../presentation/manualContent";
import { enemyCopy } from "../../presentation/entityCopy";

const ENEMY_ICONS: Record<EnemyManualIcon, typeof Bug> = {
  bug: Bug,
  wind: Wind,
  bird: Bird,
  shield: Shield,
  snail: Snail,
};

const movement = (enemyType: EnemyType): string => {
  const definition = ENEMY_DEFINITIONS[enemyType];
  if (definition.flying) return "Airborne";
  if (definition.speed >= 0.16) return "Rapid ground";
  if (definition.speed <= 0.08) return "Armored ground";
  return "Ground";
};

const responseLabel = (multiplier: number): string => {
  if (multiplier > 1.05) return "Amplified";
  if (multiplier < 0.95) return "Reduced";
  return "Standard";
};

const ThreatIndex = ({
  onSelect,
  selectedType,
}: {
  onSelect: (enemyType: EnemyType) => void;
  selectedType: EnemyType;
}) => (
  <aside className="manual-threat-index">
    <span>Observed forms</span>
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
            <strong>{enemyCopy(ENEMY_DEFINITIONS[enemyType]).name}</strong>
            <small>{movement(enemyType)}</small>
          </span>
        </button>
      );
    })}
  </aside>
);

const ExposureResponses = ({ enemyType }: { enemyType: EnemyType }) => {
  const definition = ENEMY_DEFINITIONS[enemyType];
  return (
    <section className="manual-entry-section">
      <h3>Exposure response</h3>
      <div className="manual-threat-multipliers">
        {DAMAGE_CHANNELS.map((channel) => {
          const multiplier = definition.hazardMultipliers[channel];
          return (
            <div key={channel} style={{ "--channel": damageChannelStyle[channel].color }}>
              <span>{damageChannelStyle[channel].label}</span>
              <strong>{multiplier.toFixed(2)}×</strong>
              <small>{responseLabel(multiplier)}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const ThreatCatalog = () => {
  const [selectedType, setSelectedType] = useState<EnemyType>(ENEMY_TYPES[0]);
  const definition = ENEMY_DEFINITIONS[selectedType];
  const copy = enemyCopy(definition);
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
            <small>{movement(selectedType)} hostile</small>
            <h2>{copy.name}</h2>
            <p>{copy.description}</p>
          </span>
        </header>
        <blockquote>{ENEMY_MANUAL_FLAVOR[selectedType]}</blockquote>
        <dl className="manual-threat-stats">
          <div>
            <dt>Health</dt>
            <dd>{definition.health}</dd>
          </div>
          <div>
            <dt>Route speed</dt>
            <dd>{definition.speed.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Core impact</dt>
            <dd>{definition.coreDamage}</dd>
          </div>
          <div>
            <dt>Matter yield</dt>
            <dd>{definition.matterYield}</dd>
          </div>
        </dl>
        <ExposureResponses enemyType={selectedType} />
      </article>
    </section>
  );
};
