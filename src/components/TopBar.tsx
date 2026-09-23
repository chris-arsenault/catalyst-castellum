import { Coins, FastForward, Pause, Play, RotateCcw, Shield } from "lucide-react";
import { useCallback, useState } from "react";
import { levelDefinitionFor } from "../game/queries";
import { useGameStore } from "../application/store";
import { simulationControlDecision } from "../application/simulationClock";
import { useGamePresentation } from "../application/presentationContext";
import type { GamePhase, GameState } from "../game/types";
import type { Translator } from "../localization/translator";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";
import { AudioControls, BrandLockup, EncyclopediaButton, SaveSlotsButton } from "./ShellControls";

const localizedPhaseLabel = (phase: GamePhase, translator: Translator): string => {
  const keys = {
    level_briefing: "ui.topbar.phase.briefing",
    build: "ui.topbar.phase.planning",
    assault: "ui.topbar.phase.assault",
    round_result: "ui.topbar.phase.roundResult",
    level_complete: "ui.topbar.phase.levelComplete",
    travel: "ui.topbar.phase.travel",
    victory: "ui.topbar.phase.victory",
    defeat: "ui.topbar.phase.defeat",
  } as const;
  return translator.text(keys[phase]);
};

const CycleStatus = ({ game }: { game: GameState }) => {
  const { levelCopy, translator } = useGamePresentation();
  const level = levelDefinitionFor(game);
  const copy = levelCopy.level(level);
  return (
    <div className="cycle-status">
      <div className="cycle-number">
        <span>{translator.text("ui.topbar.level", { level: level.number, name: copy.name })}</span>
        <strong>
          {translator.text("ui.topbar.round", {
            current: String(game.campaign.roundIndex + 1).padStart(2, "0"),
            total: String(level.rounds.length).padStart(2, "0"),
          })}
        </strong>
      </div>
      <span className={`topbar-phase phase-${game.phase}`}>
        {localizedPhaseLabel(game.phase, translator)}
      </span>
    </div>
  );
};

const StatusMeters = ({ game }: { game: GameState }) => {
  const { formatters, translator } = useGamePresentation();
  return (
    <div className="topbar-meters">
      <div className="compact-meter core-meter" data-testid="core-integrity">
        <div className="meter-heading">
          <span>
            <Shield size={13} /> {translator.text("ui.topbar.core")}
          </span>
          <strong>{formatters.percent(game.encounter.coreIntegrity / 100, 0)}</strong>
        </div>
        <div className="meter-track">
          <span
            className={game.encounter.coreIntegrity <= 30 ? "critical" : ""}
            style={{ "--meter-width": `${game.encounter.coreIntegrity}%` }}
          />
        </div>
      </div>
      <div className="compact-meter matter-meter" data-testid="matter-balance">
        <div className="meter-heading">
          <span>
            <Coins size={13} /> {translator.text("ui.topbar.matter")}
          </span>
          <strong>{formatters.number(Math.floor(game.encounter.matter), 0)}</strong>
        </div>
        <small>
          {translator.text("ui.topbar.pendingMatter", { matter: game.encounter.pendingMatter })}
        </small>
      </div>
    </div>
  );
};

const RestartSaveConfirmation = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div
      className="topbar-inline-confirmation"
      role="group"
      aria-label={translator.text("ui.topbar.restart.group")}
      data-testid="restart-save-confirmation"
    >
      <div>
        <strong>{translator.text("ui.topbar.restart.title")}</strong>
        <span>{translator.text("ui.topbar.restart.detail")}</span>
      </div>
      <div className="topbar-confirmation-actions">
        <button type="button" onClick={onCancel}>
          {translator.text("ui.topbar.cancel")}
        </button>
        <button
          className="destructive"
          type="button"
          data-testid="confirm-restart-save"
          onClick={onConfirm}
        >
          {translator.text("ui.topbar.restart.action")}
        </button>
      </div>
    </div>
  );
};

const simulationPauseLabel = (paused: boolean, translator: Translator): string =>
  translator.text(paused ? "ui.topbar.resume" : "ui.topbar.pause");

const GlobalControls = ({ game }: { game: GameState }) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const paused = useGameStore((state) => state.paused);
  const speed = useGameStore((state) => state.speed);
  const reset = useGameStore((state) => state.reset);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const pauseCommand = { type: "toggle_pause" } as const;
  const speedCommand = { type: "set_speed", speed: speed === 1 ? 2 : 1 } as const;
  const decision = simulationControlDecision(game);
  const restart = useCallback(() => {
    setConfirmingRestart(false);
    reset();
  }, [reset]);
  const cancelRestart = useCallback(() => setConfirmingRestart(false), []);
  return (
    <div className="global-controls">
      <button
        className="icon-button"
        type="button"
        aria-label={simulationPauseLabel(paused, translator)}
        title={simulationPauseLabel(paused, translator)}
        disabled={!decision.allowed}
        onClick={() => dispatch(pauseCommand)}
      >
        {paused ? <Play size={17} /> : <Pause size={17} />}
      </button>
      <button
        className={`speed-button ${speed === 2 ? "active" : ""}`}
        type="button"
        data-testid="simulation-speed"
        data-tutorial-anchor={TUTORIAL_ANCHORS.simulationSpeed}
        aria-label={translator.text("ui.topbar.speed", { speed })}
        title={translator.text("ui.topbar.toggleSpeed")}
        disabled={!decision.allowed}
        onClick={() => dispatch(speedCommand)}
      >
        <FastForward size={15} /> {speed}×
      </button>
      <span className="control-divider" />
      <AudioControls />
      <SaveSlotsButton />
      <EncyclopediaButton />
      <button
        className="icon-button"
        type="button"
        aria-label={translator.text("ui.topbar.restartCurrent")}
        title={translator.text("ui.topbar.restartCurrent")}
        aria-expanded={confirmingRestart}
        onClick={() => setConfirmingRestart((current) => !current)}
      >
        <RotateCcw size={17} />
      </button>
      {confirmingRestart && (
        <RestartSaveConfirmation onCancel={cancelRestart} onConfirm={restart} />
      )}
    </div>
  );
};

export const TopBar = () => {
  const game = useGameStore((state) => state.game);
  return (
    <header className="topbar">
      <BrandLockup />
      <CycleStatus game={game} />
      <StatusMeters game={game} />
      <GlobalControls game={game} />
    </header>
  );
};
