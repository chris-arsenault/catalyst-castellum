import { Activity, Shield } from "lucide-react";
import { useGamePresentation } from "../application/presentationContext";
import type { GameState } from "../game/types";
import type { ConduitDefensiveImpactCopy } from "../presentation/defensivePosture";

export const DefensivePostureStrip = ({ game }: { game: GameState }) => {
  const { defensivePosture, translator } = useGamePresentation();
  const posture = defensivePosture.current(game);
  return (
    <section className="defensive-posture-strip" data-testid="defensive-posture-strip">
      <header>
        <span>
          <Shield size={13} /> {translator.text("ui.posture.title")}
        </span>
        <small>{posture.basisLabel}</small>
      </header>
      <ul className="defensive-posture-enemies">
        {posture.enemies.map((enemy) => (
          <li key={enemy.type} data-posture-trend={enemy.trend}>
            <div className="defensive-posture-heading">
              <strong>{enemy.name}</strong>
              <em>{enemy.trendLabel}</em>
            </div>
            <span>{enemy.damageLabel}</span>
            {enemy.projectedDamageLabel && (
              <span className="defensive-posture-outlook">{enemy.projectedDamageLabel}</span>
            )}
            <progress
              className="defensive-posture-meter"
              aria-label={enemy.damageLabel}
              max={1}
              value={Math.min(1, enemy.damageRatio)}
            />
            {enemy.delaySeconds >= 0.05 && <small>{enemy.delayLabel}</small>}
            {enemy.rooms.length > 0 && (
              <div className="defensive-posture-rooms">
                {enemy.rooms.slice(0, 3).map((room) => (
                  <span key={room.roomId}>
                    {room.name} · {room.damageLabel}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p>{translator.text("ui.posture.exposureBasis")}</p>
    </section>
  );
};

export const ConduitDefensiveEffect = ({ impact }: { impact: ConduitDefensiveImpactCopy }) => (
  <section
    className={`conduit-defensive-effect tone-${impact.tone}`}
    data-testid={`conduit-defensive-effect-${impact.connectionId}`}
    data-posture-tone={impact.tone}
  >
    <header>
      <Shield size={13} />
      <strong>{impact.headline}</strong>
    </header>
    {impact.enemies.length > 0 && (
      <ul>
        {impact.enemies.map((enemy) => (
          <li key={enemy.type}>
            <strong>{enemy.name}</strong>
            <span>{enemy.damageLabel}</span>
            {enemy.delayLabel && <small>{enemy.delayLabel}</small>}
          </li>
        ))}
      </ul>
    )}
    {impact.equipment.slice(0, 2).map((equipment) => (
      <div className="conduit-support-effect" key={`${equipment.roomId}:${equipment.name}`}>
        <Activity size={11} />
        <span>
          <strong>{equipment.name}</strong> · {equipment.rateLabel}
        </span>
      </div>
    ))}
    <small className="conduit-effect-basis">{impact.basisLabel}</small>
  </section>
);
