import {
  CircleHelp,
  Coins,
  FastForward,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Shield,
} from "lucide-react";
import { useCallback, useState } from "react";
import { levelDefinitionFor } from "../game/queries";
import { commandDecision as evaluateCommand } from "../presentation/selectors";
import { useGameStore } from "../application/store";
import type { GamePhase, GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";

const phases: Array<{ id: GamePhase; label: string }> = [
  { id: "build", label: "Plan" },
  { id: "prime", label: "Prime" },
  { id: "assault", label: "Locked assault" },
];

const phaseIndex = (phase: GamePhase): number => {
  const index = phases.findIndex((entry) => entry.id === phase);
  return index < 0 ? phases.length : index;
};

const BrandLockup = () => (
  <div className="brand-lockup" aria-label="Catalyst Castellum">
    <div className="brand-mark">
      <span />
      <span />
      <span />
    </div>
    <div>
      <p>Catalyst</p>
      <strong>Castellum</strong>
    </div>
    <span className="prototype-badge">CHLOR-ALKALI MVP</span>
  </div>
);

const CycleStatus = ({ game }: { game: GameState }) => {
  const currentIndex = phaseIndex(game.phase);
  const level = levelDefinitionFor(game);
  return (
    <div className="cycle-status">
      <div className="cycle-number">
        <span>
          Level {level.number} · {level.name}
        </span>
        <strong>
          Round {String(game.campaign.roundIndex + 1).padStart(2, "0")} /{" "}
          {String(level.rounds.length).padStart(2, "0")}
        </strong>
      </div>
      <ol className="phase-stepper" aria-label="Round phases">
        {phases.map((phase, index) => (
          <li
            key={phase.id}
            className={`${index === currentIndex ? "active" : ""} ${index < currentIndex ? "complete" : ""}`}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            <span className="step-dot">{index + 1}</span>
            <span>{phase.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

const StatusMeters = ({ game }: { game: GameState }) => (
  <div className="topbar-meters">
    <div className="compact-meter core-meter" data-testid="core-integrity">
      <div className="meter-heading">
        <span>
          <Shield size={13} /> Core
        </span>
        <strong>{Math.round(game.coreIntegrity)}%</strong>
      </div>
      <div className="meter-track">
        <span
          className={game.coreIntegrity <= 30 ? "critical" : ""}
          style={{ "--meter-width": `${game.coreIntegrity}%` }}
        />
      </div>
    </div>
    <div className="compact-meter matter-meter" data-testid="matter-balance">
      <div className="meter-heading">
        <span>
          <Coins size={13} /> Matter
        </span>
        <strong>{Math.floor(game.matter)}</strong>
      </div>
      <small>+{game.pendingMatter} pending harvest</small>
    </div>
  </div>
);

const RestartSaveConfirmation = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div
    className="topbar-inline-confirmation"
    role="group"
    aria-label="Confirm restart current save"
    data-testid="restart-save-confirmation"
  >
    <div>
      <strong>Restart this save?</strong>
      <span>Plant, campaign, and tutorial progress will return to the beginning.</span>
    </div>
    <div className="topbar-confirmation-actions">
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button
        className="destructive"
        type="button"
        data-testid="confirm-restart-save"
        onClick={onConfirm}
      >
        Restart save
      </button>
    </div>
  </div>
);

const GlobalControls = ({ game }: { game: GameState }) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const setShowHelp = useGameStore((state) => state.setShowHelp);
  const reset = useGameStore((state) => state.reset);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const pauseCommand = { type: "toggle_pause" } as const;
  const speedCommand = { type: "set_speed", speed: game.speed === 1 ? 2 : 1 } as const;
  const pauseDecision = evaluateCommand(game, pauseCommand);
  const speedDecision = evaluateCommand(game, speedCommand);
  const pauseLabel = game.paused ? "Resume simulation" : "Pause simulation";
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
        aria-label={pauseLabel}
        title={pauseLabel}
        disabled={!pauseDecision.allowed}
        onClick={() => dispatch(pauseCommand)}
      >
        {game.paused ? <Play size={17} /> : <Pause size={17} />}
      </button>
      <button
        className={`speed-button ${game.speed === 2 ? "active" : ""}`}
        type="button"
        data-testid="simulation-speed"
        data-tutorial-anchor={TUTORIAL_ANCHORS.simulationSpeed}
        aria-label={`Simulation speed ${game.speed}x`}
        title="Toggle simulation speed"
        disabled={!speedDecision.allowed}
        onClick={() => dispatch(speedCommand)}
      >
        <FastForward size={15} /> {game.speed}×
      </button>
      <span className="control-divider" />
      <button
        className="icon-button"
        type="button"
        aria-label="Return to save slots"
        title="Save slots"
        onClick={returnToMainMenu}
      >
        <LogOut size={17} />
      </button>
      <button
        className="icon-button"
        type="button"
        aria-label="Open process manual"
        title="Process manual"
        onClick={() => setShowHelp(true)}
      >
        <CircleHelp size={18} />
      </button>
      <button
        className="icon-button"
        type="button"
        aria-label="Restart current save"
        title="Restart current save"
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
