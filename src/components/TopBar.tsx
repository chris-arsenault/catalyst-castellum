import {
  CircleHelp,
  Coins,
  FastForward,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useState } from "react";
import { setMuted, setMusicVolume, setSfxVolume, useAudioSettings } from "../audio";
import { levelDefinitionFor } from "../game/queries";
import { commandDecision as evaluateCommand } from "../presentation/selectors";
import { useGameStore } from "../application/store";
import type { GamePhase, GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";

const phaseLabel: Record<GamePhase, string> = {
  level_briefing: "Briefing",
  build: "Planning",
  prime: "Prime live",
  assault: "Assault",
  round_result: "Round result",
  level_complete: "Level complete",
  victory: "Victory",
  defeat: "Defeat",
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
  </div>
);

const CycleStatus = ({ game }: { game: GameState }) => {
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
      <span className={`topbar-phase phase-${game.phase}`}>{phaseLabel[game.phase]}</span>
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

const AudioControls = () => {
  const settings = useAudioSettings();
  const [open, setOpen] = useState(false);
  const muteLabel = settings.muted ? "Unmute audio" : "Mute audio";
  return (
    <div className="audio-controls" data-testid="audio-controls">
      <button
        className="icon-button"
        type="button"
        aria-label="Audio settings"
        title="Audio settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {settings.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
      {open && (
        <div className="audio-popover" role="group" aria-label="Audio settings">
          <label>
            <span>Music</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              aria-label="Music volume"
              onChange={(event) => setMusicVolume(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Effects</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              aria-label="Effects volume"
              onChange={(event) => setSfxVolume(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            data-testid="audio-mute-toggle"
            onClick={() => setMuted(!settings.muted)}
          >
            {settings.muted ? <Volume2 size={14} /> : <VolumeX size={14} />} {muteLabel}
          </button>
        </div>
      )}
    </div>
  );
};

const simulationPauseLabel = (game: GameState): string =>
  game.paused ? "Resume simulation" : "Pause simulation";

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
        aria-label={simulationPauseLabel(game)}
        title={simulationPauseLabel(game)}
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
      <AudioControls />
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
