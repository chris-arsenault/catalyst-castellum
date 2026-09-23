import { useState } from "react";
import { Pause, Play, FastForward } from "lucide-react";
import type { ExerciseState, ExerciseRuntime } from "../../game/exercise";
import type { ExerciseSessionController } from "../../application/useExerciseSession";
import { useEncounterControls } from "../../application/encounterSurface";
import { AudioControls } from "../AudioControls";

export const ExerciseHeader = ({
  state,
  runtime,
  controller,
}: {
  state: ExerciseState;
  runtime: ExerciseRuntime;
  controller: ExerciseSessionController;
}) => {
  const { presentation } = useEncounterControls();
  const { translator, formatters } = presentation;
  return (
    <header className="topbar exercise-header">
      <div>
        <strong>{translator.text("catalyst.title")}</strong>
        <p>
          {translator.text("catalyst.wave", {
            wave: state.waveIndex + 1,
            total: runtime.definition.waves.length,
          })}
        </p>
      </div>
      <div className="tower-stat-row">
        <strong>
          {translator.text("ui.topbar.matter")} {formatters.number(state.encounter.matter)}
        </strong>
        <strong>
          {translator.text("ui.topbar.core")} {formatters.number(state.encounter.coreIntegrity)}%
        </strong>
      </div>
      <ExerciseControls state={state} controller={controller} />
    </header>
  );
};

const ExerciseControls = ({
  state,
  controller,
}: {
  state: ExerciseState;
  controller: ExerciseSessionController;
}) => {
  const {
    presentation: { translator },
  } = useEncounterControls();
  const [restartOpen, setRestartOpen] = useState(false);
  const live = state.encounter.phase === "assault";
  return (
    <>
      {" "}
      <div className="global-controls">
        <button
          type="button"
          disabled={!live}
          aria-label={translator.text(controller.paused ? "ui.topbar.resume" : "ui.topbar.pause")}
          onClick={() => controller.setPaused(!controller.paused)}
        >
          {controller.paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button
          type="button"
          disabled={!live}
          data-testid="simulation-speed"
          aria-label={translator.text("ui.topbar.speed", { speed: controller.speed })}
          onClick={() => controller.setSpeed(controller.speed === 1 ? 2 : 1)}
        >
          <FastForward size={16} />
          {controller.speed}×
        </button>
        <AudioControls />
        <label>
          <input
            type="checkbox"
            checked={controller.reducedMotion}
            onChange={(event) => controller.setReducedMotion(event.currentTarget.checked)}
          />
          {translator.text("catalyst.reducedMotion")}
        </label>
        <button type="button" onClick={() => setRestartOpen(!restartOpen)}>
          {translator.text("catalyst.restart")}
        </button>
        <a className="menu-shortcut-button" href="./">
          {translator.text("catalyst.exit")}
        </a>
      </div>
      {restartOpen && (
        <div className="exercise-restart" role="group">
          <p>{translator.text("catalyst.restartDetail")}</p>
          <button
            type="button"
            onClick={() => {
              controller.dispatch({ type: "restart_exercise" });
              setRestartOpen(false);
            }}
          >
            {translator.text("catalyst.confirmRestart")}
          </button>
          <button type="button" onClick={() => setRestartOpen(false)}>
            {translator.text("ui.save.cancel")}
          </button>
        </div>
      )}
    </>
  );
};
