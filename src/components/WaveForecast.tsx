import { Route, Timer } from "lucide-react";
import { useGamePresentation } from "../application/presentationContext";
import type { GameState } from "../game/types";

const TraitList = ({ labels, label }: { labels: readonly string[]; label: string }) => {
  if (labels.length === 0) return null;
  return (
    <ul className="wave-forecast-traits" aria-label={label}>
      {labels.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
};

export const WaveForecastStrip = ({ game }: { game: GameState }) => {
  const { translator, waveForecast } = useGamePresentation();
  const forecast = waveForecast(game);
  return (
    <section className="wave-forecast-strip" data-testid="wave-forecast-strip">
      <header>
        <span>{translator.text("ui.waveForecast.kicker")}</span>
        <strong>{forecast.totalLabel}</strong>
      </header>
      <ul className="wave-forecast-composition">
        {forecast.composition.map((enemy) => (
          <li key={enemy.type}>
            <strong>{enemy.countLabel}</strong>
            <span>{enemy.levelLabel}</span>
          </li>
        ))}
      </ul>
      <div className="wave-forecast-route">
        <span>
          <Timer size={13} /> {forecast.cadenceLabel}
        </span>
        <span>
          <Route size={13} /> {forecast.approachLabel}
        </span>
      </div>
      <TraitList
        labels={forecast.traitLabels}
        label={translator.text("ui.waveForecast.formationTraits")}
      />
    </section>
  );
};

export const WaveForecastDetails = ({ game }: { game: GameState }) => {
  const { translator, waveForecast } = useGamePresentation();
  const forecast = waveForecast(game);
  return (
    <section className="wave-forecast-details" data-testid="wave-forecast-details">
      <div className="wave-forecast-details-heading">
        <div>
          <span>{translator.text("ui.waveForecast.kicker")}</span>
          <h3>{translator.text("ui.waveForecast.title")}</h3>
        </div>
        <strong>{forecast.totalLabel}</strong>
      </div>
      <div className="wave-forecast-facts">
        <div>
          <span>{translator.text("ui.waveForecast.approach")}</span>
          <strong>{forecast.approachLabel}</strong>
        </div>
        <div>
          <span>{translator.text("ui.waveForecast.arrivalPattern")}</span>
          <strong>{forecast.cadenceLabel}</strong>
          <small>
            {forecast.arrivalLabel} {forecast.timingLabel}
          </small>
        </div>
      </div>
      <div className="wave-forecast-details-section">
        <span>{translator.text("ui.waveForecast.composition")}</span>
        <ul className="wave-forecast-enemies">
          {forecast.composition.map((enemy) => (
            <li key={enemy.type}>
              <div>
                <strong>{enemy.countLabel}</strong>
                <span>{enemy.levelLabel}</span>
              </div>
              <p>{enemy.description}</p>
              <TraitList
                labels={enemy.traitLabels}
                label={translator.text("ui.waveForecast.formationTraits")}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
