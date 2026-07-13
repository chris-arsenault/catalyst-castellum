import { CircleHelp, Coins, FastForward, Pause, Play, RotateCcw, Shield } from "lucide-react";
import { levelDefinitionFor } from "../game/simulation";
import { useGameStore } from "../game/store";
import type { GamePhase, GameState } from "../game/types";

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

const GlobalControls = ({ game }: { game: GameState }) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const setShowHelp = useGameStore((state) => state.setShowHelp);
  const reset = useGameStore((state) => state.reset);
  const simulationActive = game.phase === "prime" || game.phase === "assault";
  const pauseLabel = game.paused ? "Resume simulation" : "Pause simulation";
  const restart = () => {
    if (window.confirm("Restart the plant and discard all persistent process state?")) reset();
  };
  return (
    <div className="global-controls">
      <button
        className="icon-button"
        type="button"
        aria-label={pauseLabel}
        title={pauseLabel}
        disabled={!simulationActive}
        onClick={() => dispatch({ type: "toggle_pause" })}
      >
        {game.paused ? <Play size={17} /> : <Pause size={17} />}
      </button>
      <button
        className={`speed-button ${game.speed === 2 ? "active" : ""}`}
        type="button"
        data-testid="simulation-speed"
        aria-label={`Simulation speed ${game.speed}x`}
        title="Toggle simulation speed"
        disabled={!simulationActive}
        onClick={() => dispatch({ type: "set_speed", speed: game.speed === 1 ? 2 : 1 })}
      >
        <FastForward size={15} /> {game.speed}×
      </button>
      <span className="control-divider" />
      <button
        className="icon-button"
        type="button"
        aria-label="Open process manual"
        title="Process manual"
        onClick={() => setShowHelp(true)}
      >
        <CircleHelp size={18} />
      </button>
      <button className="icon-button" type="button" aria-label="Restart plant" onClick={restart}>
        <RotateCcw size={17} />
      </button>
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
