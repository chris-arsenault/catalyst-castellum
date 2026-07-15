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
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { GamePhase, GameState } from "../game/types";
import type { Translator } from "../localization/translator";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";

const localizedPhaseLabel = (phase: GamePhase, translator: Translator): string => {
  const keys = {
    level_briefing: "ui.topbar.phase.briefing",
    build: "ui.topbar.phase.planning",
    prime: "ui.topbar.phase.prime",
    assault: "ui.topbar.phase.assault",
    round_result: "ui.topbar.phase.roundResult",
    level_complete: "ui.topbar.phase.levelComplete",
    travel: "ui.topbar.phase.travel",
    victory: "ui.topbar.phase.victory",
    defeat: "ui.topbar.phase.defeat",
  } as const;
  return translator.text(keys[phase]);
};

const BrandLockup = () => {
  const { translator } = useGamePresentation();
  return (
    <div className="brand-lockup" aria-label={translator.text("ui.brand.name")}>
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <p>{translator.text("ui.brand.first")}</p>
        <strong>{translator.text("ui.brand.second")}</strong>
      </div>
    </div>
  );
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
          <strong>{formatters.percent(game.coreIntegrity / 100, 0)}</strong>
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
            <Coins size={13} /> {translator.text("ui.topbar.matter")}
          </span>
          <strong>{formatters.number(Math.floor(game.matter), 0)}</strong>
        </div>
        <small>{translator.text("ui.topbar.pendingMatter", { matter: game.pendingMatter })}</small>
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

const AudioControls = () => {
  const { translator } = useGamePresentation();
  const settings = useAudioSettings();
  const [open, setOpen] = useState(false);
  const muteLabel = translator.text(
    settings.muted ? "ui.topbar.audio.unmute" : "ui.topbar.audio.mute"
  );
  return (
    <div className="audio-controls" data-testid="audio-controls">
      <button
        className="icon-button"
        type="button"
        aria-label={translator.text("ui.topbar.audio.settings")}
        title={translator.text("ui.topbar.audio.settings")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {settings.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
      {open && (
        <div
          className="audio-popover"
          role="group"
          aria-label={translator.text("ui.topbar.audio.settings")}
        >
          <label>
            <span>{translator.text("ui.topbar.audio.music")}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              aria-label={translator.text("ui.topbar.audio.musicVolume")}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
            />
          </label>
          <label>
            <span>{translator.text("ui.topbar.audio.effects")}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              aria-label={translator.text("ui.topbar.audio.effectsVolume")}
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

const simulationPauseLabel = (game: GameState, translator: Translator): string =>
  translator.text(game.paused ? "ui.topbar.resume" : "ui.topbar.pause");

const SaveSlotsButton = ({ onClick }: { onClick: () => void }) => {
  const { translator } = useGamePresentation();
  return (
    <button
      className="menu-shortcut-button"
      type="button"
      aria-label={translator.text("ui.topbar.returnSaveSlots")}
      data-testid="save-slots-button"
      title={translator.text("ui.topbar.saveSlots")}
      onClick={onClick}
    >
      <LogOut size={17} /> <span>{translator.text("ui.topbar.saveSlots")}</span>
    </button>
  );
};

const GlobalControls = ({ game }: { game: GameState }) => {
  const { selectors, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const openManual = useGameStore((state) => state.openManual);
  const reset = useGameStore((state) => state.reset);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const pauseCommand = { type: "toggle_pause" } as const;
  const speedCommand = { type: "set_speed", speed: game.speed === 1 ? 2 : 1 } as const;
  const pauseDecision = selectors.commandDecision(game, pauseCommand);
  const speedDecision = selectors.commandDecision(game, speedCommand);
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
        aria-label={simulationPauseLabel(game, translator)}
        title={simulationPauseLabel(game, translator)}
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
        aria-label={translator.text("ui.topbar.speed", { speed: game.speed })}
        title={translator.text("ui.topbar.toggleSpeed")}
        disabled={!speedDecision.allowed}
        onClick={() => dispatch(speedCommand)}
      >
        <FastForward size={15} /> {game.speed}×
      </button>
      <span className="control-divider" />
      <AudioControls />
      <SaveSlotsButton onClick={returnToMainMenu} />
      <button
        className="icon-button"
        type="button"
        aria-label={translator.text("ui.topbar.openManual")}
        title={translator.text("ui.topbar.manual")}
        onClick={() => openManual("operations")}
      >
        <CircleHelp size={18} />
      </button>
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
