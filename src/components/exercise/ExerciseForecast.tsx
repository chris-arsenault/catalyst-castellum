import type { ExerciseRuntime, ExerciseState } from "../../game/exercise";
import { useEncounterControls } from "../../application/encounterSurface";
import { enemyCopy } from "../../presentation/entityCopy";

export const ExerciseForecast = ({
  state,
  runtime,
}: {
  state: ExerciseState;
  runtime: ExerciseRuntime;
}) => {
  const { presentation, focusedRouteId, focusRoute } = useEncounterControls();
  const { translator, enemyDefinition, formatters } = presentation;
  const context = runtime.context(state);
  const wave = context.definition.wave;
  const times = wave.map((spawn) => spawn.tick * context.combat.tickSeconds);
  const composition = [...new Set(wave.map((spawn) => spawn.type))];
  const routes = [...new Set(wave.map((spawn) => spawn.routeId))];
  return (
    <section className="exercise-forecast" aria-label={translator.text("ui.phaseHud.waveForecast")}>
      <h2>
        {translator.text(`catalyst.wave.${Math.min(4, state.waveIndex) as 0 | 1 | 2 | 3 | 4}`)}
      </h2>
      <p>
        {translator.text("catalyst.forecast", {
          count: wave.length,
          first: formatters.number(times[0] ?? 0, 1),
          last: formatters.number(times.at(-1) ?? 0, 1),
        })}
      </p>
      <ul>
        {composition.map((type) => (
          <li key={type}>
            {translator.text("catalyst.forecastEnemy", {
              name: enemyCopy(enemyDefinition(type), translator).name,
              count: wave.filter((spawn) => spawn.type === type).length,
            })}
          </li>
        ))}
      </ul>
      <ul>
        {routes.map((route) => {
          const entries = wave.filter((spawn) => spawn.routeId === route);
          return (
            <li key={route}>
              <button
                type="button"
                aria-pressed={focusedRouteId === route}
                onClick={() => focusRoute(focusedRouteId === route ? null : route)}
              >
                {translator.text("catalyst.forecastRoute", {
                  route,
                  count: entries.length,
                  first: formatters.number((entries[0]?.tick ?? 0) * context.combat.tickSeconds, 1),
                  last: formatters.number(
                    (entries.at(-1)?.tick ?? 0) * context.combat.tickSeconds,
                    1
                  ),
                })}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
