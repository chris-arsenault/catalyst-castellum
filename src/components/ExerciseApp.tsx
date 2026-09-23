import { useMemo } from "react";
import { createCatalystExerciseRuntime, type ExerciseRuntime } from "../game/exercise";
import { createTranslator } from "../localization/translator";
import { EN_LOCALE } from "../localization/locales/en";
import { createTacticalPresentation } from "../presentation/tactical";
import { EncounterSurfaceContext } from "../application/encounterSurface";
import type { ExerciseState } from "../game/exercise";
import type { ExerciseSessionController } from "../application/useExerciseSession";
import { useEncounterControls } from "../application/encounterSurface";
import { useExerciseSession } from "../application/useExerciseSession";
import { useExerciseAudio } from "../application/useExerciseAudio";
import { EncounterMap } from "./gameMap/EncounterMap";
import { EncounterTowerPanel } from "./EncounterTowerPanel";
import { ExerciseForecast } from "./exercise/ExerciseForecast";
import { ExerciseReport } from "./exercise/ExerciseReport";
import { ExerciseHeader } from "./exercise/ExerciseHeader";

const defaultRuntime = createCatalystExerciseRuntime();

export const ExerciseApp = ({ runtime }: { runtime: ExerciseRuntime }) => {
  const translator = useMemo(() => createTranslator(EN_LOCALE), []);
  const controller = useExerciseSession(runtime, translator);
  const state = controller.session?.state ?? null;
  useExerciseAudio(state);
  const presentation = useMemo(
    () => (state ? createTacticalPresentation(runtime.context(state), EN_LOCALE) : null),
    [runtime, state]
  );
  if (!state || !presentation)
    return (
      <main className="save-selection-loading">
        <h1>{translator.text("catalyst.title")}</h1>
        <p>{translator.text("catalyst.invalidSave")}</p>
        <button type="button" onClick={controller.startFresh}>
          {translator.text("catalyst.startFresh")}
        </button>
        <a href="./">{translator.text("catalyst.exit")}</a>
      </main>
    );
  return (
    <EncounterSurfaceContext.Provider
      value={{
        encounter: state.encounter,
        presentation,
        interaction: controller.interaction,
        setInteraction: controller.setInteraction,
        selectedRoomId: controller.selectedRoomId,
        selectRoom: controller.selectRoom,
        dispatch: controller.dispatch,
        currentEncounter: controller.currentEncounter,
        reducedMotion: controller.reducedMotion,
        focusedRouteId: controller.focusedRouteId,
        focusRoute: controller.focusRoute,
      }}
    >
      <div className="app-shell exercise-shell" data-testid="catalyst-exercise">
        <ExerciseHeader state={state} runtime={runtime} controller={controller} />
        <main className="workspace">
          <section className="defense-board">
            <ExerciseForecast state={state} runtime={runtime} />
            <ExerciseActions controller={controller} state={state} />
            <div className="map-stage-wrap">
              <EncounterMap />
              {controller.paused && (
                <div className="paused-overlay">
                  <strong>{translator.text("ui.app.paused.title")}</strong>
                </div>
              )}
            </div>
            <ExerciseReport state={state} runtime={runtime} controller={controller} />
          </section>
          <EncounterTowerPanel />
        </main>
        {controller.notice && (
          <p className="exercise-notice" role="alert">
            {controller.notice}
          </p>
        )}
        <p className="exercise-save-status" role="status">
          {translator.text(controller.saveFailed ? "catalyst.saveFailed" : "catalyst.saved")}
        </p>
      </div>
    </EncounterSurfaceContext.Provider>
  );
};

const ExerciseActions = ({
  controller,
  state,
}: {
  controller: ExerciseSessionController;
  state: ExerciseState;
}) => {
  const { presentation } = useEncounterControls();
  const { translator } = presentation;
  const waveIndex = state.waveIndex;
  const guidanceKey = `catalyst.guide.${Math.min(4, waveIndex) as 0 | 1 | 2 | 3 | 4}` as const;
  const start = { type: "start_assault" } as const;
  const decision = presentation.evaluate(state.encounter, start);

  return (
    <>
      {" "}
      <div className="exercise-actions">
        {state.encounter.phase === "build" && (
          <button
            className="primary-action"
            type="button"
            data-testid="start-assault"
            disabled={!decision.allowed}
            onClick={() => controller.dispatch(start)}
          >
            {translator.text("ui.phaseHud.startAssault")}
          </button>
        )}
        <label>
          <input
            type="checkbox"
            checked={controller.session!.guidance}
            onChange={(event) => controller.setGuidance(event.currentTarget.checked)}
          />
          {translator.text("catalyst.guidance")}
        </label>
      </div>
      {controller.session!.guidance && waveIndex < 4 && (
        <p className="exercise-guidance" role="status">
          {translator.text(guidanceKey)}
          {controller.session!.evidence.includes(
            ["coverage", "charge", "field", "discharge"][waveIndex]!
          ) && <strong> {translator.text("catalyst.guidanceObserved")}</strong>}
        </p>
      )}
    </>
  );
};

const DefaultExerciseApp = () => <ExerciseApp runtime={defaultRuntime} />;
export default DefaultExerciseApp;
